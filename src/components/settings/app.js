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
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const utils_1 = require("../../scripts/utils");
const settings_1 = require("../../scripts/settings");
const react_1 = require("@fluentui/react");
const danger_button_1 = __importDefault(require("../utils/danger-button"));
class AppTab extends React.Component {
    constructor(props) {
        super(props);
        this.getCacheSize = () => {
            window.utils.getCacheSize().then(size => {
                this.setState({ cacheSize: (0, utils_1.byteToMB)(size) });
            });
        };
        this.getItemSize = () => {
            (0, utils_1.calculateItemSize)().then(size => {
                this.setState({ itemSize: (0, utils_1.byteToMB)(size) });
            });
        };
        this.clearCache = () => {
            window.utils.clearCache().then(() => {
                this.getCacheSize();
            });
        };
        this.themeChoices = () => [
            { key: "system" /* Default */, text: react_intl_universal_1.default.get("followSystem") },
            { key: "light" /* Light */, text: react_intl_universal_1.default.get("app.lightTheme") },
            { key: "dark" /* Dark */, text: react_intl_universal_1.default.get("app.darkTheme") },
        ];
        this.fetchIntervalOptions = () => [
            { key: 0, text: react_intl_universal_1.default.get("app.never") },
            { key: 10, text: react_intl_universal_1.default.get("time.minute", { m: 10 }) },
            { key: 15, text: react_intl_universal_1.default.get("time.minute", { m: 15 }) },
            { key: 20, text: react_intl_universal_1.default.get("time.minute", { m: 20 }) },
            { key: 30, text: react_intl_universal_1.default.get("time.minute", { m: 30 }) },
            { key: 45, text: react_intl_universal_1.default.get("time.minute", { m: 45 }) },
            { key: 60, text: react_intl_universal_1.default.get("time.hour", { h: 1 }) },
        ];
        this.onFetchIntervalChanged = (item) => {
            this.props.setFetchInterval(item.key);
        };
        this.searchEngineOptions = () => [
            0 /* Google */,
            1 /* Bing */,
            2 /* Baidu */,
            3 /* DuckDuckGo */,
        ].map(engine => ({
            key: engine,
            text: (0, utils_1.getSearchEngineName)(engine),
        }));
        this.onSearchEngineChanged = (item) => {
            window.settings.setSearchEngine(item.key);
        };
        this.deleteOptions = () => [
            { key: "7", text: react_intl_universal_1.default.get("app.daysAgo", { days: 7 }) },
            { key: "14", text: react_intl_universal_1.default.get("app.daysAgo", { days: 14 }) },
            { key: "21", text: react_intl_universal_1.default.get("app.daysAgo", { days: 21 }) },
            { key: "28", text: react_intl_universal_1.default.get("app.daysAgo", { days: 28 }) },
            { key: "0", text: react_intl_universal_1.default.get("app.deleteAll") },
        ];
        this.deleteChange = (_, item) => {
            this.setState({ deleteIndex: item ? String(item.key) : null });
        };
        this.confirmDelete = () => {
            this.setState({ itemSize: null });
            this.props
                .deleteArticles(parseInt(this.state.deleteIndex))
                .then(() => this.getItemSize());
        };
        this.languageOptions = () => [
            { key: "default", text: react_intl_universal_1.default.get("followSystem") },
            { key: "de", text: "Deutsch" },
            { key: "en-US", text: "English" },
            { key: "es", text: "Español" },
            { key: "fr-FR", text: "Français" },
            { key: "it", text: "Italiano" },
            { key: "nl", text: "Nederlands" },
            { key: "pt-BR", text: "Português do Brasil" },
            { key: "fi-FI", text: "Suomi" },
            { key: "sv", text: "Svenska" },
            { key: "tr", text: "Türkçe" },
            { key: "uk", text: "Українська" },
            { key: "ja", text: "日本語" },
            { key: "zh-CN", text: "中文（简体）" },
            { key: "zh-TW", text: "中文（繁體）" },
        ];
        this.toggleStatus = () => {
            window.settings.toggleProxyStatus();
            this.setState({
                pacStatus: window.settings.getProxyStatus(),
                pacUrl: window.settings.getProxy(),
            });
        };
        this.handleInputChange = event => {
            const name = event.target.name;
            // @ts-ignore
            this.setState({ [name]: event.target.value.trim() });
        };
        this.setUrl = (event) => {
            event.preventDefault();
            if ((0, utils_1.urlTest)(this.state.pacUrl))
                window.settings.setProxy(this.state.pacUrl);
        };
        this.onThemeChange = (_, option) => {
            (0, settings_1.setThemeSettings)(option.key);
            this.setState({ themeSettings: option.key });
        };
        this.render = () => (React.createElement("div", { className: "tab-body" },
            React.createElement(react_1.Label, null, react_intl_universal_1.default.get("app.language")),
            React.createElement(react_1.Stack, { horizontal: true },
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.Dropdown, { defaultSelectedKey: window.settings.getLocaleSettings(), options: this.languageOptions(), onChanged: option => this.props.setLanguage(String(option.key)), style: { width: 200 } }))),
            React.createElement(react_1.ChoiceGroup, { label: react_intl_universal_1.default.get("app.theme"), options: this.themeChoices(), onChange: this.onThemeChange, selectedKey: this.state.themeSettings }),
            React.createElement(react_1.Label, null, react_intl_universal_1.default.get("app.fetchInterval")),
            React.createElement(react_1.Stack, { horizontal: true },
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.Dropdown, { defaultSelectedKey: window.settings.getFetchInterval(), options: this.fetchIntervalOptions(), onChanged: this.onFetchIntervalChanged, style: { width: 200 } }))),
            React.createElement(react_1.Label, null, react_intl_universal_1.default.get("searchEngine.name")),
            React.createElement(react_1.Stack, { horizontal: true },
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.Dropdown, { defaultSelectedKey: window.settings.getSearchEngine(), options: this.searchEngineOptions(), onChanged: this.onSearchEngineChanged, style: { width: 200 } }))),
            React.createElement(react_1.Stack, { horizontal: true, verticalAlign: "baseline" },
                React.createElement(react_1.Stack.Item, { grow: true },
                    React.createElement(react_1.Label, null, react_intl_universal_1.default.get("app.enableProxy"))),
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.Toggle, { checked: this.state.pacStatus, onChange: this.toggleStatus }))),
            this.state.pacStatus && (React.createElement("form", { onSubmit: this.setUrl },
                React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { required: true, onGetErrorMessage: v => (0, utils_1.urlTest)(v.trim())
                                ? ""
                                : react_intl_universal_1.default.get("app.badUrl"), placeholder: react_intl_universal_1.default.get("app.pac"), name: "pacUrl", onChange: this.handleInputChange, value: this.state.pacUrl })),
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.DefaultButton, { disabled: !(0, utils_1.urlTest)(this.state.pacUrl), type: "sumbit", text: react_intl_universal_1.default.get("app.setPac") }))),
                React.createElement("span", { className: "settings-hint up" }, react_intl_universal_1.default.get("app.pacHint")))),
            React.createElement(react_1.Label, null, react_intl_universal_1.default.get("app.cleanup")),
            React.createElement(react_1.Stack, { horizontal: true },
                React.createElement(react_1.Stack.Item, { grow: true },
                    React.createElement(react_1.Dropdown, { placeholder: react_intl_universal_1.default.get("app.deleteChoices"), options: this.deleteOptions(), selectedKey: this.state.deleteIndex, onChange: this.deleteChange })),
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(danger_button_1.default, { disabled: this.state.itemSize === null ||
                            this.state.deleteIndex === null, text: react_intl_universal_1.default.get("app.confirmDelete"), onClick: this.confirmDelete }))),
            React.createElement("span", { className: "settings-hint up" }, this.state.itemSize
                ? react_intl_universal_1.default.get("app.itemSize", { size: this.state.itemSize })
                : react_intl_universal_1.default.get("app.calculatingSize")),
            React.createElement(react_1.Stack, { horizontal: true },
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.DefaultButton, { text: react_intl_universal_1.default.get("app.cache"), disabled: this.state.cacheSize === null ||
                            this.state.cacheSize === "0MB", onClick: this.clearCache }))),
            React.createElement("span", { className: "settings-hint up" }, this.state.cacheSize
                ? react_intl_universal_1.default.get("app.cacheSize", { size: this.state.cacheSize })
                : react_intl_universal_1.default.get("app.calculatingSize")),
            React.createElement(react_1.Label, null, react_intl_universal_1.default.get("app.data")),
            React.createElement(react_1.Stack, { horizontal: true },
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.PrimaryButton, { onClick: settings_1.exportAll, text: react_intl_universal_1.default.get("app.backup") })),
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.DefaultButton, { onClick: this.props.importAll, text: react_intl_universal_1.default.get("app.restore") })))));
        this.state = {
            pacStatus: window.settings.getProxyStatus(),
            pacUrl: window.settings.getProxy(),
            themeSettings: (0, settings_1.getThemeSettings)(),
            itemSize: null,
            cacheSize: null,
            deleteIndex: null,
        };
        this.getItemSize();
        this.getCacheSize();
    }
}
exports.default = AppTab;
