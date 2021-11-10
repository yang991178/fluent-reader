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
    let cn = ["card", "magazine-card"];
    if (props.item.hasRead)
        cn.push("read");
    if (props.item.hidden)
        cn.push("hidden");
    return cn.join(" ");
};
const MagazineCard = props => (React.createElement("div", { className: className(props), ...card_1.Card.bindEventsToProps(props), "data-iid": props.item._id, "data-is-focusable": true },
    props.item.thumb ? (React.createElement("div", { className: "head" },
        React.createElement("img", { src: props.item.thumb }))) : null,
    React.createElement("div", { className: "data" },
        React.createElement("div", null,
            React.createElement("h3", { className: "title" },
                React.createElement(highlights_1.default, { text: props.item.title, filter: props.filter, title: true })),
            React.createElement("p", { className: "snippet" },
                React.createElement(highlights_1.default, { text: props.item.snippet, filter: props.filter }))),
        React.createElement(info_1.default, { source: props.source, item: props.item, showCreator: true }))));
exports.default = MagazineCard;
