"use strict";

let CURRENT_LINKS;

let TARGET = "_blank";
let REMOVE_DUPES = false;
let SORTED = false;
let URLS_ONLY = false;

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
    panelLink.innerText = URLS_ONLY ? link.href : link.text;
    panelLink.target = TARGET;
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
    if(section){
        section.parentElement.removeChild(section);
    }
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
 */
function search(){
    chrome.storage.sync.get({
        url: false,
        title: true,
        text: true,
        case: false
    })
    .then(items => {
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
 * Prepare links for dupe removal
 * @param links array of link details
 * @returns an array of link details
 */
function removeDupes(links){
    //sort by href first
    links.sort((x,y) => {
        return x.href.localeCompare(y.href);
    });
    // then remove the duplicates
    if(REMOVE_DUPES){
        for (let i = 0; i < links.length; i++) {
            // go through each one
            const current = links[i];
            let j = i+1;
            // check it against all subsequent ones that exist
            while(current && j<links.length){
                const other = links[j];
                if(other && current.href===other.href){
                    // if it is the same, remove it
                    links[j] = null;
                    // and move to the one after
                    j++;
                } else {
                    // because the array is sorted, weknow there's no others
                    break;
                }
            }
        }
        // then compact the array
        links = links.filter(x => x!==null);
    }
    // if we are not sorting them, only removing dupes,
    // we need to put them back in the right order
    if(!SORTED){
        links.sort((x,y) => x.index - y.index);
    }
    return links;
}

/**
 * Sort array
 */
function doSort(links){
    const sortmode = URLS_ONLY ? 'href' : 'text';
    links.sort((x,y) => {
        return x[sortmode].localeCompare(y[sortmode]);
    });
    return links;
}


/**
 * Received an array of link details to put in panel
 * @param links array details
 */
function updateCurrentLinks(links){
    if(!isLocked()){
        CURRENT_LINKS = links;
        if(REMOVE_DUPES){ // if sorted or removing dupes, use that mode
            CURRENT_LINKS = removeDupes(CURRENT_LINKS);
        }
        if(SORTED){
            CURRENT_LINKS = doSort(CURRENT_LINKS);
        }
        if(document.querySelector("input").value===""){
            populatePanel(CURRENT_LINKS);
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
        if(section){
            section.parentElement.removeChild(section);
        }
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
    chrome.windows.getLastFocused()
    .then(window => {
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
    chrome.windows.getLastFocused()
    .then(window => {
        const tabWindowOnTop = info.windowId == window.id;
        if(tabWindowOnTop){
            requestLinksFromTabs(info.tabId);
        }
    });
}

/**
 * Try to get links from a tab. give up if it fails after 2 tries.
 * @param tabId
 */
function requestLinksFromTabs(tabId){
    chrome.tabs.sendMessage(tabId, {
        panelWantsLinks: true
    })
    .then(response => {
        if(!response){
            clearLinksAndInfo(chrome.i18n.getMessage("failed"));
        }
    })
    .catch((e) => { // probably 'Error: Could not establish connection. Receiving end does not exist.'
        clearLinksAndInfo(chrome.i18n.getMessage("failed"));
    });
}

/**
 * Panel first activated, get links from active tab
 */
function requestLinksFromActiveTab(){
    chrome.tabs.query({active:true, lastFocusedWindow: true, windowType: "normal"})
    .then(tabs => {
        if(tabs[0]){
            requestLinksFromTabs(tabs[0].id);
        }
        // else No valid active tab. Focus may be in dev tools, or tab didn't load.
    });
}

/**
 * Receieve a message - will probably be a request to get links
 * @param message
 * @param sender
 */
function onMessage(message, sender){
    chrome.windows.getLastFocused()
    .then(window => {
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

chrome.storage.sync.get({
    openin: '_blank',
    urlsOnly: false,
    removeDupes: false,
    sorted: false
})
.then(items => {
    TARGET = items.openin;
    REMOVE_DUPES = items.removeDupes;
    SORTED = items.sorted;
    URLS_ONLY = items.urlsOnly;
});
