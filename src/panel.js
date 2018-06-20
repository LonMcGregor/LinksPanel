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
 * Given the array of link details,populate the panel
 * @param [links details] to put into the panel
 */
function populatePanel(links){
    emptyLinks();
    const section = $("section");
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
function onMsgUpdatePanel(links){
    CURRENT_LINKS = links;
    populatePanel(links);
}

/**
 * Receieved a prompt that current page never ran content script
 */
function onMsgPromptReload(){
    emptyLinks();
    const msg = $$("p");
    msg.innerText = chrome.i18n.getMessage("pagereload");
    $("section").appendChild(msg);
}

/**
 * Receieve messages, and check if locked then don't do anything
 */
chrome.runtime.onMessage.addListener((message, sender, responder) => {
    if(isLocked()){
        return;
    } else if(message.updatePanel){
        onMsgUpdatePanel(message.links);
    } else if(message.currentPageNeedsReload){
        onMsgPromptReload();
    }
});

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

/**
 * Once page loaded, request the links for current page
 *   i.e. if opening in browser action popup
 */
chrome.runtime.sendMessage({
    panelRequestLatest: true
});
