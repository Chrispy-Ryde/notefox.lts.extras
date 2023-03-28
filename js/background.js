const icons = ["../img/icon.svg", "../img/icon-bordered.svg"];
var settings_json = {};
var websites_json = {};

var tab_id = 0;
var tab_url = "";

function changeIcon(index) {
    browser.browserAction.setIcon({path: icons[index], tabId: tab_id});
}

function loaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        tab_id = activeTab.id;
        tab_url = activeTab.url;

        //catch changing of tab
        browser.tabs.onActivated.addListener(tabUpdated);
        browser.tabs.onUpdated.addListener(tabUpdated);

        browser.runtime.onMessage.addListener((message) => {
            if (message["updated"] != undefined && message["updated"]) {
                checkStatus();
            }
        });

        listenerShortcuts();
        checkStatus();
    });
}

function tabUpdated(tabs) {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        tab_id = tabs[0].tabId;
        tab_url = tabs[0].url;
    }).then((tabs) => {
        checkStatus();
    });
}

function checkStatus() {
    browser.storage.local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "yes";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "yes";
        }

        continueCheckStatus();
        //console.log(JSON.stringify(settings_json));
    });
}

function continueCheckStatus() {
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] != undefined) {
            websites_json = value["websites"];

            let domain_url = getShortUrl(tab_url);

            if (websites_json[domain_url] !== undefined && websites_json[domain_url]["last-update"] !== undefined && websites_json[domain_url]["last-update"] != null && websites_json[domain_url]["notes"] !== undefined && websites_json[domain_url]["notes"] !== "") {
                changeIcon(1);
            } else if (websites_json[getPageUrl(tab_url)] !== undefined && websites_json[getPageUrl(tab_url)]["last-update"] !== undefined && websites_json[getPageUrl(tab_url)]["last-update"] != null && websites_json[getPageUrl(tab_url)]["notes"] !== undefined && websites_json[getPageUrl(tab_url)]["notes"] !== "") {
                changeIcon(1);
            } else {
                changeIcon(0);
            }
        } else {
            changeIcon(0);
        }

        //console.log(JSON.stringify(websites_json));
    });
}

function getShortUrl(url) {
    let urlToReturn = "";
    let protocol = getTheProtocol(url);
    if (url.includes(":")) {
        urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }

    if (urlToReturn.includes("/")) {
        urlPartsTemp = urlToReturn.split("/");
        if (urlPartsTemp[0] == "" && urlPartsTemp[1] == "") {
            urlToReturn = urlPartsTemp[2];
        }
    }

    return (protocol + "://" + urlToReturn);
}

function getPageUrl(url) {
    let urlToReturn = url;

    //https://page.example/search#section1
    if (settings_json["consider-sections"] === "no") {
        if (url.includes("#"))
            urlToReturn = urlToReturn.split("#")[0];
    }

    //https://page.example/search?parameters
    if (settings_json["consider-parameters"] === "no") {
        if (url.includes("?"))
            urlToReturn = urlToReturn.split("?")[0];
    }

    //console.log(urlToReturn);
    return urlToReturn;
}

function getTheProtocol(url) {
    return url.split(":")[0];
}

function listenerShortcuts() {
    browser.commands.onCommand.addListener((command) => {
        if (command === "opened-by-domain") {
            //domain
            browser.browserAction.openPopup();
            browser.storage.local.set({"opened-by-shortcut": "domain"});
        } else if (command === "opened-by-page") {
            //page
            browser.browserAction.openPopup();
            browser.storage.local.set({"opened-by-shortcut": "page"});
        }
    });
}

loaded();