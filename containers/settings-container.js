"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_redux_1 = require("react-redux");
const reselect_1 = require("reselect");
const app_1 = require("../scripts/models/app");
const settings_1 = __importDefault(require("../components/settings"));
const getApp = (state) => state.app;
const mapStateToProps = (0, reselect_1.createSelector)([getApp], app => ({
    display: app.settings.display,
    blocked: !app.sourceInit ||
        app.syncing ||
        app.fetchingItems ||
        app.settings.saving,
    exitting: app.settings.saving,
}));
const mapDispatchToProps = dispatch => {
    return {
        close: () => dispatch((0, app_1.exitSettings)()),
    };
};
const SettingsContainer = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(settings_1.default);
exports.default = SettingsContainer;
