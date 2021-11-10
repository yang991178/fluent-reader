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
exports.ServiceTab = void 0;
const React = __importStar(require("react"));
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const react_1 = require("@fluentui/react");
const fever_1 = __importDefault(require("./services/fever"));
const feedbin_1 = __importDefault(require("./services/feedbin"));
const greader_1 = __importDefault(require("./services/greader"));
const inoreader_1 = __importDefault(require("./services/inoreader"));
class ServiceTab extends React.Component {
    constructor(props) {
        super(props);
        this.serviceOptions = () => [
            { key: 1 /* Fever */, text: "Fever API" },
            { key: 2 /* Feedbin */, text: "Feedbin" },
            { key: 3 /* GReader */, text: "Google Reader API (Beta)" },
            { key: 4 /* Inoreader */, text: "Inoreader" },
            { key: -1, text: react_intl_universal_1.default.get("service.suggest") },
        ];
        this.onServiceOptionChange = (_, option) => {
            if (option.key === -1) {
                window.utils.openExternal("https://github.com/yang991178/fluent-reader/issues/23");
            }
            else {
                this.setState({ type: option.key });
            }
        };
        this.exitConfigsTab = () => {
            this.setState({ type: 0 /* None */ });
        };
        this.getConfigsTab = () => {
            switch (this.state.type) {
                case 1 /* Fever */:
                    return (React.createElement(fever_1.default, { ...this.props, exit: this.exitConfigsTab }));
                case 2 /* Feedbin */:
                    return (React.createElement(feedbin_1.default, { ...this.props, exit: this.exitConfigsTab }));
                case 3 /* GReader */:
                    return (React.createElement(greader_1.default, { ...this.props, exit: this.exitConfigsTab }));
                case 4 /* Inoreader */:
                    return (React.createElement(inoreader_1.default, { ...this.props, exit: this.exitConfigsTab }));
                default:
                    return null;
            }
        };
        this.render = () => (React.createElement("div", { className: "tab-body" }, this.state.type === 0 /* None */ ? (React.createElement(react_1.Stack, { horizontalAlign: "center", style: { marginTop: 64 } },
            React.createElement(react_1.Stack, { className: "settings-rules-icons", horizontal: true, tokens: { childrenGap: 12 } },
                React.createElement(react_1.Icon, { iconName: "ThisPC" }),
                React.createElement(react_1.Icon, { iconName: "Sync" }),
                React.createElement(react_1.Icon, { iconName: "Cloud" })),
            React.createElement("span", { className: "settings-hint" },
                react_intl_universal_1.default.get("service.intro"),
                React.createElement(react_1.Link, { onClick: () => window.utils.openExternal("https://github.com/yang991178/fluent-reader/wiki/Support#services"), style: { marginLeft: 6 } }, react_intl_universal_1.default.get("rules.help"))),
            React.createElement(react_1.Dropdown, { placeHolder: react_intl_universal_1.default.get("service.select"), options: this.serviceOptions(), selectedKey: null, onChange: this.onServiceOptionChange, style: { marginTop: 32, width: 180 } }))) : (this.getConfigsTab())));
        this.state = {
            type: props.configs.type,
        };
    }
}
exports.ServiceTab = ServiceTab;
