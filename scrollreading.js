const WORD_DELAY = 100;
let readPos = 0;
let totalWords = 0;
let readingMode = false;

$.fn.scrollView = function () {
    return this.each(function () {
        $('html, body').scrollTop($(this).offset().top - screen.height / 4);
    });
};

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

const activeScrollReader = () => {
    if (!readingMode) {
        readingMode = true;

        $("p").each(function(){
            let finalHTML = [];
            let contents = $(this).contents();
            for (let i = 0; i < contents.length; i++) {
                let elem = contents[i];
                if (elem.nodeName === "#text") {
                    let text = $(elem).text().split(/(?=\.|,|\?|\!)/g).reduce((words, word) => {
                        if (word.length) words.push(`<span class="reaid-word">${word}</span>`);
                        return words;
                    }, []).join("");
                    finalHTML.push(text);
                } else {
                    finalHTML.push($(elem).addClass("reaid-word")[0].outerHTML);
                }
            }
            $(this).html(finalHTML.join(" "));
        });

        $('html,body').css('cursor','crosshair');

        window.addEventListener('wheel', (e) => {
            if (!$(".reaid-word.active").length) return;
            e.preventDefault();
            next_word(e);
        });

        $(window).on('keydown', e => {
            // L or W
            if (e.which === 76 || e.which === 87) {
                // next
                e.deltaY = 1;
            } else
                // H or B
                if (e.which === 72 || e.which === 66) {
                // prev
                e.deltaY = -1;
            }
            e.preventDefault();
            next_word(e);
        });

        $(".reaid-word").on('click', function() {
            if ($(this).hasClass("active")) {
                $(this).removeClass("active");
                return;
            } else {
                $(".reaid-word.active").removeClass("active");
                $(this).addClass("active");
            }
        });

        const get_next = e => {
            let next = e.next();
            if (!next.length) {
                next = e.parent().next().find(".reaid-word:eq(0)");
            }
            return next;
        };

        const get_prev = e => {
            let prev = e.prev();
            if (!prev.length) {
                prev = e.parent().prev().find(".reaid-word:last-child");
            }
            return prev;
        };

        const next_word = throttle((e) => {
            let next = (e.deltaY > 0) ? true : false;
            let curr = $(".reaid-word.active");
            let target = next ? get_next(curr) : get_prev(curr);
            if (target.length) {
                target.addClass("active");
                let top = target.offset().top;
                let currTop = $("html, body").scrollTop();
                if ( top <= currTop || top >= (currTop + screen.height / 2 + screen.height / 5)) {
                    target.scrollView();
                }
                curr.removeClass("active");
            }
        }, WORD_DELAY);

    } else {
        window.location = window.location.href;
    }
};

browser.runtime.onMessage.addListener((e) => {
    if (e === "active-scroll-reader") {
        activeScrollReader();
    }
});
