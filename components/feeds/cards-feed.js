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
const default_card_1 = __importDefault(require("../cards/default-card"));
const office_ui_fabric_react_1 = require("office-ui-fabric-react");
const react_1 = require("@fluentui/react");
class CardsFeed extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { width: window.innerWidth, height: window.innerHeight };
        this.updateWindowSize = (entries) => {
            if (entries) {
                this.setState({
                    width: entries[0].contentRect.width - 40,
                    height: window.innerHeight,
                });
            }
        };
        this.getItemCountForPage = () => {
            let elemPerRow = Math.floor(this.state.width / 280);
            let rows = Math.ceil(this.state.height / 304);
            return elemPerRow * rows;
        };
        this.getPageHeight = () => {
            return this.state.height + (304 - (this.state.height % 304));
        };
        this.flexFixItems = () => {
            let elemPerRow = Math.floor(this.state.width / 280);
            let elemLastRow = this.props.items.length % elemPerRow;
            let items = [...this.props.items];
            for (let i = 0; i < elemPerRow - elemLastRow; i += 1)
                items.push(null);
            return items;
        };
        this.onRenderItem = (item, index) => item ? (React.createElement(default_card_1.default, { feedId: this.props.feed._id, key: item._id, item: item, source: this.props.sourceMap[item.source], filter: this.props.filter, shortcuts: this.props.shortcuts, markRead: this.props.markRead, contextMenu: this.props.contextMenu, showItem: this.props.showItem })) : (React.createElement("div", { className: "flex-fix", key: "f-" + index }));
        this.canFocusChild = (el) => {
            if (el.id === "load-more") {
                const container = document.getElementById("refocus");
                const result = container.scrollTop >
                    container.scrollHeight - 2 * container.offsetHeight;
                if (!result)
                    container.scrollTop += 100;
                return result;
            }
            else {
                return true;
            }
        };
    }
    componentDidMount() {
        this.setState({
            width: document.querySelector(".main").clientWidth - 40,
        });
        this.observer = new ResizeObserver(this.updateWindowSize);
        this.observer.observe(document.querySelector(".main"));
    }
    componentWillUnmount() {
        this.observer.disconnect();
    }
    render() {
        return (this.props.feed.loaded && (React.createElement(office_ui_fabric_react_1.FocusZone, { as: "div", id: "refocus", className: "cards-feed-container", shouldReceiveFocus: this.canFocusChild, "data-is-scrollable": true },
            React.createElement(react_1.List, { className: react_1.AnimationClassNames.slideUpIn10, items: this.flexFixItems(), onRenderCell: this.onRenderItem, getItemCountForPage: this.getItemCountForPage, getPageHeight: this.getPageHeight, ignoreScrollingState: true, usePageCache: true }),
            this.props.feed.loaded && !this.props.feed.allLoaded ? (React.createElement("div", { className: "load-more-wrapper" },
                React.createElement(office_ui_fabric_react_1.PrimaryButton, { id: "load-more", text: react_intl_universal_1.default.get("loadMore"), disabled: this.props.feed.loading, onClick: () => this.props.loadMore(this.props.feed) }))) : null,
            this.props.items.length === 0 && (React.createElement("div", { className: "empty" }, react_intl_universal_1.default.get("article.empty"))))));
    }
}
exports.default = CardsFeed;
