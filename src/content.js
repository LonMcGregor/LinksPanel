(function contentScript(){
"use strict";

/**
 * Get relevant details out of an <a> node
 * @param a node
 * @returns Link detail strings {title, text, href, style} or indicate failure
 */
function processAnchor(a){
    let computedStyle;
    try{
        computedStyle = window.getComputedStyle(a);
    } catch (e) {
        return {fail:true};
    }
    if(SETTINGS.samePage && (a.href[0]==="#" || a.href===window.location.href || a.href.indexOf(window.location.href+"#")===0 || a.href.indexOf(window.location.href+"?")===0 || a.href===window.location.href+"/")){
        return {fail:true};
    }
    if(SETTINGS.justScript && a.href.indexOf("javascript:")===0){
        return {fail:true};
    }
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
 * Send message with link details
 * @param links to send
 */
function sendLinks(links){
    chrome.runtime.sendMessage(links);
}

/**
 * Get list of link details and send it
 */
function getAllAnchors(){
    const listOfAnchors = [];
    const allLinks = document.links;
    for(let i = 0; i < SETTINGS.max; i++){
        const link = processAnchor(allLinks[i]);
        link.index = i;
        if(!link.fail){
            listOfAnchors.push(link);
        }
    }
    sendLinks({someLinks: listOfAnchors});
}

/**
 * Receieve a message - will probably be a request to get links
 * @param message
 * @param sender
 * @param callback
 */
function onMessage(message, sender, callback){
    if(message.panelWantsLinks){
        callback(true);
        getAllAnchors();
    }
}

let SETTINGS;
chrome.storage.sync.get({
    color: false,
    ff: true,
    fw: true,
    fs: true,
    max: 5000,
    samePage: true,
    justScript: true
})
.then(items => {
    SETTINGS = items;
    chrome.runtime.onMessage.addListener(onMessage);
});

})();
