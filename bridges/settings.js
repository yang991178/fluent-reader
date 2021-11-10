"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const settingsBridge = {
    saveGroups: (groups) => {
        electron_1.ipcRenderer.invoke("set-groups", groups);
    },
    loadGroups: () => {
        return electron_1.ipcRenderer.sendSync("get-groups");
    },
    getDefaultMenu: () => {
        return electron_1.ipcRenderer.sendSync("get-menu");
    },
    setDefaultMenu: (state) => {
        electron_1.ipcRenderer.invoke("set-menu", state);
    },
    getProxyStatus: () => {
        return electron_1.ipcRenderer.sendSync("get-proxy-status");
    },
    toggleProxyStatus: () => {
        electron_1.ipcRenderer.send("toggle-proxy-status");
    },
    getProxy: () => {
        return electron_1.ipcRenderer.sendSync("get-proxy");
    },
    setProxy: (address = null) => {
        electron_1.ipcRenderer.invoke("set-proxy", address);
    },
    getDefaultView: () => {
        return electron_1.ipcRenderer.sendSync("get-view");
    },
    setDefaultView: (viewType) => {
        electron_1.ipcRenderer.invoke("set-view", viewType);
    },
    getThemeSettings: () => {
        return electron_1.ipcRenderer.sendSync("get-theme");
    },
    setThemeSettings: (theme) => {
        electron_1.ipcRenderer.invoke("set-theme", theme);
    },
    shouldUseDarkColors: () => {
        return electron_1.ipcRenderer.sendSync("get-theme-dark-color");
    },
    addThemeUpdateListener: (callback) => {
        electron_1.ipcRenderer.on("theme-updated", (_, shouldDark) => {
            callback(shouldDark);
        });
    },
    setLocaleSettings: (option) => {
        electron_1.ipcRenderer.invoke("set-locale", option);
    },
    getLocaleSettings: () => {
        return electron_1.ipcRenderer.sendSync("get-locale-settings");
    },
    getCurrentLocale: () => {
        return electron_1.ipcRenderer.sendSync("get-locale");
    },
    getFontSize: () => {
        return electron_1.ipcRenderer.sendSync("get-font-size");
    },
    setFontSize: (size) => {
        electron_1.ipcRenderer.invoke("set-font-size", size);
    },
    getFetchInterval: () => {
        return electron_1.ipcRenderer.sendSync("get-fetch-interval");
    },
    setFetchInterval: (interval) => {
        electron_1.ipcRenderer.invoke("set-fetch-interval", interval);
    },
    getSearchEngine: () => {
        return electron_1.ipcRenderer.sendSync("get-search-engine");
    },
    setSearchEngine: (engine) => {
        electron_1.ipcRenderer.invoke("set-search-engine", engine);
    },
    getServiceConfigs: () => {
        return electron_1.ipcRenderer.sendSync("get-service-configs");
    },
    setServiceConfigs: (configs) => {
        electron_1.ipcRenderer.invoke("set-service-configs", configs);
    },
    getFilterType: () => {
        return electron_1.ipcRenderer.sendSync("get-filter-type");
    },
    setFilterType: (filterType) => {
        electron_1.ipcRenderer.invoke("set-filter-type", filterType);
    },
    getViewConfigs: (view) => {
        return electron_1.ipcRenderer.sendSync("get-view-configs", view);
    },
    setViewConfigs: (view, configs) => {
        electron_1.ipcRenderer.invoke("set-view-configs", view, configs);
    },
    getNeDBStatus: () => {
        return electron_1.ipcRenderer.sendSync("get-nedb-status");
    },
    setNeDBStatus: (flag) => {
        electron_1.ipcRenderer.invoke("set-nedb-status", flag);
    },
    getAll: () => {
        return electron_1.ipcRenderer.sendSync("get-all-settings");
    },
    setAll: configs => {
        electron_1.ipcRenderer.invoke("import-all-settings", configs);
    },
};
exports.default = settingsBridge;
