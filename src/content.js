// get all <A> tags
// get computed styles
// send to background
// observe for additions (and removals?)

(function scrapeLinks(){
"use strict";

function processAnchor(a){
    const computedStyle = window.getComputedStyle(a);
    const properties = ["color", "font-family", "text-decoration", "font-weight"];
    let style = "";
    properties.forEach(prop => {
        style += `${prop}: ${computedStyle.getPropertyValue(prop)};`;
    });
    return {
        title: a.title,
        text: a.innerText.trim() === "" ? a.href : a.innerText.trim(),
        href: a.href,
        style: style
    };
}

function getAllAnchors(){
    const listOfAnchors = [];
    document.querySelectorAll("a").forEach(a => {
        listOfAnchors.push(processAnchor(a));
    });
    return listOfAnchors;
}

return getAllAnchors();
})();
