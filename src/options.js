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
        case: $("#case").checked
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
        url: true,
        title: true,
        text: true,
        case: false
    }, items => {
        $("#color").checked = items.color;
        $("#ff").checked = items.ff;
        $("#fw").checked = items.fw;
        $("#fs").checked = items.fs;
        $("#url").checked = items.url;
        $("#title").checked = items.title;
        $("#text").checked = items.text;
        $("#case").checked = items.case;
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
$("#advert").innerText = chrome.i18n.getMessage("vivaldi");
document.getElementById('save').addEventListener('click', save);
