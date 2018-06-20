// get currently active tab in currently active window
// query the background script for the links for this tab //want to only query current tab by window
// listen for changes to this
"use strict";

let CURRENT_LINKS;

function makeLink(link){
    const span = document.createElement("span");
    span.style = link.style;
    const tipTitle = link.title ? link.title : link.text;
    span.title = `Title: ${tipTitle}
Link: ${link.href}`;
    span.innerText = link.text;
    span.addEventListener("click", e => {
        chrome.tabs.create({url: link.href});
    });
    return span;
}

function populatePanel(links){
    const section = document.querySelector("section");
    document.querySelectorAll("section span").forEach(span => {
        section.removeChild(span);
    });
    links.forEach(link => {
        section.appendChild(makeLink(link));
    });
}

// opera links has a search, downloads button, tooltip shows title and address, lock/unlock

// remark: may be able to get away with activeTab only if doing everything in background script browseraction on click and then querying that when panel opens
function runOnActivePage(){
    chrome.tabs.executeScript({
        file: "content.js"
    }, results => {
        CURRENT_LINKS = results[0];
        populatePanel(results[0]);
    });
}

function search(){
    const searchTerm = document.querySelector("input").value;
    const validLinks = [];
    CURRENT_LINKS.forEach(link => {
        if(link.href.indexOf(searchTerm) > -1 ||
           link.title.indexOf(searchTerm) > -1 ||
           link.text.indexOf(searchTerm) > -1){
               validLinks.push(link);
           }
    }); //optimise search?
    populatePanel(validLinks);
}

document.querySelector("#refresh").addEventListener("click", runOnActivePage);
document.querySelector("#refresh").innerText = chrome.i18n.getMessage("refresh");
document.querySelector("input").placeholder = chrome.i18n.getMessage("search");
document.querySelector("input").addEventListener("input", search);
document.head.title = chrome.i18n.getMessage("name");
