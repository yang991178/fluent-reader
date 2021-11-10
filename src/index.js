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
const ReactDOM = __importStar(require("react-dom"));
const react_redux_1 = require("react-redux");
const redux_1 = require("redux");
const redux_thunk_1 = __importDefault(require("redux-thunk"));
const Icons_1 = require("@fluentui/react/lib/Icons");
const reducer_1 = require("./scripts/reducer");
const root_1 = __importDefault(require("./components/root"));
const settings_1 = require("./scripts/settings");
const app_1 = require("./scripts/models/app");
window.settings.setProxy();
(0, settings_1.applyThemeSettings)();
(0, Icons_1.initializeIcons)("icons/");
const store = (0, redux_1.createStore)(reducer_1.rootReducer, (0, redux_1.applyMiddleware)(redux_thunk_1.default));
store.dispatch((0, app_1.initApp)());
window.utils.addMainContextListener((pos, text) => {
    store.dispatch((0, app_1.openTextMenu)(pos, text));
});
ReactDOM.render(React.createElement(react_redux_1.Provider, { store: store },
    React.createElement(root_1.default, null)), document.getElementById("app"));
