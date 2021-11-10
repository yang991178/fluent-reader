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
const React = __importStar(require("react"));
const react_redux_1 = require("react-redux");
const context_menu_container_1 = require("../containers/context-menu-container");
const app_1 = require("../scripts/models/app");
const page_container_1 = __importDefault(require("../containers/page-container"));
const menu_container_1 = __importDefault(require("../containers/menu-container"));
const nav_container_1 = __importDefault(require("../containers/nav-container"));
const log_menu_container_1 = __importDefault(require("../containers/log-menu-container"));
const settings_container_1 = __importDefault(require("../containers/settings-container"));
const Root = ({ locale, dispatch }) => locale && (React.createElement("div", { id: "root", key: locale, onMouseDown: () => dispatch((0, app_1.closeContextMenu)()) },
    React.createElement(nav_container_1.default, null),
    React.createElement(page_container_1.default, null),
    React.createElement(log_menu_container_1.default, null),
    React.createElement(menu_container_1.default, null),
    React.createElement(settings_container_1.default, null),
    React.createElement(context_menu_container_1.ContextMenuContainer, null)));
const getLocale = (state) => ({ locale: state.app.locale });
exports.default = (0, react_redux_1.connect)(getLocale)(Root);
