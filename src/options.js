"use strict";

/**
 * Save Options
 */
function save() {
    chrome.storage.sync.set({
        color: document.querySelector("#color").checked,
        ff: document.querySelector("#ff").checked,
        fw: document.querySelector("#fw").checked,
        fs: document.querySelector("#fs").checked,

        url: document.querySelector("#url").checked,
        title: document.querySelector("#title").checked,
        text: document.querySelector("#text").checked,
        case: document.querySelector("#case").checked,

        samePage: document.querySelector("#samePage").checked,
        justScript: document.querySelector("#justScript").checked,
        urlsOnly: document.querySelector('#urlsOnly').checked,
        removeDupes: document.querySelector('#removeDupes').checked,
        sorted: document.querySelector('#sorted').checked,

        max: document.querySelector("#max").value,
        openin: document.querySelector("#openin").value
    })
    .then(() => {
        document.querySelector("#save").innerText = chrome.i18n.getMessage("saved");
        setTimeout(() => {
            document.querySelector("#save").innerText = chrome.i18n.getMessage("save");
        }, 5000);
        chrome.runtime.sendMessage({newoptions: true})
    });
}

/**
 * Restore Options
 */
function restore() {
    chrome.storage.sync.get({
        color: false,
        ff: true,
        fw: true,
        fs: true,

        url: false,
        title: true,
        text: true,
        case: false,

        samePage: true,
        justScript: true,
        urlsOnly: false,
        removeDupes: false,
        sorted: false,

        max: 5000,
        openin: '_blank'
    })
    .then(items => {
        document.querySelector("#color").checked = items.color;
        document.querySelector("#ff").checked = items.ff;
        document.querySelector("#fw").checked = items.fw;
        document.querySelector("#fs").checked = items.fs;

        document.querySelector("#url").checked = items.url;
        document.querySelector("#title").checked = items.title;
        document.querySelector("#text").checked = items.text;
        document.querySelector("#case").checked = items.case;

        document.querySelector("#samePage").checked = items.samePage;
        document.querySelector("#justScript").checked = items.justScript;
        document.querySelector('#urlsOnly').checked = items.urlsOnly;
        document.querySelector('#removeDupes').checked = items.removeDupes;
        document.querySelector('#sorted').checked = items.sorted;

        document.querySelector("#max").value = items.max;
        document.querySelector(`#openin option[value='${items.openin}']`).selected = true;
    });
}
document.addEventListener('DOMContentLoaded', restore);

document.title = chrome.i18n.getMessage("options");
document.querySelector("#style").innerText = chrome.i18n.getMessage("style");
/* style options are not translated */

document.querySelector("#searchOptions").innerText = chrome.i18n.getMessage("searchOptions");
document.querySelector("#url + span").innerText = chrome.i18n.getMessage("url");
document.querySelector("#title + span").innerText = chrome.i18n.getMessage("title");
document.querySelector("#text + span").innerText = chrome.i18n.getMessage("text");
document.querySelector("#case + span").innerText = chrome.i18n.getMessage("case");

document.querySelector("#displaySettings").innerText = chrome.i18n.getMessage("displaySettings");
document.querySelector("#samePage + span").innerText = chrome.i18n.getMessage("samePage");
document.querySelector("#justScript + span").innerText = chrome.i18n.getMessage("justScript");
document.querySelector("#urlsOnly + span").innerText = chrome.i18n.getMessage("urlsOnly");
document.querySelector("#removeDupes + span").innerText = chrome.i18n.getMessage("removeDupes");
document.querySelector("#sorted + span").innerText = chrome.i18n.getMessage("sorted");

document.querySelector("#openinp").innerText = chrome.i18n.getMessage("openin");
document.querySelector("option[value='_blank']").innerText = chrome.i18n.getMessage("optNewTab");
document.querySelector("option[value='linkspanel']").innerText = chrome.i18n.getMessage("optFollowerTab");

document.querySelector("#maxlinks").innerText = chrome.i18n.getMessage("maxlinks");
document.querySelector("#max").addEventListener("input", () => {
    if(document.querySelector("#max").value > 5000){
        document.querySelector("#maxwarn").innerText = chrome.i18n.getMessage("maxwarn");
    } else {
        document.querySelector("#maxwarn").innerText = "";
    }
});

document.querySelector("#save").innerText = chrome.i18n.getMessage("save");
document.getElementById('save').addEventListener('click', save);
