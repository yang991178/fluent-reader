"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setThemeListener = exports.store = void 0;
const Store = require("electron-store");
const electron_1 = require("electron");
exports.store = new Store();
const GROUPS_STORE_KEY = "sourceGroups";
electron_1.ipcMain.handle("set-groups", (_, groups) => {
    exports.store.set(GROUPS_STORE_KEY, groups);
});
electron_1.ipcMain.on("get-groups", event => {
    event.returnValue = exports.store.get(GROUPS_STORE_KEY, []);
});
const MENU_STORE_KEY = "menuOn";
electron_1.ipcMain.on("get-menu", event => {
    event.returnValue = exports.store.get(MENU_STORE_KEY, false);
});
electron_1.ipcMain.handle("set-menu", (_, state) => {
    exports.store.set(MENU_STORE_KEY, state);
});
const PAC_STORE_KEY = "pac";
const PAC_STATUS_KEY = "pacOn";
function getProxyStatus() {
    return exports.store.get(PAC_STATUS_KEY, false);
}
function toggleProxyStatus() {
    exports.store.set(PAC_STATUS_KEY, !getProxyStatus());
    setProxy();
}
function getProxy() {
    return exports.store.get(PAC_STORE_KEY, "");
}
function setProxy(address = null) {
    if (!address) {
        address = getProxy();
    }
    else {
        exports.store.set(PAC_STORE_KEY, address);
    }
    if (getProxyStatus()) {
        let rules = { pacScript: address };
        electron_1.session.defaultSession.setProxy(rules);
        electron_1.session.fromPartition("sandbox").setProxy(rules);
    }
}
electron_1.ipcMain.on("get-proxy-status", event => {
    event.returnValue = getProxyStatus();
});
electron_1.ipcMain.on("toggle-proxy-status", () => {
    toggleProxyStatus();
});
electron_1.ipcMain.on("get-proxy", event => {
    event.returnValue = getProxy();
});
electron_1.ipcMain.handle("set-proxy", (_, address = null) => {
    setProxy(address);
});
const VIEW_STORE_KEY = "view";
electron_1.ipcMain.on("get-view", event => {
    event.returnValue = exports.store.get(VIEW_STORE_KEY, 0 /* Cards */);
});
electron_1.ipcMain.handle("set-view", (_, viewType) => {
    exports.store.set(VIEW_STORE_KEY, viewType);
});
const THEME_STORE_KEY = "theme";
electron_1.ipcMain.on("get-theme", event => {
    event.returnValue = exports.store.get(THEME_STORE_KEY, "system" /* Default */);
});
electron_1.ipcMain.handle("set-theme", (_, theme) => {
    exports.store.set(THEME_STORE_KEY, theme);
    electron_1.nativeTheme.themeSource = theme;
});
electron_1.ipcMain.on("get-theme-dark-color", event => {
    event.returnValue = electron_1.nativeTheme.shouldUseDarkColors;
});
function setThemeListener(manager) {
    electron_1.nativeTheme.removeAllListeners();
    electron_1.nativeTheme.on("updated", () => {
        if (manager.hasWindow()) {
            let contents = manager.mainWindow.webContents;
            if (!contents.isDestroyed()) {
                contents.send("theme-updated", electron_1.nativeTheme.shouldUseDarkColors);
            }
        }
    });
}
exports.setThemeListener = setThemeListener;
const LOCALE_STORE_KEY = "locale";
electron_1.ipcMain.handle("set-locale", (_, option) => {
    exports.store.set(LOCALE_STORE_KEY, option);
});
function getLocaleSettings() {
    return exports.store.get(LOCALE_STORE_KEY, "default");
}
electron_1.ipcMain.on("get-locale-settings", event => {
    event.returnValue = getLocaleSettings();
});
electron_1.ipcMain.on("get-locale", event => {
    let setting = getLocaleSettings();
    let locale = setting === "default" ? electron_1.app.getLocale() : setting;
    event.returnValue = locale;
});
const FONT_SIZE_STORE_KEY = "fontSize";
electron_1.ipcMain.on("get-font-size", event => {
    event.returnValue = exports.store.get(FONT_SIZE_STORE_KEY, 16);
});
electron_1.ipcMain.handle("set-font-size", (_, size) => {
    exports.store.set(FONT_SIZE_STORE_KEY, size);
});
electron_1.ipcMain.on("get-all-settings", event => {
    let output = {};
    for (let [key, value] of exports.store) {
        output[key] = value;
    }
    event.returnValue = output;
});
const FETCH_INTEVAL_STORE_KEY = "fetchInterval";
electron_1.ipcMain.on("get-fetch-interval", event => {
    event.returnValue = exports.store.get(FETCH_INTEVAL_STORE_KEY, 0);
});
electron_1.ipcMain.handle("set-fetch-interval", (_, interval) => {
    exports.store.set(FETCH_INTEVAL_STORE_KEY, interval);
});
const SEARCH_ENGINE_STORE_KEY = "searchEngine";
electron_1.ipcMain.on("get-search-engine", event => {
    event.returnValue = exports.store.get(SEARCH_ENGINE_STORE_KEY, 0 /* Google */);
});
electron_1.ipcMain.handle("set-search-engine", (_, engine) => {
    exports.store.set(SEARCH_ENGINE_STORE_KEY, engine);
});
const SERVICE_CONFIGS_STORE_KEY = "serviceConfigs";
electron_1.ipcMain.on("get-service-configs", event => {
    event.returnValue = exports.store.get(SERVICE_CONFIGS_STORE_KEY, {
        type: 0 /* None */,
    });
});
electron_1.ipcMain.handle("set-service-configs", (_, configs) => {
    exports.store.set(SERVICE_CONFIGS_STORE_KEY, configs);
});
const FILTER_TYPE_STORE_KEY = "filterType";
electron_1.ipcMain.on("get-filter-type", event => {
    event.returnValue = exports.store.get(FILTER_TYPE_STORE_KEY, null);
});
electron_1.ipcMain.handle("set-filter-type", (_, filterType) => {
    exports.store.set(FILTER_TYPE_STORE_KEY, filterType);
});
const LIST_CONFIGS_STORE_KEY = "listViewConfigs";
electron_1.ipcMain.on("get-view-configs", (event, view) => {
    switch (view) {
        case 1 /* List */:
            event.returnValue = exports.store.get(LIST_CONFIGS_STORE_KEY, 1 /* ShowCover */);
            break;
        default:
            event.returnValue = undefined;
            break;
    }
});
electron_1.ipcMain.handle("set-view-configs", (_, view, configs) => {
    switch (view) {
        case 1 /* List */:
            exports.store.set(LIST_CONFIGS_STORE_KEY, configs);
            break;
    }
});
const NEDB_STATUS_STORE_KEY = "useNeDB";
electron_1.ipcMain.on("get-nedb-status", event => {
    event.returnValue = exports.store.get(NEDB_STATUS_STORE_KEY, true);
});
electron_1.ipcMain.handle("set-nedb-status", (_, flag) => {
    exports.store.set(NEDB_STATUS_STORE_KEY, flag);
});
