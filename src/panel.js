// get currently active tab in currently active window
// query the background script for the links for this tab
// listen for changes to this
"use strict";

function makeLink(link){
    const a = document.createElement("a");
    a.style = link.style;
    a.title = link.title;
    a.href = link.href;
    a.innerText = link.text;
    return a;
}

function populatePanel(links){
    const section = document.querySelector("section");
    links.forEach(link => {
        section.appendChild(makeLink(link));
    });
}

// remark: may be able to get away with activeTab only if doing everything in background script browseraction on click and then querying that when panel opens
function runOnActivePage(){
    chrome.tabs.executeScript({
        file: "content.js"
    }, results => {
        populatePanel(results[0]);
    });
}

document.querySelector("#refresh").addEventListener("click", runOnActivePage);
document.querySelector("#refresh").innerText = chrome.i18n.getMessage("refresh");
document.head.title = chrome.i18n.getMessage("name");
