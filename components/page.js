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
const feed_container_1 = require("../containers/feed-container");
const react_1 = require("@fluentui/react");
const article_container_1 = __importDefault(require("../containers/article-container"));
const article_search_1 = __importDefault(require("./utils/article-search"));
class Page extends React.Component {
    constructor() {
        super(...arguments);
        this.offsetItem = (event, offset) => {
            event.stopPropagation();
            this.props.offsetItem(offset);
        };
        this.prevItem = (event) => this.offsetItem(event, -1);
        this.nextItem = (event) => this.offsetItem(event, 1);
        this.render = () => this.props.viewType !== 1 /* List */ ? (React.createElement(React.Fragment, null,
            this.props.settingsOn ? null : (React.createElement("div", { key: "card", className: "main" + (this.props.menuOn ? " menu-on" : "") },
                React.createElement(article_search_1.default, null),
                this.props.feeds.map(fid => (React.createElement(feed_container_1.FeedContainer, { viewType: this.props.viewType, feedId: fid, key: fid + this.props.viewType }))))),
            this.props.itemId && (React.createElement(react_1.FocusTrapZone, { disabled: this.props.contextOn, ignoreExternalFocusing: true, isClickableOutsideFocusTrap: true, className: "article-container", onClick: this.props.dismissItem },
                React.createElement("div", { className: "article-wrapper", onClick: e => e.stopPropagation() },
                    React.createElement(article_container_1.default, { itemId: this.props.itemId })),
                this.props.itemFromFeed && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "btn-group prev" },
                        React.createElement("a", { className: "btn", onClick: this.prevItem },
                            React.createElement(react_1.Icon, { iconName: "Back" }))),
                    React.createElement("div", { className: "btn-group next" },
                        React.createElement("a", { className: "btn", onClick: this.nextItem },
                            React.createElement(react_1.Icon, { iconName: "Forward" }))))))))) : (React.createElement(React.Fragment, null, this.props.settingsOn ? null : (React.createElement("div", { key: "list", className: "list-main" + (this.props.menuOn ? " menu-on" : "") },
            React.createElement(article_search_1.default, null),
            React.createElement("div", { className: "list-feed-container" }, this.props.feeds.map(fid => (React.createElement(feed_container_1.FeedContainer, { viewType: this.props.viewType, feedId: fid, key: fid })))),
            this.props.itemId ? (React.createElement("div", { className: "side-article-wrapper" },
                React.createElement(article_container_1.default, { itemId: this.props.itemId }))) : (React.createElement("div", { className: "side-logo-wrapper" },
                React.createElement("img", { className: "light", src: "icons/logo-outline.svg" }),
                React.createElement("img", { className: "dark", src: "icons/logo-outline-dark.svg" })))))));
    }
}
exports.default = Page;
