(function contentScript(){
"use strict";

/**
 * Get relevant details out of an <a> node
 * @param a node
 * @returns Link detail strings {title, text, href, style}
 */
function processAnchor(a){
    const computedStyle = window.getComputedStyle(a);
    let propString = "";
    propString += SETTINGS.color ? "color " : "";
    propString += SETTINGS.ff ? "font-family " : "";
    propString += SETTINGS.fw ? "font-weight " : "";
    propString += SETTINGS.fs ? "font-style" : "";
    const properties = propString.split(" ");
    let styleString = "";
    properties.forEach(prop => {
        styleString += `${prop}: ${computedStyle.getPropertyValue(prop)};`;
    });
    return {
        title: a.title,
        text: a.innerText.split("\n")[0].trim() === "" ? a.href : a.innerText.split("\n")[0].trim(),
        href: a.href,
        style: styleString
    };
}

/**
 * Get list of link details
 * @returns [link details]
 */
function getAllAnchors(){
    const listOfAnchors = [];
    Array.from(document.links).forEach(a => {
        listOfAnchors.push(processAnchor(a));
    });
    return listOfAnchors;
}

/**
 * Receieve a message - will probably be a request to get links
 * @param message
 * @param sender
 * @param callback takes the links as argument
 */
function onMessage(message, sender, callback){
    if(message.panelWantsLinks){
        callback(getAllAnchors());
    }
}

let SETTINGS;
chrome.storage.sync.get({
    color: false,
    ff: true,
    fw: true,
    fs: true
}, items => {
    SETTINGS = items;
    chrome.runtime.onMessage.addListener(onMessage);
});

})();
