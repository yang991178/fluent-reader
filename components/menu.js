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
exports.Menu = void 0;
const React = __importStar(require("react"));
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const Icon_1 = require("@fluentui/react/lib/Icon");
const Nav_1 = require("office-ui-fabric-react/lib/Nav");
const feed_1 = require("../scripts/models/feed");
const react_1 = require("@fluentui/react");
class Menu extends React.Component {
    constructor() {
        super(...arguments);
        this.countOverflow = (count) => (count >= 1000 ? " 999+" : ` ${count}`);
        this.getLinkGroups = () => [
            {
                links: [
                    {
                        name: react_intl_universal_1.default.get("search"),
                        ariaLabel: react_intl_universal_1.default.get("search") + (this.props.searchOn ? " ✓" : " "),
                        key: "search",
                        icon: "Search",
                        onClick: this.props.toggleSearch,
                        url: null,
                    },
                    {
                        name: react_intl_universal_1.default.get("allArticles"),
                        ariaLabel: react_intl_universal_1.default.get("allArticles") +
                            this.countOverflow(Object.values(this.props.sources)
                                .map(s => s.unreadCount)
                                .reduce((a, b) => a + b, 0)),
                        key: feed_1.ALL,
                        icon: "TextDocument",
                        onClick: () => this.props.allArticles(this.props.selected !== feed_1.ALL),
                        url: null,
                    },
                ],
            },
            {
                name: react_intl_universal_1.default.get("menu.subscriptions"),
                links: this.props.groups
                    .filter(g => g.sids.length > 0)
                    .map(g => {
                    if (g.isMultiple) {
                        let sources = g.sids.map(sid => this.props.sources[sid]);
                        return {
                            name: g.name,
                            ariaLabel: g.name +
                                this.countOverflow(sources
                                    .map(s => s.unreadCount)
                                    .reduce((a, b) => a + b, 0)),
                            key: "g-" + g.index,
                            url: null,
                            isExpanded: g.expanded,
                            onClick: () => this.props.selectSourceGroup(g, "g-" + g.index),
                            links: sources.map(this.getSource),
                        };
                    }
                    else {
                        return this.getSource(this.props.sources[g.sids[0]]);
                    }
                }),
            },
        ];
        this.getSource = (s) => ({
            name: s.name,
            ariaLabel: s.name + this.countOverflow(s.unreadCount),
            key: "s-" + s.sid,
            onClick: () => this.props.selectSource(s),
            iconProps: s.iconurl ? this.getIconStyle(s.iconurl) : null,
            url: null,
        });
        this.getIconStyle = (url) => ({
            style: { width: 16 },
            imageProps: {
                style: { width: "100%" },
                src: url,
            },
        });
        this.onContext = (item, event) => {
            let sids;
            let [type, index] = item.key.split("-");
            if (type === "s") {
                sids = [parseInt(index)];
            }
            else if (type === "g") {
                sids = this.props.groups[parseInt(index)].sids;
            }
            else {
                return;
            }
            this.props.groupContextMenu(sids, event);
        };
        this._onRenderLink = (link) => {
            let count = link.ariaLabel.split(" ").pop();
            return (React.createElement(react_1.Stack, { className: "link-stack", horizontal: true, grow: true, onContextMenu: event => this.onContext(link, event) },
                React.createElement("div", { className: "link-text" }, link.name),
                count && count !== "0" && (React.createElement("div", { className: "unread-count" }, count))));
        };
        this._onRenderGroupHeader = (group) => {
            return (React.createElement("p", { className: "subs-header " + react_1.AnimationClassNames.slideDownIn10 }, group.name));
        };
    }
    render() {
        return (this.props.status && (React.createElement("div", { className: "menu-container" + (this.props.display ? " show" : ""), onClick: this.props.toggleMenu },
            React.createElement("div", { className: "menu" + (this.props.itemOn ? " item-on" : ""), onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "btn-group" },
                    React.createElement("a", { className: "btn hide-wide", title: react_intl_universal_1.default.get("menu.close"), onClick: this.props.toggleMenu },
                        React.createElement(Icon_1.Icon, { iconName: "Back" })),
                    React.createElement("a", { className: "btn inline-block-wide", title: react_intl_universal_1.default.get("menu.close"), onClick: this.props.toggleMenu },
                        React.createElement(Icon_1.Icon, { iconName: window.utils.platform === "darwin"
                                ? "SidePanel"
                                : "GlobalNavButton" }))),
                React.createElement(react_1.FocusZone, { as: "div", disabled: !this.props.display, className: "nav-wrapper" },
                    React.createElement(Nav_1.Nav, { onRenderGroupHeader: this._onRenderGroupHeader, onRenderLink: this._onRenderLink, groups: this.getLinkGroups(), selectedKey: this.props.selected, onLinkExpandClick: (event, item) => this.props.updateGroupExpansion(event, item.key, this.props.selected) }))))));
    }
}
exports.Menu = Menu;
