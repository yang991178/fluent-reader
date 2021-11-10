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
const context_menu_1 = require("../../context-menu");
const utils_1 = require("../../../scripts/utils");
const LEARN_MORE_URL = "https://github.com/yang991178/fluent-reader/wiki/Support#mobile-app";
const LiteExporter = props => {
    let url = "https://hyliu.me/fr2l/?";
    const params = new URLSearchParams();
    switch (props.serviceConfigs.type) {
        case 1 /* Fever */: {
            const configs = props.serviceConfigs;
            params.set("t", "f");
            params.set("e", configs.endpoint);
            params.set("u", configs.username);
            params.set("k", configs.apiKey);
            break;
        }
        case 3 /* GReader */:
        case 4 /* Inoreader */: {
            const configs = props.serviceConfigs;
            params.set("t", configs.type == 3 /* GReader */ ? "g" : "i");
            params.set("e", configs.endpoint);
            params.set("u", configs.username);
            params.set("p", btoa(configs.password));
            if (configs.inoreaderId) {
                params.set("i", configs.inoreaderId);
                params.set("k", configs.inoreaderKey);
            }
            break;
        }
        case 2 /* Feedbin */: {
            const configs = props.serviceConfigs;
            params.set("t", "fb");
            params.set("e", configs.endpoint);
            params.set("u", configs.username);
            params.set("p", btoa(configs.password));
            break;
        }
    }
    url += params.toString();
    const menuProps = {
        directionalHint: react_1.DirectionalHint.bottomCenter,
        items: [
            { key: "qr", url: url, onRender: context_menu_1.renderShareQR },
            { key: "divider_1", itemType: react_1.ContextualMenuItemType.Divider },
            {
                key: "openInBrowser",
                text: react_intl_universal_1.default.get("rules.help"),
                iconProps: { iconName: "NavigateExternalInline" },
                onClick: e => {
                    window.utils.openExternal(LEARN_MORE_URL, (0, utils_1.platformCtrl)(e));
                },
            },
        ],
    };
    return (React.createElement(react_1.Stack, { style: { marginTop: 32 } },
        React.createElement(react_1.DefaultButton, { text: react_intl_universal_1.default.get("service.exportToLite"), onRenderMenuIcon: () => React.createElement(React.Fragment, null), menuProps: menuProps })));
};
exports.default = LiteExporter;
