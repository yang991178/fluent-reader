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
const time_1 = __importDefault(require("../utils/time"));
const CardInfo = props => (React.createElement("p", { className: "info" },
    props.source.iconurl ? React.createElement("img", { src: props.source.iconurl }) : null,
    React.createElement("span", { className: "name" },
        props.source.name,
        props.showCreator && props.item.creator && (React.createElement("span", { className: "creator" }, props.item.creator))),
    props.item.starred ? (React.createElement("span", { className: "starred-indicator" })) : null,
    props.item.hasRead ? null : React.createElement("span", { className: "read-indicator" }),
    props.hideTime ? null : React.createElement(time_1.default, { date: props.item.date })));
exports.default = CardInfo;
