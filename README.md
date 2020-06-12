<p align="center">
  <img width="120" height="120" src="https://github.com/yang991178/rss-reader/raw/master/build/icon.png">
</p>
<h3 align="center">Fluent Reader</h3>
<p align="center">A modern desktop RSS reader</p>
<hr />

## Download

Fluent Reader is currently under development and is only available via source code. 
Alpha builds will be available in packaged binaries through GitHub releases and Microsoft Store later.

<p align="center">
  <img src="https://github.com/yang991178/rss-reader/raw/master/screenshot.jpg">
</p>

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
