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
const react_redux_1 = require("react-redux");
const app_1 = require("../../scripts/models/app");
const db = __importStar(require("../../scripts/db"));
const app_2 = __importDefault(require("../../components/settings/app"));
const settings_1 = require("../../scripts/settings");
const source_1 = require("../../scripts/models/source");
const mapDispatchToProps = (dispatch) => ({
    setLanguage: (option) => {
        window.settings.setLocaleSettings(option);
        dispatch((0, app_1.initIntl)());
    },
    setFetchInterval: (interval) => {
        window.settings.setFetchInterval(interval);
        dispatch((0, app_1.setupAutoFetch)());
    },
    deleteArticles: async (days) => {
        dispatch((0, app_1.saveSettings)());
        let date = new Date();
        date.setTime(date.getTime() - days * 86400000);
        await db.itemsDB
            .delete()
            .from(db.items)
            .where(db.items.date.lt(date))
            .exec();
        await dispatch((0, source_1.updateUnreadCounts)());
        dispatch((0, app_1.saveSettings)());
    },
    importAll: async () => {
        dispatch((0, app_1.saveSettings)());
        let cancelled = await (0, settings_1.importAll)();
        if (cancelled)
            dispatch((0, app_1.saveSettings)());
    },
});
const AppTabContainer = (0, react_redux_1.connect)(null, mapDispatchToProps)(app_2.default);
exports.default = AppTabContainer;
