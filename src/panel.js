"use strict";

let CURRENT_LINKS;

/**
 * Create a <span> for a specific link
 * @param link details
 * @param index a number identifying where in the list this link is
 * @returns span DOM node
 */
function makeLink(link, index){
    const panelLink = document.createElement("a");
    panelLink.style = link.style;
    const tipTitle = link.title ? link.title : link.text;
    panelLink.title = (tipTitle===link.href) ? link.href : `Title: ${tipTitle}
Link: ${link.href}`;
    panelLink.innerText = link.text;
    panelLink.target = "_blank";
    panelLink.href = link.href;
    panelLink.id = index;
    panelLink.addEventListener("click", multiSelectLinks);
    return panelLink;
}

/**
 * Handle multiple selection of links
 * @param {MouseEvent} e click event on a given link
 */
let lastMultiSelectedLinkId = undefined;
function multiSelectLinks(e) {
    if(e.ctrlKey){
        e.preventDefault();
        e.target.classList.toggle("selected");
        lastMultiSelectedLinkId = e.target.id;
        return;
    } else if (e.shiftKey){
        e.preventDefault();
        if(lastMultiSelectedLinkId===undefined || lastMultiSelectedLinkId===e.target.id){
            e.target.classList.toggle("selected");
        } else if (Number(lastMultiSelectedLinkId) < Number(e.target.id)) {
            /* Previous selection was lower ID, so iterate up the list */
            let current = e.target
            while(current.id !== lastMultiSelectedLinkId){
                current.classList.toggle("selected");
                current = current.previousSibling;
            }
        } else {
            /* Previous selection was higher ID, so iterate down the list */
            let current = e.target
            while(current.id !== lastMultiSelectedLinkId){
                current.classList.toggle("selected");
                current = current.nextSibling;
            }
        }
        lastMultiSelectedLinkId = e.target.id;
    } else {
        lastMultiSelectedLinkId = undefined;
    }
}

/**
 * Open all selected links on "enter" press
 * @param {KeyboardEvent} e keypress
 */
function openAllSelectedLinks(e){
    if(e.key==="Enter"){
        e.preventDefault();
        const selected = document.querySelectorAll("a.selected");
        selected.forEach(link => {
            chrome.tabs.create({url:link.href, active:false});
            link.classList.toggle("selected");
        });
        lastMultiSelectedLinkId = undefined;
    }
}

/**
 * Add an info item to the panel
 * @param info the text to show
 */
function makeInfoItem(info){
    const p = document.createElement("p");
    p.innerText = info;
    document.querySelector("section").appendChild(p);
}

/**
 * Given the array of link details,populate the panel
 * @param [links details] to put into the panel
 */
async function populatePanel(links){
    const section = document.querySelector("section");
    section.parentElement.removeChild(section);
    lastMultiSelectedLinkId = undefined;
    const section2 = document.createElement("section");
    if(links.length===0){
        document.body.appendChild(section2);
        makeInfoItem(chrome.i18n.getMessage("noLinks"));
        return;
    }
    for (let i = 0; i < links.length; i++) {
        section2.appendChild(makeLink(links[i], i));
    }
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
        const searchTerm = document.querySelector("input").value;
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
    return document.querySelector('#lock.hidden');
}

/**
 * Toggle the lock state
 */
function toggleLock(){
    document.querySelector("#lock").classList.toggle("hidden");
    document.querySelector("#unlock").classList.toggle("hidden");
}

/**
 * Received an array of link details to put in panel
 * @param links array details
 */
function updateCurrentLinks(links){
    if(!isLocked()){
        CURRENT_LINKS = links;
        if(document.querySelector("input").value===""){
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
        const section = document.querySelector("section");
        section.parentElement.removeChild(section);
        const section2 = document.createElement("section");
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
document.querySelector("#lock").addEventListener("click", toggleLock);
document.querySelector("#lock").innerText = chrome.i18n.getMessage("lock");
document.querySelector("#unlock").addEventListener("click", toggleLock);
document.querySelector("#unlock").innerText = chrome.i18n.getMessage("unlock");
document.querySelector("input").addEventListener("input", search);
document.querySelector("input").placeholder = chrome.i18n.getMessage("search");
document.querySelector("#options").addEventListener("click", () => chrome.runtime.openOptionsPage());
document.querySelector("#options").title = chrome.i18n.getMessage("options");
document.title = chrome.i18n.getMessage("name");
document.addEventListener("keydown", openAllSelectedLinks);

chrome.tabs.onActivated.addListener(onTabActivate);
chrome.tabs.onUpdated.addListener(onTabUpdate);
chrome.windows.onFocusChanged.addListener(requestLinksFromActiveTab);
chrome.runtime.onMessage.addListener(onMessage);

requestLinksFromActiveTab();
