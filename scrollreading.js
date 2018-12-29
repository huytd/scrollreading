window.browser = window.msBrowser || window.browser || window.chrome;

const WORD_DELAY = 200;
let readPos = 0;
let totalWords = 0;
let readingMode = false;
let lastActiveWord = null;

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

const isPunctuation = (word) => {
    if (word.length > 1) return false;
    const punctuations = ".,;?:!";
    return punctuations.indexOf(word) !== -1;
}

const getTagInfo = (string) => {
    const regex = /<([\w]+)[^>]*>(.*?)<\/\1>/
    const match = string.match(regex)
    return {
        tagName: match[1],
        textContent: match[2]
    }
}

const activeScrollReader = () => {
    if (!readingMode) {
        readingMode = true;

        $("p, h1, h2, h3, h4, h5, h6").each(function(){
            let finalHTML = [];
            let contents = $(this).contents();
            for (let i = 0; i < contents.length; i++) {
                let elem = contents[i];
                if (elem.nodeName === "#text") {
                    let text = $(elem).text().split(/(?=\.\s|,\s|;\s|\?\s|\!\s)/g);
                    // the text is a punctuation then append it to the last text node
                    if (text.length === 1 && isPunctuation(text[0])) {
                        const lastHTML = finalHTML[finalHTML.length - 1];
                        const lastWord = getTagInfo(lastHTML).textContent;
                        finalHTML[finalHTML.length - 1] = `<span class="scrollreading-word">${lastWord}${text}</span>`;
                        continue;
                    }
                    const textArray = []
                    text.forEach((word) => {
                        if (word.replace(/\s/, '').length) {
                            const totalWords = textArray.length;
                            const lastIndex = totalWords - 1;
                            const isWordStartWithPunctuation = isPunctuation(word[0])

                            if (isWordStartWithPunctuation) {
                                const hasPreviousText = !!textArray[lastIndex];

                                const lastHTML = hasPreviousText
                                    ? textArray[lastIndex]
                                    : finalHTML[finalHTML.length - 1];

                                const tagInfo = getTagInfo(lastHTML);

                                if (hasPreviousText) {
                                    // the previous text node does exists
                                    // then we shall append the punctuation to it
                                    const lastWord = tagInfo.textContent;
                                    textArray[lastIndex] = `<span class="scrollreading-word">${lastWord}${word[0]}</span>`
                                } else {
                                    // previous text sentence is not found
                                    // which means the previous sentence is in an html tag
                                    // and not a text node so we have to append it to that
                                    // last html tag
                                    const lastTag = finalHTML[finalHTML.length - 1];
                                    const tagName = tagInfo.tagName;
                                    const closeTag = `</${tagName}>`;
                                    const openTagAndLastWord = lastTag.substring(0, lastTag.length - closeTag.length);
                                    const newTag = `${openTagAndLastWord}${word[0]}${closeTag}`;
                                    finalHTML[finalHTML.length - 1] = newTag;
                                }
                            }
                            // if the word start with punctuation then that
                            // punctuation should be removed
                            const finalWord = isWordStartWithPunctuation
                                ? word.slice(1)
                                : word;
                            // for cases like ,\s when , is gone there's only \s left
                            if (finalWord.replace(/\s/, '').length) {
                                textArray.push(`<span class="scrollreading-word">${finalWord}</span>`);
                            } else {
                                textArray.push(finalWord);
                            }
                        }
                    });
                    text = textArray.join('');
                    finalHTML.push(text);
                } else {
                    const isElementHasText = !!$(elem)[0].textContent
                    const elementClassName = isElementHasText
                        ? "scrollreading-word"
                        : ""
                    const element = $(elem).addClass(elementClassName)[0]
                    finalHTML.push(element.outerHTML);
                }
            }
            $(this).html(finalHTML.join(""));
        });

        $('html,body').css('cursor','crosshair');
        const readerIndicator = $(`<div class="scrollreading-status-indicator"></div>`);
        $('body').append(readerIndicator);

        const mouseWheelHandler = e => {
            if (!$(".scrollreading-word.active-word").length) return;
            e.preventDefault();
            next_word(e);
        };

        const keyboardHandler = e => {
            let keyCode = e.which || e.keyCode;
            if (keyCode === 39 || keyCode === 40 || keyCode === 68 || keyCode === 83) {
                // right/down/s/d = next
                e.deltaY = 1;
                e.preventDefault();
                next_word(e);
            }
            else if (keyCode === 38 || keyCode === 37 || keyCode === 65 || keyCode === 87) {
                // up/left/a/w = prev
                e.deltaY = -1;
                e.preventDefault();
                next_word(e);
            }
            // Do not block the keyboard event if nothing matched
        };

        const turnOn = (elem) => { 
            $(".scrollreading-word.active-word").removeClass("active-word");
            elem.addClass("active-word");
            $(".scrollreading-status-indicator").addClass("activated");
            window.addEventListener('wheel', mouseWheelHandler);
            window.addEventListener('keydown', keyboardHandler);
        };

        const turnOff = () => { 
            lastActiveWord = $(".active-word")[0];
            $(".active-word").removeClass("active-word");
            $(".scrollreading-status-indicator").removeClass("activated");
            window.removeEventListener('wheel', mouseWheelHandler);
            window.removeEventListener('keydown', keyboardHandler);
        };

        $(".scrollreading-word").on('click', function() {
            if ($(this).hasClass("active-word")) {
                turnOff();
            } else {
                turnOn($(this));
            }
        });

        $(".scrollreading-status-indicator").on('click', function() {
            if ($(this).hasClass("activated")) {
                turnOff();
            } else {
                turnOn($(lastActiveWord));
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
            if (!next.hasClass('scrollreading-word')) {
                next = get_next(next);
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
            if (!prev.hasClass('scrollreading-word')) {
                prev = get_prev(prev);
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
