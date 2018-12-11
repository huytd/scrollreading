const WORD_DELAY = 200;
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

        $("p, h1, h2, h3, h4, h5, h6").each(function(){
            let finalHTML = [];
            let contents = $(this).contents();
            for (let i = 0; i < contents.length; i++) {
                let elem = contents[i];
                if (elem.nodeName === "#text") {
                    let text = $(elem).text().split(/(?=\.\s|,\s|;\s|\?\s|\!\s)/g).reduce((words, word) => {
                        if (word.length) words.push(`<span class="scrollreading-word">${word}</span>`);
                        return words;
                    }, []).join("");
                    finalHTML.push(text);
                } else {
                    finalHTML.push($(elem).addClass("scrollreading-word")[0].outerHTML);
                }
            }
            $(this).html(finalHTML.join(""));
        });

        $('html,body').css('cursor','crosshair');

        window.addEventListener('wheel', (e) => {
            if (!$(".scrollreading-word.active-word").length) return;
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

        $(".scrollreading-word").on('click', function() {
            if ($(this).hasClass("active-word")) {
                $(this).removeClass("active-word");
                return;
            } else {
                $(".scrollreading-word.active-word").removeClass("active-word");
                $(this).addClass("active-word");
            }
        });

        const get_next = e => {
            let next = e.next();
            if (!next.length) {
                let nexts = e.parent().nextUntil("");
                for (let i = 0; i < nexts.length; i++) {
                    let elem = $(nexts[i]);
                    if (elem.has(".scrollreading-word").length) {
                        next = elem.find(".scrollreading-word:eq(0)"); break;
                    }
                }
            }
            return next;
        };

        const get_prev = e => {
            let prev = e.prev();
            if (!prev.length) {
                let prevs = e.parent().prevUntil("");
                for (let i = 0; i < prevs.length; i++) {
                    let elem = $(prevs[i]);
                    if (elem.has(".scrollreading-word").length) {
                        prev = elem.find(".scrollreading-word:last-child"); break;
                    }
                }
            }
            return prev;
        };

        const next_word = throttle((e) => {
            let next = (e.deltaY > 0) ? true : false;
            let curr = $(".scrollreading-word.active-word");
            let target = next ? get_next(curr) : get_prev(curr);
            if (target.length) {
                target.addClass("active-word");
                let top = target.offset().top;
                let currTop = $("html, body").scrollTop();
                if ( top <= currTop || top >= (currTop + screen.height / 2 + screen.height / 5)) {
                    target.scrollView();
                }
                curr.removeClass("active-word");
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
