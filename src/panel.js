"use strict";

let CURRENT_LINKS;
const DOWNLOAD_QUEUE = []
let DOWNLOAD_QUEUE_INTERVAL;

let TARGET = "_blank";
let REMOVE_DUPES = false;
let SORTED = false;
let URLS_ONLY = false;
let SEARCH_URL = false;
let SEARCH_TITLE = true;
let SEARCH_TEXT = true;
let SEARCH_CASE = false;
let SEARCH_COMPLEX = false;

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
    const searchTerm = document.querySelector("input").value;
    if(searchTerm){
        document.querySelector("nav").classList.remove("closed");
    } else {
        document.querySelector("nav").classList.add("closed");
    }
    chrome.storage.sync.set({
        url: document.querySelector("#url").checked,
        title: document.querySelector("#title").checked,
        text: document.querySelector("#text").checked,
        case: document.querySelector("#case").checked,
        complex: document.querySelector("#complex").checked,
    });
    SEARCH_URL = document.querySelector("#url").checked;
    SEARCH_TITLE = document.querySelector("#title").checked;
    SEARCH_TEXT = document.querySelector("#text").checked;
    SEARCH_CASE = document.querySelector("#case").checked;
    SEARCH_COMPLEX = document.querySelector("#complex").checked;
    if(SEARCH_COMPLEX){return complexSearch();}
    const validLinks = [];
    CURRENT_LINKS.forEach(link => {
        const term = SEARCH_CASE ? searchTerm : searchTerm.toLowerCase();
        const url = SEARCH_URL && (SEARCH_CASE ? link.href : link.href.toLowerCase()).indexOf(term) > -1;
        const title = SEARCH_TITLE && (SEARCH_CASE ? link.title : link.title.toLowerCase()).indexOf(term) > -1;
        const text = SEARCH_TEXT && (SEARCH_CASE ? link.text : link.text.toLowerCase()).indexOf(term) > -1;
        if(url || title || text){
            validLinks.push(link);
        }
    });
    populatePanel(validLinks);
}

function complexSearch(){
    const searchTermText = document.querySelector("input").value;
    let filteredLinks;
    const validLinks = [];
    const terms = SEARCH_CASE ? searchTermText.split(' ') : searchTermText.split(' ').map(x => x.toLocaleLowerCase());
    const nTerms = terms.filter(x => x[0]==='-').map(x => x.substring(1)).filter(x => x !== "");
    const pTerms = terms.filter(x => x[0]!=='-');
    /* If any of the negated terms are present anywhere, don't include that result */
    if(nTerms.length > 0){
        filteredLinks = [];
        CURRENT_LINKS.forEach(link => {
            for(let i = 0; i < nTerms.length; i++){
                const term = nTerms[i];
                if(SEARCH_URL && (SEARCH_CASE ? link.href : link.href.toLowerCase()).indexOf(term) > -1) return;
                if(SEARCH_TITLE && (SEARCH_CASE ? link.title : link.title.toLowerCase()).indexOf(term) > -1) return;
                if(SEARCH_TEXT && (SEARCH_CASE ? link.text : link.text.toLowerCase()).indexOf(term) > -1) return;
            }
            filteredLinks.push(link);
        });
    } else {
        filteredLinks = CURRENT_LINKS;
    }
    /* include a result only if each search term is present in at least one of the url,title or text */
    filteredLinks.forEach(link => {
        for(let i = 0; i < pTerms.length; i++){
            const term = pTerms[i];
            const url = SEARCH_URL && (SEARCH_CASE ? link.href : link.href.toLowerCase()).indexOf(term) > -1;
            const title = SEARCH_TITLE && (SEARCH_CASE ? link.title : link.title.toLowerCase()).indexOf(term) > -1;
            const text = SEARCH_TEXT && (SEARCH_CASE ? link.text : link.text.toLowerCase()).indexOf(term) > -1;
            if(!(url || title || text)) return;
        }
        validLinks.push(link);
    });
    populatePanel(validLinks);
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
    if(document.hidden){return}
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
    if(document.hidden){return}
    chrome.windows.getLastFocused()
    .then(window => {
        const tabWindowOnTop = info.windowId == window.id;
        if(tabWindowOnTop){
            requestLinksFromTabs(info.tabId);
        }
    });
}

/**
 * The panel was opened (or closed, but that doesn't really matter)
 * so get the latest links from the currently open tab
 */
function onPanelOpened(){
    requestLinksFromActiveTab();
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
 * Receieve a message -
 * either will be a request to get links
 * or note that the settings have changed and panel needs reloaded
 * @param message
 * @param sender
 */
function onMessage(message, sender){
    if(message.newoptions){location.reload()}
    if(document.hidden){return}
    chrome.windows.getLastFocused()
    .then(window => {
        if(sender.tab && sender.tab.active && sender.tab.windowId===window.id){
            if(message.someLinks){
                updateCurrentLinks(message.someLinks);
            }
        }
    });
}

/* show download modal */
function download(){
    document.querySelector("dialog").showModal();
}

/* download the links
add them to the queue
start the download queue function via interval, only if not already started, and keep track of the interval
don't use CURRENT_LINKS here, that way you can filter downloads by the search or selection systems */
function startDownloadQueue(){
    const selected = document.querySelectorAll("a.selected");
    const alllinks = document.querySelectorAll("a");
    const linkstoDownload = selected.length==0 ? Array.from(alllinks).map(x => x.href) : Array.from(selected).map(x => x.href);
    DOWNLOAD_QUEUE.push(...linkstoDownload);
    if(!DOWNLOAD_QUEUE_INTERVAL){
        DOWNLOAD_QUEUE_INTERVAL = setInterval(goThroughDownloadQueue, 1000);
    }
}

/* go through the download queue
download each file one at a time to discourage overloading a server
clear the interval when empty to prevent the code looping forever*/
function goThroughDownloadQueue(){
    const oneDownload = DOWNLOAD_QUEUE.pop();
    chrome.downloads.download({url: oneDownload, saveAs: false, conflictAction: "uniquify"})
    .catch(e => {
        console.error(e);
    });
    if(DOWNLOAD_QUEUE.length == 0){
        clearInterval(DOWNLOAD_QUEUE_INTERVAL);
        DOWNLOAD_QUEUE_INTERVAL = undefined;
    }
}

/* functions to save the panel contents to a text file */
function saveFileTxt(){
    const selected = document.querySelectorAll("a.selected");
    const alllinks = document.querySelectorAll("a");
    const data = selected.length==0 ? Array.from(alllinks).map(x => x.href+"\n") : Array.from(selected).map(x => x.href+"\n");
    const txtFile = new File(data, "links.txt", {type: "text/plain"});
    const blob = window.URL.createObjectURL(txtFile);
    chrome.downloads.download({url: blob, saveAs: true, filename: "links.txt"});
}

function saveFileMd(){
    const selected = document.querySelectorAll("a.selected");
    const alllinks = document.querySelectorAll("a");
    const data = selected.length==0 ? Array.from(alllinks) : Array.from(selected);
    const formattedData = data.map(x => `[${x.innerText}](${x.href})\n`);
    const txtFile = new File(formattedData, "links.md", {type: "text/markdown"});
    const blob = window.URL.createObjectURL(txtFile);
    chrome.downloads.download({url: blob, saveAs: true, filename: "links.md"});
}

function saveFileJson(){
    const selected = document.querySelectorAll("a.selected");
    const alllinks = document.querySelectorAll("a");
    const data = selected.length==0 ? Array.from(alllinks) : Array.from(selected);
    const formattedData = JSON.stringify(data.map(x => { return {href: x.href, text: x.innerText}; } ))
    const txtFile = new File([formattedData], "links.json", {type: "application/json"});
    const blob = window.URL.createObjectURL(txtFile);
    chrome.downloads.download({url: blob, saveAs: true, filename: "links.json"});
}

/**
 * Init page i18n and listeners
 */
document.querySelector("#lock").addEventListener("click", toggleLock);
document.querySelector("#lock").innerText = chrome.i18n.getMessage("lock");
document.querySelector("#lock").title = chrome.i18n.getMessage("lock_tip");
document.querySelector("#unlock").addEventListener("click", toggleLock);
document.querySelector("#unlock").innerText = chrome.i18n.getMessage("unlock");
document.querySelector("#unlock").title = chrome.i18n.getMessage("lock_tip");
document.querySelector("input").addEventListener("input", search);
document.querySelector("input").placeholder = chrome.i18n.getMessage("search");
document.querySelector("#options").addEventListener("click", () => chrome.runtime.openOptionsPage());
document.querySelector("#options").title = chrome.i18n.getMessage("options");
document.title = chrome.i18n.getMessage("name");
document.addEventListener("keydown", openAllSelectedLinks);

document.querySelector("#download").addEventListener("click", download);
document.querySelector("#download").title = chrome.i18n.getMessage("saveall_tip");
document.querySelector("dialog h4").innerText = chrome.i18n.getMessage("saveall_tip");
document.querySelector("#saveall").innerText = chrome.i18n.getMessage("saveall");
document.querySelector("#txt").innerText = chrome.i18n.getMessage("txt");
document.querySelector("#markdown").innerText = chrome.i18n.getMessage("markdown");
document.querySelector("#json").innerText = chrome.i18n.getMessage("json");
document.querySelector("#saveall").addEventListener("click", startDownloadQueue);
document.querySelector("#txt").addEventListener("click", saveFileTxt);
document.querySelector("#markdown").addEventListener("click", saveFileMd);
document.querySelector("#json").addEventListener("click", saveFileJson);


document.querySelector("#url + span").title = chrome.i18n.getMessage("url_tip");
document.querySelector("#title + span").title = chrome.i18n.getMessage("title_tip");
document.querySelector("#text + span").title = chrome.i18n.getMessage("text_tip");
document.querySelector("#case + span").title = chrome.i18n.getMessage("case_tip");
document.querySelector("#complex + span").title = chrome.i18n.getMessage("complex_tip");
document.querySelector("#url").addEventListener('input', search);
document.querySelector("#title").addEventListener('input', search);
document.querySelector("#text").addEventListener('input', search);
document.querySelector("#case").addEventListener('input', search);
document.querySelector("#complex").addEventListener('input', search);

chrome.tabs.onActivated.addListener(onTabActivate);
chrome.tabs.onUpdated.addListener(onTabUpdate);
chrome.windows.onFocusChanged.addListener(requestLinksFromActiveTab);
chrome.runtime.onMessage.addListener(onMessage);
document.addEventListener("visibilitychange", onPanelOpened);

requestLinksFromActiveTab();

chrome.storage.sync.get({
    openin: '_blank',
    urlsOnly: false,
    removeDupes: false,
    sorted: false,
    url: false,
    title: true,
    text: true,
    case: false,
    complex: false,
})
.then(items => {
    TARGET = items.openin;
    REMOVE_DUPES = items.removeDupes;
    SORTED = items.sorted;
    URLS_ONLY = items.urlsOnly;
    SEARCH_URL = items.url;
    SEARCH_TITLE = items.title;
    SEARCH_TEXT = items.text;
    SEARCH_CASE = items.case;
    SEARCH_COMPLEX = items.complex;
    document.querySelector("#url").checked = items.url;
    document.querySelector("#title").checked = items.title;
    document.querySelector("#text").checked = items.text;
    document.querySelector("#case").checked = items.case;
    document.querySelector("#complex").checked = items.complex;
});
