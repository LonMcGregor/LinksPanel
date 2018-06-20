(function contentScript(){
"use strict";

/* Aliases for sanity */
const $ = document.querySelector.bind(document);
const $a = document.querySelectorAll.bind(document);
const $$ = document.createElement.bind(document);

/* TODO
const ANCHOR_OBSERVER = new MutationObserver(records => {
    records.forEach(record => {
        let added = [], removed = [];
        record.addedNodes.forEach(node => {
            if(node.tagName.toLowerCase() === "a"){
                added.push(processAnchor(node));
            }
        });
        record.removedNodes.forEach(node => {
            if(node.tagName.toLowerCase() === "a"){
                added.push(processAnchor(node));
            }
        });
        console.log(added, removed);
    });
});
*/

/**
 * Get relevant details out of an <a> node
 * @param a node
 * @returns Link detail strings {title, text, href, style}
 */
function processAnchor(a){
    const computedStyle = window.getComputedStyle(a);
    const properties = ["font-family", "font-weight", "font-style"]; /* TODO could have option to choose additional css properties to grab */
    let style = "";
    properties.forEach(prop => {
        style += `${prop}: ${computedStyle.getPropertyValue(prop)};`;
    });
    return {
        title: a.title,
        text: a.innerText.split("\n")[0].trim() === "" ? a.href : a.innerText.split("\n")[0].trim(),
        href: a.href,
        style: style
    };
}

/**
 * Get list of details
 * @returns [link details]
 */
function getAllAnchors(){
    const listOfAnchors = [];
    $a("a").forEach(a => {
        listOfAnchors.push(processAnchor(a));
    });
    return listOfAnchors;
}

/**
 * Send a message with specified links to background
 * @param [link details]
 */
function sendLinksToBackground(links){
    chrome.runtime.sendMessage({
        updateBackground: true,
        links: links
    });
}

/* TODO removed and added links*/
function sendLinksRemovedToBackground(links){
    chrome.runtime.sendMessage();
}
function sendLinksAddedToBackground(links){
    chrome.runtime.sendMessage();
}

/**
 * Run the content script (get initial link detail array) and start the observer
 */
function init(){
    sendLinksToBackground(getAllAnchors());
    /*ANCHOR_OBSERVER.observe(document.body, {childList: true, subtree: true});*/
}

init();
})();
