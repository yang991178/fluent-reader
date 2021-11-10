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
const utils_1 = require("../../../scripts/utils");
const lite_exporter_1 = __importDefault(require("./lite-exporter"));
class GReaderConfigsTab extends React.Component {
    constructor(props) {
        super(props);
        this.fetchLimitOptions = () => [
            { key: 250, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 250 }) },
            { key: 500, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 500 }) },
            { key: 750, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 750 }) },
            { key: 1000, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 1000 }) },
            { key: 1500, text: react_intl_universal_1.default.get("service.fetchLimitNum", { count: 1500 }) },
            {
                key: Number.MAX_SAFE_INTEGER,
                text: react_intl_universal_1.default.get("service.fetchUnlimited"),
            },
        ];
        this.onFetchLimitOptionChange = (_, option) => {
            this.setState({ fetchLimit: option.key });
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
            return ((0, utils_1.urlTest)(this.state.endpoint.trim()) &&
                (this.state.existing ||
                    (this.state.username && this.state.password)));
        };
        this.save = async () => {
            let configs;
            if (this.state.existing) {
                configs = {
                    ...this.props.configs,
                    endpoint: this.state.endpoint,
                    fetchLimit: this.state.fetchLimit,
                };
                if (this.state.password)
                    configs.password = this.state.password;
            }
            else {
                configs = {
                    type: 3 /* GReader */,
                    endpoint: this.state.endpoint,
                    username: this.state.username,
                    password: this.state.password,
                    fetchLimit: this.state.fetchLimit,
                    useInt64: !this.state.endpoint.endsWith("theoldreader.com"),
                };
                if (this.state.importGroups)
                    configs.importGroups = true;
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
        this.remove = async () => {
            this.props.exit();
            await this.props.remove();
        };
        const configs = props.configs;
        this.state = {
            existing: configs.type === 3 /* GReader */,
            endpoint: configs.endpoint || "",
            username: configs.username || "",
            password: "",
            fetchLimit: configs.fetchLimit || 250,
            importGroups: true,
        };
    }
    render() {
        return (React.createElement(React.Fragment, null,
            !this.state.existing && (React.createElement(react_1.MessageBar, { messageBarType: react_1.MessageBarType.warning }, react_intl_universal_1.default.get("service.overwriteWarning"))),
            React.createElement(react_1.Stack, { horizontalAlign: "center", style: { marginTop: 48 } },
                React.createElement(react_1.Icon, { iconName: "Communications", style: {
                        color: "var(--black)",
                        transform: "rotate(220deg)",
                        fontSize: 32,
                        userSelect: "none",
                    } }),
                React.createElement(react_1.Label, { style: { margin: "8px 0 36px" } }, "Google Reader API"),
                React.createElement(react_1.Stack, { className: "login-form", horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, react_intl_universal_1.default.get("service.endpoint"))),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { onGetErrorMessage: v => (0, utils_1.urlTest)(v.trim())
                                ? ""
                                : react_intl_universal_1.default.get("sources.badUrl"), validateOnLoad: false, name: "endpoint", value: this.state.endpoint, onChange: this.handleInputChange }))),
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
                        React.createElement(react_1.Label, null, react_intl_universal_1.default.get("service.fetchLimit"))),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.Dropdown, { options: this.fetchLimitOptions(), selectedKey: this.state.fetchLimit, onChange: this.onFetchLimitOptionChange }))),
                !this.state.existing && (React.createElement(react_1.Checkbox, { label: react_intl_universal_1.default.get("service.importGroups"), checked: this.state.importGroups, onChange: (_, c) => this.setState({ importGroups: c }) })),
                React.createElement(react_1.Stack, { horizontal: true, style: { marginTop: 32 } },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.PrimaryButton, { disabled: !this.validateForm(), onClick: this.save, text: this.state.existing
                                ? react_intl_universal_1.default.get("edit")
                                : react_intl_universal_1.default.get("confirm") })),
                    React.createElement(react_1.Stack.Item, null, this.state.existing ? (React.createElement(danger_button_1.default, { onClick: this.remove, text: react_intl_universal_1.default.get("delete") })) : (React.createElement(react_1.DefaultButton, { onClick: this.props.exit, text: react_intl_universal_1.default.get("cancel") })))),
                this.state.existing && (React.createElement(lite_exporter_1.default, { serviceConfigs: this.props.configs })))));
    }
}
exports.default = GReaderConfigsTab;
