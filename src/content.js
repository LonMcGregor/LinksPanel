// get all <A> tags
// get computed styles
// send to background
// observe for additions (and removals?)
(function contentScript(){
"use strict";

function processAnchor(a){
    const computedStyle = window.getComputedStyle(a);
    const properties = ["font-family", "font-weight"]; //could have option to choose additional css properties to grab
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
    document.querySelectorAll("a").forEach(a => { //prevent duplicates
        listOfAnchors.push(processAnchor(a));
    });
    return listOfAnchors;
}

return getAllAnchors();
})();
