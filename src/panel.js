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
    const panelLink = $$("a");
    panelLink.style = link.style;
    const tipTitle = link.title ? link.title : link.text;
    panelLink.title = (tipTitle===link.href) ? link.href : `Title: ${tipTitle}
Link: ${link.href}`;
    panelLink.innerText = link.text;
    panelLink.target = "_blank";
    panelLink.href = link.href;
    /*panelLink.addEventListener("click", e => {
        chrome.tabs.create({url: link.href});
    });*/
    return panelLink;
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
async function populatePanel(links){
    const section = $("section");
    section.parentElement.removeChild(section);
    const section2 = $$("section");
    if(links.length===0){
        document.body.appendChild(section2);
        makeInfoItem(chrome.i18n.getMessage("noLinks"));
        return;
    }
    links.forEach(link => {
        section2.appendChild(makeLink(link));
    });
    document.body.appendChild(section2);
}

/**
 * Filter all the link details and only show those beign searched for
 * REMARK: Currently searches for match in any of title, text, href
 */
function search(){
    chrome.storage.sync.get({
        url: false,
        title: true,
        text: true,
        case: false
    }, items => {
        const searchTerm = $("input").value;
        const validLinks = [];
        CURRENT_LINKS.forEach(link => {
            const term = items.case ? searchTerm : searchTerm.toLowerCase();
            const url = items.url && (items.case ? link.href : link.href.toLowerCase()).indexOf(term) > -1;
            const title = items.title && (items.case ? link.title : link.title.toLowerCase()).indexOf(term) > -1;
            const text = items.text && (items.case ? link.text : link.text.toLowerCase()).indexOf(term) > -1;
            if(url || title || text){
                validLinks.push(link);
            }
        });
        populatePanel(validLinks);
    });
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
        if($("input").value===""){
            populatePanel(links);
        } else {
            search();
        }
    }
}

/**
 * Display an information item in panel
 * @param info string
 */
function clearLinksAndInfo(info){
    if(!isLocked()){
        CURRENT_LINKS = [];
        const section = $("section");
        section.parentElement.removeChild(section);
        const section2 = $$("section");
        document.body.appendChild(section2);
        makeInfoItem(info);
    }
}

/**
 * When a tab is updated, check links again (if tab is active)
 * @param tabId
 * @param info what changed about the tab
 * @param tab the tab object
 */
function onTabUpdate(tabId, info, tab){
    chrome.windows.getLastFocused(window => {
        const tabWindowOnTop = tab.windowId == window.id;
        if(tabWindowOnTop && tab.active){
            requestLinksFromTabs(tabId);
        }
    });
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
 */
function requestLinksFromTabs(tabId){
    chrome.tabs.sendMessage(tabId, {
        panelWantsLinks: true
    }, {}, response => {
        if(!response){
            clearLinksAndInfo(chrome.i18n.getMessage("failed"));
        }
    });
}

/**
 * Panel first activated, get links from active tab
 */
function requestLinksFromActiveTab(){
    chrome.tabs.query({active:true, lastFocusedWindow: true, windowType: "normal"}, tabs => {
        if(tabs[0]){
            requestLinksFromTabs(tabs[0].id);
        } else {
            console.warn("No valid active tab. Focus may be in dev tools, or tab didn't load.")
        }
    });
}

/**
 * Receieve a message - will probably be a request to get links
 * @param message
 * @param sender
 */
function onMessage(message, sender){
    chrome.windows.getLastFocused({}, window => {
        if(sender.tab && sender.tab.active && sender.tab.windowId===window.id){
            if(message.someLinks){
                updateCurrentLinks(message.someLinks);
            }
        }
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
$("#options").addEventListener("click", () => chrome.runtime.openOptionsPage());
$("#options").title = chrome.i18n.getMessage("options");
document.title = chrome.i18n.getMessage("name");

chrome.tabs.onActivated.addListener(onTabActivate);
chrome.tabs.onUpdated.addListener(onTabUpdate);
chrome.windows.onFocusChanged.addListener(requestLinksFromActiveTab);
chrome.runtime.onMessage.addListener(onMessage);

requestLinksFromActiveTab();
