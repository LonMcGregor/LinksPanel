# Links Panel
Links Panel, collecting all the links on a page

## Installing
From the [CWS](https://chrome.google.com/webstore/detail/links-panel/nnnheolekoehkioeicninoneagaimnjd)

## What can it do
Grab all the links on the page and show them to you, like classic opera could.

## Links Appearance
The links will be styled similarly to how they appear on the page. You can change this in extension settings.

## Searching
You can filter the links. By default the panel will search through link title, URL and display text.

It won't match case by default.

You can toggle this in extension settings.

## Adding as a web panel
In Vivaldi, you can add this as a web panel.

Add `chrome-extension://nnnheolekoehkioeicninoneagaimnjd/panel.html` as a web panel.

Note if you're installing the extension unpacked, exchange the long string for whatever the extension ended up installing as.

### Forcing the web panel icon

Vivaldi may fail to load the web panel icon. You can force it with the following CSS mod:
```
.webviewbtn[title*="Links Panel"] img{
    content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAHYgAAB2IBOHqZ2wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHjSURBVEiJrdW7alRRFMbxXzReExQJghG8G7GIIFHMG8RGtEgaEbESG8HCQrCw9oIPIBb6BGrjpRMFRUEiiChIBIMBL6iIRDSYzFjsHbNyOGcyzLhgmLPX+vb/m9lrsQ/tR+d/YMyLbpzBKKZQxziuoK9d+G68y9CyzxROtAofxPcC8Be+lBgdbxc+jiFz578Dt0P9NzY1C99XgI9hQ4luMR4E3eVm4Hsr4OtxGB0F/UDQvlwI3otPJfBevM65W1gZ9nRIfanjx0IGNwL8bYYvwSPzG3oz/JMu1HL+YyP4Zsxk4Qz6Q60TZzEdTEZy7WjI3SsD78nfw0F4v+JHnAuauzk3EnLHihsGMJGfjwTh9QqDFZjMmj/S8e3M62fSVP2LHrzHt7weDAZPKwzgedCtlY5yAhuLwgtB2JPdP+R1DftL4IuCZka6o/qwvSjsyK6zBgM5fzHkvuJAYd/BUG848+uCcCzkV+NNqNVxNdf68TnkTzYy2BaETwq1rXiVa4+xqgQ+iuWNDLrMzfRPaTpidON0BXxCk5faw7DpUoVmVwm86RfMobCxhvNSD0gTNSw1uiX4bFwzv6HTUpMnC/mW4LBUmpKq12EdL7ClFXiMIdwxd+3WpEk5hWXtwouxRrpjWo6/GPa/3SzqBVgAAAAASUVORK5CYII=");
}
```

### Forcing the panel to follow the browser theme

Utilise the mod from here: [LonMcGregor/VivaldiMods/injectThemeIntoPage.js](https://github.com/LonMcGregor/VivaldiMods/blob/master/mods/injectThemeIntoPage.js) and change the URL at the top of the script to `chrome-extension://nnnheolekoehkioeicninoneagaimnjd/panel.html`.
