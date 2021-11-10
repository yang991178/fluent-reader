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
const office_ui_fabric_react_1 = require("office-ui-fabric-react");
const react_1 = require("@fluentui/react");
const list_card_1 = __importDefault(require("../cards/list-card"));
const magazine_card_1 = __importDefault(require("../cards/magazine-card"));
const compact_card_1 = __importDefault(require("../cards/compact-card"));
class ListFeed extends React.Component {
    constructor() {
        super(...arguments);
        this.onRenderItem = (item) => {
            const props = {
                feedId: this.props.feed._id,
                key: item._id,
                item: item,
                source: this.props.sourceMap[item.source],
                filter: this.props.filter,
                viewConfigs: this.props.viewConfigs,
                shortcuts: this.props.shortcuts,
                markRead: this.props.markRead,
                contextMenu: this.props.contextMenu,
                showItem: this.props.showItem,
            };
            if (this.props.viewType === 1 /* List */ &&
                this.props.currentItem === item._id) {
                props.selected = true;
            }
            switch (this.props.viewType) {
                case 2 /* Magazine */:
                    return React.createElement(magazine_card_1.default, { ...props });
                case 3 /* Compact */:
                    return React.createElement(compact_card_1.default, { ...props });
                default:
                    return React.createElement(list_card_1.default, { ...props });
            }
        };
        this.getClassName = () => {
            switch (this.props.viewType) {
                case 2 /* Magazine */:
                    return "magazine-feed";
                case 3 /* Compact */:
                    return "compact-feed";
                default:
                    return "list-feed";
            }
        };
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
    render() {
        return (this.props.feed.loaded && (React.createElement(office_ui_fabric_react_1.FocusZone, { as: "div", id: "refocus", direction: office_ui_fabric_react_1.FocusZoneDirection.vertical, className: this.getClassName(), shouldReceiveFocus: this.canFocusChild, "data-is-scrollable": true },
            React.createElement(office_ui_fabric_react_1.List, { className: react_1.AnimationClassNames.slideUpIn10, items: this.props.items, onRenderCell: this.onRenderItem, ignoreScrollingState: true, usePageCache: true }),
            this.props.feed.loaded && !this.props.feed.allLoaded ? (React.createElement("div", { className: "load-more-wrapper" },
                React.createElement(office_ui_fabric_react_1.PrimaryButton, { id: "load-more", text: react_intl_universal_1.default.get("loadMore"), disabled: this.props.feed.loading, onClick: () => this.props.loadMore(this.props.feed) }))) : null,
            this.props.items.length === 0 && (React.createElement("div", { className: "empty" }, react_intl_universal_1.default.get("article.empty"))))));
    }
}
exports.default = ListFeed;
