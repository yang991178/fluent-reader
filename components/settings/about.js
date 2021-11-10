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
class AboutTab extends React.Component {
    constructor() {
        super(...arguments);
        this.render = () => (React.createElement("div", { className: "tab-body" },
            React.createElement(react_1.Stack, { className: "settings-about", horizontalAlign: "center" },
                React.createElement("img", { src: "icons/logo.svg", style: { width: 120, height: 120 } }),
                React.createElement("h3", { style: { fontWeight: 600 } }, "Fluent Reader"),
                React.createElement("small", null,
                    react_intl_universal_1.default.get("settings.version"),
                    " ",
                    window.utils.getVersion()),
                React.createElement("p", { className: "settings-hint" }, "Copyright \u00A9 2020 Haoyuan Liu. All rights reserved."),
                React.createElement(react_1.Stack, { horizontal: true, horizontalAlign: "center", tokens: { childrenGap: 12 } },
                    React.createElement("small", null,
                        React.createElement(react_1.Link, { onClick: () => window.utils.openExternal("https://github.com/yang991178/fluent-reader/wiki/Support#keyboard-shortcuts") }, react_intl_universal_1.default.get("settings.shortcuts"))),
                    React.createElement("small", null,
                        React.createElement(react_1.Link, { onClick: () => window.utils.openExternal("https://github.com/yang991178/fluent-reader") }, react_intl_universal_1.default.get("settings.openSource"))),
                    React.createElement("small", null,
                        React.createElement(react_1.Link, { onClick: () => window.utils.openExternal("https://github.com/yang991178/fluent-reader/issues") }, react_intl_universal_1.default.get("settings.feedback")))))));
    }
}
exports.default = AboutTab;
