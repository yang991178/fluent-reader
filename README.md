<p align="center">
  <img width="120" height="120" src="https://github.com/yang991178/rss-reader/raw/master/build/icon.png">
</p>
<h3 align="center">Fluent Reader</h3>
<p align="center">A modern desktop RSS reader</p>
<p align="center">
  <img src="https://img.shields.io/github/v/release/yang991178/fluent-reader?label=version" />
  <img src="https://img.shields.io/github/downloads/yang991178/fluent-reader/total" />
  <img src="https://github.com/yang991178/fluent-reader/workflows/CI%2FCD%20Release/badge.svg" />
</p>
<hr />

## Download

For Windows 10 users, the recommended way of installation is through [Microsoft Store](https://www.microsoft.com/store/apps/9P71FC94LRH8?cid=github). 
This enables auto-update and experimental ARM64 support. 
macOS users can also get Fluent Reader from the [Mac App Store](https://apps.apple.com/app/id1520907427).

If you are using Linux or an older version of Windows, you can [get Fluent Reader from GitHub releases](https://github.com/yang991178/fluent-reader/releases).

Also, you can get Fluent Reader from a [Scoop](https://scoop.sh) bucket [peach](https://github.com/ChungZH/peach):

```powershell
scoop bucket add peach https://github.com/ChungZH/peach
scoop install peach/fluent-reader
```

## Features

<p align="center">
  <img src="https://github.com/yang991178/rss-reader/raw/master/docs/imgs/screenshot.jpg">
</p>

- A modern UI inspired by Fluent Design System with full dark mode support.
- Importing or exporting OPML files, full application data backup & restoration.
- Read the full content with the built-in article view or load webpages by default.
- Search for articles with regular expressions or filter by read status.
- Organize your subscriptions with folder-like groupings.
- Single-key [keyboard shortcuts](https://github.com/yang991178/fluent-reader/wiki/Support#keyboard-shortcuts).
- Hide, mark as read, or star articles automatically as they arrive with regular expression rules.
- Fetch articles in the background and send push notifications.

Support for RSS services including Fever API, Inoreader, or Feedly are being fundraised through [Open Collective](https://opencollective.com/fluent-reader). 

## Development

### Contribute

Help make Fluent Reader better by reporting bugs or opening feature requests through [GitHub issues](https://github.com/yang991178/fluent-reader/issues). 

You can also help internationalize the app by providing [translations into additional languages](https://github.com/yang991178/fluent-reader/tree/master/src/scripts/i18n). 
Refer to the repo of [react-intl-universal](https://github.com/alibaba/react-intl-universal) to get started on internationalization. 

If you enjoyed using the app, consider supporting its development by donating through [Open Collective](https://opencollective.com/fluent-reader) or [Paypal](https://www.paypal.me/yang991178).

### Build from source
```bash
# Install dependencies
npm install

# Compile ts & dependencies
npm run build

# Start the application
npm run electron

# Generate certificate for signature
electron-builder create-self-signed-cert
# Package the app for Windows
npm run package-win

```

### Developed with

- [Electron](https://github.com/electron/electron)
- [React](https://github.com/facebook/react)
- [Redux](https://github.com/reduxjs/redux)
- [Fluent UI](https://github.com/microsoft/fluentui)
- [NeDB](https://github.com/louischatriot/nedb)

### License

BSD
