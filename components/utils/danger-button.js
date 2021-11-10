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
class DangerButton extends react_1.PrimaryButton {
    constructor() {
        super(...arguments);
        this.state = {
            confirming: false,
        };
        this.clear = () => {
            this.timerID = null;
            this.setState({ confirming: false });
        };
        this.onClick = (event) => {
            if (!this.props.disabled) {
                if (this.state.confirming) {
                    if (this.props.onClick)
                        this.props.onClick(event);
                    clearTimeout(this.timerID);
                    this.clear();
                }
                else {
                    this.setState({ confirming: true });
                    this.timerID = setTimeout(() => {
                        this.clear();
                    }, 5000);
                }
            }
        };
        this.render = () => (React.createElement(react_1.PrimaryButton, { ...this.props, className: this.props.className + " danger", onClick: this.onClick, text: this.state.confirming
                ? react_intl_universal_1.default.get("dangerButton", {
                    action: this.props.text.toLowerCase(),
                })
                : this.props.text }, this.props.children));
    }
    componentWillUnmount() {
        if (this.timerID)
            clearTimeout(this.timerID);
    }
}
exports.default = DangerButton;
