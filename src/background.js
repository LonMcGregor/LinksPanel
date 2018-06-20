"use strict";

let ALL_LINKS = {};

/**
 * Receieve a message
 * @param message
 * @param sender {tab} that sent the message
 */
function onMessage(message, sender){
    if(message.updateBackground){
        onMsgUpdateLinks(sender.tab.id, message.links);
    } else if (message.panelRequestLatest) {
        onMsgUpdatePanel();
    }
}

/**
 * Receieved the latest array of link details from a tab
 *     Update dictionary and update panel if tab is active
 * @param sender ID of sending tab
 * @param links array of link details
 */
function onMsgUpdateLinks(sender, links){
    ALL_LINKS[sender] = links;
    chrome.tabs.query({active:true, lastFocusedWindow: true}, tabs => {
        if(tabs[0].id === sender){
            chrome.runtime.sendMessage({
                updatePanel: true,
                links: links
            });
        }
    });
}

/**
 * Receieved a request to force update the panel
 */
function onMsgUpdatePanel(){
    chrome.tabs.query({active:true, lastFocusedWindow: true}, tabs => {
        const sendLinks = ALL_LINKS[tabs[0].id];
        messagePanelWithLinks(sendLinks);
    });
}

/**
 * No links to send, inform the panel to prompt for a reload
 */
function messageReload(){
    chrome.runtime.sendMessage({
        currentPageNeedsReload: true
    });
}

/**
 * Attempt to send the link details to the panel
 * @param links array of link details
 */
function messagePanelWithLinks(links){
    if(links){
        chrome.runtime.sendMessage({
            updatePanel: true,
            links: links
        });
    } else {
        messageReload();
    }
}

/**
 * When a new tab is activated change what is in the panel
 * @param info A tab was activated
 */
function onTabActivate(info){
    const tabLinks = ALL_LINKS[info.tabId];
    chrome.windows.getLastFocused(window => {
        const tabWindowOnTop = info.windowId == window.id;
        if(tabWindowOnTop){
            messagePanelWithLinks(tabLinks);
        }
    });
}

/**
 * A tab was closed, clear its link details from memory
 * @param tabid
 */
function onClosed(tabid){
    delete ALL_LINKS[tabid];
}

/**
 * Set Listeners
 */
chrome.runtime.onMessage.addListener(onMessage);
chrome.tabs.onActivated.addListener(onTabActivate);
chrome.tabs.onRemoved.addListener(onClosed);
