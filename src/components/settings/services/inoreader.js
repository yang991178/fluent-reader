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
const react_1 = require("@fluentui/react");
const danger_button_1 = __importDefault(require("../../utils/danger-button"));
const lite_exporter_1 = __importDefault(require("./lite-exporter"));
const endpointOptions = [
    "https://www.inoreader.com",
    "https://www.innoreader.com",
    "https://jp.inoreader.com",
].map(s => ({ key: s, text: s }));
const openSupport = () => window.utils.openExternal("https://github.com/yang991178/fluent-reader/wiki/Support#inoreader");
class InoreaderConfigsTab extends React.Component {
    constructor(props) {
        super(props);
        this.fetchLimitOptions = () => [
            { key: 250, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 250 }) },
            { key: 500, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 500 }) },
            { key: 750, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 750 }) },
            { key: 1000, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 1000 }) },
            {
                key: Number.MAX_SAFE_INTEGER,
                text: react_intl_universal_1.default.get("service.fetchUnlimited"),
            },
        ];
        this.onFetchLimitOptionChange = (_, option) => {
            this.setState({ fetchLimit: option.key });
        };
        this.onEndpointChange = (_, option) => {
            this.setState({ endpoint: option.key });
        };
        this.handleInputChange = event => {
            const name = event.target.name;
            // @ts-expect-error
            this.setState({ [name]: event.target.value });
        };
        this.checkNotEmpty = (v) => {
            return !this.state.existing && v.length == 0
                ? react_intl_universal_1.default.get("emptyField")
                : "";
        };
        this.validateForm = () => {
            return ((this.state.existing ||
                (this.state.username && this.state.password)) &&
                this.state.apiId &&
                this.state.apiKey);
        };
        this.save = async () => {
            let configs;
            if (this.state.existing) {
                configs = {
                    ...this.props.configs,
                    endpoint: this.state.endpoint,
                    fetchLimit: this.state.fetchLimit,
                    inoreaderId: this.state.apiId,
                    inoreaderKey: this.state.apiKey,
                    removeInoreaderAd: this.state.removeAd,
                };
                if (this.state.password)
                    configs.password = this.state.password;
            }
            else {
                configs = {
                    type: 4 /* Inoreader */,
                    endpoint: this.state.endpoint,
                    username: this.state.username,
                    password: this.state.password,
                    inoreaderId: this.state.apiId,
                    inoreaderKey: this.state.apiKey,
                    removeInoreaderAd: this.state.removeAd,
                    fetchLimit: this.state.fetchLimit,
                    importGroups: true,
                    useInt64: true,
                };
            }
            this.props.blockActions();
            configs = (await this.props.reauthenticate(configs));
            const valid = await this.props.authenticate(configs);
            if (valid) {
                this.props.save(configs);
                this.setState({ existing: true });
                this.props.sync();
            }
            else {
                this.props.blockActions();
                window.utils.showErrorBox(react_intl_universal_1.default.get("service.failure"), react_intl_universal_1.default.get("service.failureHint"));
            }
        };
        this.createKey = () => window.utils.openExternal(this.state.endpoint + "/all_articles#preferences-developer");
        this.remove = async () => {
            this.props.exit();
            await this.props.remove();
        };
        const configs = props.configs;
        this.state = {
            existing: configs.type === 4 /* Inoreader */,
            endpoint: configs.endpoint || "https://www.inoreader.com",
            username: configs.username || "",
            password: "",
            apiId: configs.inoreaderId || "",
            apiKey: configs.inoreaderKey || "",
            removeAd: configs.removeInoreaderAd === undefined
                ? true
                : configs.removeInoreaderAd,
            fetchLimit: configs.fetchLimit || 250,
        };
    }
    render() {
        return (React.createElement(React.Fragment, null,
            React.createElement(react_1.MessageBar, { messageBarType: react_1.MessageBarType.severeWarning, isMultiline: false, actions: React.createElement(react_1.MessageBarButton, { text: react_intl_universal_1.default.get("create"), onClick: this.createKey }) },
                react_intl_universal_1.default.get("service.rateLimitWarning"),
                React.createElement(react_1.Link, { onClick: openSupport, style: { marginLeft: 6 } }, react_intl_universal_1.default.get("rules.help"))),
            !this.state.existing && (React.createElement(react_1.MessageBar, { messageBarType: react_1.MessageBarType.warning }, react_intl_universal_1.default.get("service.overwriteWarning"))),
            React.createElement(react_1.Stack, { horizontalAlign: "center", style: { marginTop: 48 } },
                React.createElement("svg", { style: {
                        fill: "var(--black)",
                        width: 36,
                        userSelect: "none",
                    }, viewBox: "0 0 72 72" },
                    React.createElement("path", { transform: "translate(-1250.000000, -1834.000000)", d: "M1286,1834 C1305.88225,1834 1322,1850.11775 1322,1870 C1322,1889.88225 1305.88225,1906 1286,1906 C1266.11775,1906 1250,1889.88225 1250,1870 C1250,1850.11775 1266.11775,1834 1286,1834 Z M1278.01029,1864.98015 C1270.82534,1864.98015 1265,1870.80399 1265,1877.98875 C1265,1885.17483 1270.82534,1891 1278.01029,1891 C1285.19326,1891 1291.01859,1885.17483 1291.01859,1877.98875 C1291.01859,1870.80399 1285.19326,1864.98015 1278.01029,1864.98015 Z M1281.67908,1870.54455 C1283.73609,1870.54455 1285.40427,1872.21533 1285.40427,1874.2703 C1285.40427,1876.33124 1283.73609,1877.9987 1281.67908,1877.9987 C1279.61941,1877.9987 1277.94991,1876.33124 1277.94991,1874.2703 C1277.94991,1872.21533 1279.61941,1870.54455 1281.67908,1870.54455 Z M1278.01003,1855.78714 L1278.01003,1860.47435 C1287.66605,1860.47435 1295.52584,1868.33193 1295.52584,1877.98901 L1295.52584,1877.98901 L1300.21451,1877.98901 C1300.21451,1865.74746 1290.25391,1855.78714 1278.01003,1855.78714 L1278.01003,1855.78714 Z M1278.01009,1846 L1278.01009,1850.68721 C1285.30188,1850.68721 1292.15771,1853.5278 1297.31618,1858.68479 C1302.47398,1863.84179 1305.31067,1870.69942 1305.31067,1877.98901 L1305.31067,1877.98901 L1310,1877.98901 C1310,1869.44534 1306.67162,1861.41192 1300.6293,1855.36845 C1294.58632,1849.32696 1286.55533,1846 1278.01009,1846 L1278.01009,1846 Z" })),
                React.createElement(react_1.Label, { style: { margin: "8px 0 36px" } }, "Inoreader"),
                React.createElement(react_1.Stack, { className: "login-form", horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, react_intl_universal_1.default.get("service.endpoint"))),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.Dropdown, { options: endpointOptions, selectedKey: this.state.endpoint, onChange: this.onEndpointChange }))),
                React.createElement(react_1.Stack, { className: "login-form", horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, react_intl_universal_1.default.get("service.username"))),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { disabled: this.state.existing, onGetErrorMessage: this.checkNotEmpty, validateOnLoad: false, name: "username", value: this.state.username, onChange: this.handleInputChange }))),
                React.createElement(react_1.Stack, { className: "login-form", horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, react_intl_universal_1.default.get("service.password"))),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { type: "password", placeholder: this.state.existing
                                ? react_intl_universal_1.default.get("service.unchanged")
                                : "", onGetErrorMessage: this.checkNotEmpty, validateOnLoad: false, name: "password", value: this.state.password, onChange: this.handleInputChange }))),
                React.createElement(react_1.Stack, { className: "login-form", horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, "API ID")),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { onGetErrorMessage: this.checkNotEmpty, validateOnLoad: false, name: "apiId", value: this.state.apiId, onChange: this.handleInputChange }))),
                React.createElement(react_1.Stack, { className: "login-form", horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, "API Key")),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { onGetErrorMessage: this.checkNotEmpty, validateOnLoad: false, name: "apiKey", value: this.state.apiKey, onChange: this.handleInputChange }))),
                React.createElement(react_1.Stack, { className: "login-form", horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, react_intl_universal_1.default.get("service.fetchLimit"))),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.Dropdown, { options: this.fetchLimitOptions(), selectedKey: this.state.fetchLimit, onChange: this.onFetchLimitOptionChange }))),
                React.createElement(react_1.Checkbox, { label: react_intl_universal_1.default.get("service.removeAd"), checked: this.state.removeAd, onChange: (_, c) => this.setState({ removeAd: c }) }),
                React.createElement(react_1.Stack, { horizontal: true, style: { marginTop: 32 } },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.PrimaryButton, { disabled: !this.validateForm(), onClick: this.save, text: this.state.existing
                                ? react_intl_universal_1.default.get("edit")
                                : react_intl_universal_1.default.get("confirm") })),
                    React.createElement(react_1.Stack.Item, null, this.state.existing ? (React.createElement(danger_button_1.default, { onClick: this.remove, text: react_intl_universal_1.default.get("delete") })) : (React.createElement(react_1.DefaultButton, { onClick: this.props.exit, text: react_intl_universal_1.default.get("cancel") })))),
                this.state.existing && (React.createElement(lite_exporter_1.default, { serviceConfigs: this.props.configs })))));
    }
}
exports.default = InoreaderConfigsTab;
