"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importAll = exports.exportAll = exports.getCurrentLocale = exports.applyThemeSettings = exports.getThemeSettings = exports.setThemeSettings = void 0;
const db = __importStar(require("./db"));
const react_1 = require("@fluentui/react");
const _locales_1 = __importDefault(require("./i18n/_locales"));
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const lightTheme = {
    defaultFontStyle: {
        fontFamily: '"Segoe UI", "Source Han Sans SC Regular", "Microsoft YaHei", sans-serif',
    },
};
const darkTheme = {
    ...lightTheme,
    palette: {
        neutralLighterAlt: "#282828",
        neutralLighter: "#313131",
        neutralLight: "#3f3f3f",
        neutralQuaternaryAlt: "#484848",
        neutralQuaternary: "#4f4f4f",
        neutralTertiaryAlt: "#6d6d6d",
        neutralTertiary: "#c8c8c8",
        neutralSecondary: "#d0d0d0",
        neutralSecondaryAlt: "#d2d0ce",
        neutralPrimaryAlt: "#dadada",
        neutralPrimary: "#ffffff",
        neutralDark: "#f4f4f4",
        black: "#f8f8f8",
        white: "#1f1f1f",
        themePrimary: "#3a96dd",
        themeLighterAlt: "#020609",
        themeLighter: "#091823",
        themeLight: "#112d43",
        themeTertiary: "#235a85",
        themeSecondary: "#3385c3",
        themeDarkAlt: "#4ba0e1",
        themeDark: "#65aee6",
        themeDarker: "#8ac2ec",
        accent: "#3a96dd",
    },
};
function setThemeSettings(theme) {
    window.settings.setThemeSettings(theme);
    applyThemeSettings();
}
exports.setThemeSettings = setThemeSettings;
function getThemeSettings() {
    return window.settings.getThemeSettings();
}
exports.getThemeSettings = getThemeSettings;
function applyThemeSettings() {
    (0, react_1.loadTheme)(window.settings.shouldUseDarkColors() ? darkTheme : lightTheme);
}
exports.applyThemeSettings = applyThemeSettings;
window.settings.addThemeUpdateListener(shouldDark => {
    (0, react_1.loadTheme)(shouldDark ? darkTheme : lightTheme);
});
function getCurrentLocale() {
    let locale = window.settings.getCurrentLocale();
    if (locale in _locales_1.default)
        return locale;
    locale = locale.split("-")[0];
    return locale in _locales_1.default ? locale : "en-US";
}
exports.getCurrentLocale = getCurrentLocale;
async function exportAll() {
    const filters = [{ name: react_intl_universal_1.default.get("app.frData"), extensions: ["frdata"] }];
    const write = await window.utils.showSaveDialog(filters, "*/Fluent_Reader_Backup.frdata");
    if (write) {
        let output = window.settings.getAll();
        output["lovefield"] = {
            sources: await db.sourcesDB.select().from(db.sources).exec(),
            items: await db.itemsDB.select().from(db.items).exec(),
        };
        write(JSON.stringify(output), react_intl_universal_1.default.get("settings.writeError"));
    }
}
exports.exportAll = exportAll;
async function importAll() {
    const filters = [{ name: react_intl_universal_1.default.get("app.frData"), extensions: ["frdata"] }];
    let data = await window.utils.showOpenDialog(filters);
    if (!data)
        return true;
    let confirmed = await window.utils.showMessageBox(react_intl_universal_1.default.get("app.restore"), react_intl_universal_1.default.get("app.confirmImport"), react_intl_universal_1.default.get("confirm"), react_intl_universal_1.default.get("cancel"), true, "warning");
    if (!confirmed)
        return true;
    let configs = JSON.parse(data);
    await db.sourcesDB.delete().from(db.sources).exec();
    await db.itemsDB.delete().from(db.items).exec();
    if (configs.nedb) {
        let openRequest = window.indexedDB.open("NeDB");
        configs.useNeDB = true;
        openRequest.onsuccess = () => {
            let db = openRequest.result;
            let objectStore = db
                .transaction("nedbdata", "readwrite")
                .objectStore("nedbdata");
            let requests = Object.entries(configs.nedb).map(([key, value]) => {
                return objectStore.put(value, key);
            });
            let promises = requests.map(req => new Promise((resolve, reject) => {
                req.onsuccess = () => resolve();
                req.onerror = () => reject();
            }));
            Promise.all(promises).then(() => {
                delete configs.nedb;
                window.settings.setAll(configs);
            });
        };
    }
    else {
        const sRows = configs.lovefield.sources.map(s => {
            s.lastFetched = new Date(s.lastFetched);
            return db.sources.createRow(s);
        });
        const iRows = configs.lovefield.items.map(i => {
            i.date = new Date(i.date);
            i.fetchedDate = new Date(i.fetchedDate);
            return db.items.createRow(i);
        });
        await db.sourcesDB.insert().into(db.sources).values(sRows).exec();
        await db.itemsDB.insert().into(db.items).values(iRows).exec();
        delete configs.lovefield;
        window.settings.setAll(configs);
    }
    return false;
}
exports.importAll = importAll;
