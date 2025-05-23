# Links Panel
Links Panel, collecting all the links on a page

## Installing
From the [CWS](https://chrome.google.com/webstore/detail/links-panel/nnnheolekoehkioeicninoneagaimnjd)

Or from source, clone this repository, and then load the `src` folder as an unpacked extension

## What can it do
Grab all the links on the page and show them to you, like classic opera could.

Additionally:
* The links will be styled similarly to how they appear on the page. You can change this in extension settings.
* Searching / filter the links. By default the panel will search through link title, URL and display text.
* Toggle filtering with match case
* Sort the links alphabetically
* See the extension settings page for more info

## Forcing the panel to follow the browser theme
This installs a web panel. If you are using vivaldi, you can make it follow the browser theme.
Utilise the mod from here: [LonMcGregor/VivaldiMods/injectThemeIntoPage.js](https://github.com/LonMcGregor/VivaldiMods/blob/master/mods/injectThemeIntoPage.js) and change the URL at the top of the script to `chrome-extension://nnnheolekoehkioeicninoneagaimnjd/panel.html`.

## Changelog
3.0: Real Sidepanel
* New: Use the side panel API to load in a panel instead of a popup
* New: offer options to sort and remove duplicates
* Efficiency: only update panel when it is visible
* Fix: Auto reload panel if settings changed

2.0: Update to MV3

1.0: Initial release
