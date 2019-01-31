"use strict";

/* Aliases for sanity */
const $ = document.querySelector.bind(document);

/**
 * Save Options
 */
function save() {
    chrome.storage.sync.set({
        color: $("#color").checked,
        ff: $("#ff").checked,
        fw: $("#fw").checked,
        fs: $("#fs").checked,
        url: $("#url").checked,
        title: $("#title").checked,
        text: $("#text").checked,
        case: $("#case").checked,
        max: $("#max").value,
        samePage: $("#samePage").checked,
        justScript: $("#justScript").checked,
    }, () => {
        $("#save").innerText = chrome.i18n.getMessage("saved");
        setTimeout(() => {
            $("#save").innerText = chrome.i18n.getMessage("save");
        }, 5000);
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
        max: 5000,
        samePage: true,
        justScript: true,
    }, items => {
        $("#color").checked = items.color;
        $("#ff").checked = items.ff;
        $("#fw").checked = items.fw;
        $("#fs").checked = items.fs;
        $("#url").checked = items.url;
        $("#title").checked = items.title;
        $("#text").checked = items.text;
        $("#case").checked = items.case;
        $("#max").value = items.max;
        $("#samePage").checked = items.samePage;
        $("#justScript").checked = items.justScript;
    });
}
document.addEventListener('DOMContentLoaded', restore);

document.title = chrome.i18n.getMessage("options");
$("#style").innerText = chrome.i18n.getMessage("style");
$("#searchOptions").innerText = chrome.i18n.getMessage("searchOptions");
$("#url + span").innerText = chrome.i18n.getMessage("url");
$("#title + span").innerText = chrome.i18n.getMessage("title");
$("#text + span").innerText = chrome.i18n.getMessage("text");
$("#case + span").innerText = chrome.i18n.getMessage("case");
$("#save").innerText = chrome.i18n.getMessage("save");
$("#advert").innerText = chrome.i18n.getMessage("vivaldi") + chrome.runtime.getURL("panel.html");
$("#maxlinks").innerText = chrome.i18n.getMessage("maxlinks");
$("#max").addEventListener("input", () => {
    if($("#max").value > 5000){
        $("#maxwarn").innerText = chrome.i18n.getMessage("maxwarn");
    } else {
        $("#maxwarn").innerText = "";
    }
})
document.getElementById('save').addEventListener('click', save);
$("#samePage + span").innerText = chrome.i18n.getMessage("samePage");
$("#justScript + span").innerText = chrome.i18n.getMessage("justScript");
