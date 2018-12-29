window.browser = window.msBrowser || window.browser || window.chrome;

const activeScrollReader = (tab) => {
    browser.tabs.sendMessage(tab.id, 'active-scroll-reader');
};

browser.browserAction.onClicked.addListener(activeScrollReader);
