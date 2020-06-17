<p align="center">
  <img width="120" height="120" src="https://github.com/yang991178/rss-reader/raw/master/build/icon.png">
</p>
<h3 align="center">Fluent Reader</h3>
<p align="center">A modern desktop RSS reader</p>
<hr />

## Download

For Windows 10 users, the recommended way of installation is through [Microsoft Store](https://www.microsoft.com/store/apps/9P71FC94LRH8?cid=github). 
This enables auto-update and experimental ARM64 support.

If you are using macOS or an older version of Windows, you can also [get Fluent Reader from GitHub releases](https://github.com/yang991178/fluent-reader/releases).

## Features

<p align="center">
  <img src="https://github.com/yang991178/rss-reader/raw/master/screenshot.jpg">
</p>

- A modern UI inspired by Fluent Design System with full dark mode support.
- Importing or exporting OPML files, full application data backup & restoration.
- Read the full content with the built-in article view or load webpages by default.
- Search for articles with regular expressions or filter by read status.
- Organize your subscriptions with folder-like groupings.

## Development

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
