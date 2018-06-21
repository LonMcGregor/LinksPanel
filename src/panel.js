"use strict";

/* Aliases for sanity */
const $ = document.querySelector.bind(document);
const $a = document.querySelectorAll.bind(document);
const $$ = document.createElement.bind(document);

let CURRENT_LINKS;

/**
 * Create a <span> for a specific link
 * @param link details
 * @returns span DOM node
 */
function makeLink(link){
    const span = $$("span");
    span.style = link.style;
    const tipTitle = link.title ? link.title : link.text;
    span.title = (tipTitle===link.href) ? link.href : `Title: ${tipTitle}
Link: ${link.href}`;
    span.innerText = link.text;
    span.addEventListener("click", e => {
        chrome.tabs.create({url: link.href});
    });
    return span;
}

/**
 * Remove everything from the panel section
 */
function emptyLinks(){
    const section = $("section");
    $a("section *").forEach(span => {
        section.removeChild(span);
    });
}

/**
 * Add an info item to the panel
 * @param info the text to show
 */
function makeInfoItem(info){
    const p = $$("p");
    p.innerText = info;
    $("section").appendChild(p);
}

/**
 * Given the array of link details,populate the panel
 * @param [links details] to put into the panel
 */
function populatePanel(links){
    emptyLinks();
    const section = $("section");
    if(links.length===0){
        makeInfoItem(chrome.i18n.getMessage("noLinks"));
        return;
    }
    links.forEach(link => {
        section.appendChild(makeLink(link));
    });
}

/**
 * Filter all the link details and only show those beign searched for
 * REMARK: Currently searches for match in any of title, text, href
 */
function search(){
    const searchTerm = $("input").value;
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

/**
 * State of panel as per lock button
 * @returns boolean
 */
function isLocked(){
    return $('#lock.hidden');
}

/**
 * Toggle the lock state
 */
function toggleLock(){
    $("#lock").classList.toggle("hidden");
    $("#unlock").classList.toggle("hidden");
}

/**
 * Received an array of link details to put in panel
 * @param links array details
 */
function updateCurrentLinks(links){
    if(!isLocked()){
        CURRENT_LINKS = links;
        populatePanel(links);
    }
}

/**
 * Display an information item in panel
 * @param info string
 */
function clearLinksAndInfo(info){
    if(!isLocked()){
        CURRENT_LINKS = [];
        emptyLinks();
        makeInfoItem(info);
    }
}


/**
 * When a new tab is activated change what is in the panel
 * @param info A tab was activated
 */
function onTabActivate(info){
    chrome.windows.getLastFocused(window => {
        const tabWindowOnTop = info.windowId == window.id;
        if(tabWindowOnTop){
            requestLinksFromTabs(info.tabId);
        }
    });
}

/**
 * Try to inject the content script, and then request the links
 */
function injectContentScript(tabId, attempts){
    chrome.tabs.executeScript(tabId, {
        file: "content.js"
    }, () => {
        requestLinksFromTabs(tabId, attempts);
    });
}

/**
 * Try to get links from a tab. give up if it fails after 2 tries.
 * @param tabId
 * @param attempts how many tries to inject the script.
 */
function requestLinksFromTabs(tabId, attempts){
    if(!attempts){
        attempts = 0;
    }
    if(attempts > 2){
        clearLinksAndInfo(chrome.i18n.getMessage("failed"));
        return;
    }
    chrome.tabs.sendMessage(tabId, {
        panelWantsLinks: true
    }, {}, links => {
        if(links===undefined){
            injectContentScript(tabId, attempts + 1);
        } else {
            updateCurrentLinks(links);
        }
    });
}

/**
 * Panel first activated, get links from active tab
 */
function requestLinksFromActiveTab(){
    chrome.tabs.query({active:true, lastFocusedWindow: true}, tabs => {
        requestLinksFromTabs(tabs[0].id);
    });
}

/**
 * Init page i18n and listeners
 */
$("#lock").addEventListener("click", toggleLock);
$("#lock").innerText = chrome.i18n.getMessage("lock");
$("#unlock").addEventListener("click", toggleLock);
$("#unlock").innerText = chrome.i18n.getMessage("unlock");
$("input").addEventListener("input", search);
$("input").placeholder = chrome.i18n.getMessage("search");
document.title = chrome.i18n.getMessage("name");

chrome.tabs.onActivated.addListener(onTabActivate);

requestLinksFromActiveTab();
