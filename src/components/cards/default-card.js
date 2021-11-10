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
const card_1 = require("./card");
const info_1 = __importDefault(require("./info"));
const highlights_1 = __importDefault(require("./highlights"));
const className = (props) => {
    let cn = ["card", "default-card"];
    if (props.item.snippet && props.item.thumb)
        cn.push("transform");
    if (props.item.hidden)
        cn.push("hidden");
    return cn.join(" ");
};
const DefaultCard = props => (React.createElement("div", { className: className(props), ...card_1.Card.bindEventsToProps(props), "data-iid": props.item._id, "data-is-focusable": true },
    props.item.thumb ? (React.createElement("img", { className: "bg", src: props.item.thumb })) : null,
    React.createElement("div", { className: "bg" }),
    props.item.thumb ? (React.createElement("img", { className: "head", src: props.item.thumb })) : null,
    React.createElement(info_1.default, { source: props.source, item: props.item }),
    React.createElement("h3", { className: "title" },
        React.createElement(highlights_1.default, { text: props.item.title, filter: props.filter, title: true })),
    React.createElement("p", { className: "snippet" + (props.item.thumb ? "" : " show") },
        React.createElement(highlights_1.default, { text: props.item.snippet, filter: props.filter }))));
exports.default = DefaultCard;
