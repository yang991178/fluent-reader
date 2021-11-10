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
exports.ContextMenu = exports.renderShareQR = exports.shareSubmenu = void 0;
const React = __importStar(require("react"));
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const qrcode_react_1 = __importDefault(require("qrcode.react"));
const utils_1 = require("../scripts/utils");
const ContextualMenu_1 = require("office-ui-fabric-react/lib/ContextualMenu");
const feed_1 = require("../scripts/models/feed");
const shareSubmenu = (item) => [
    { key: "qr", url: item.link, onRender: exports.renderShareQR },
];
exports.shareSubmenu = shareSubmenu;
const renderShareQR = (item) => (React.createElement("div", { className: "qr-container" },
    React.createElement(qrcode_react_1.default, { value: item.url, size: 150, renderAs: "svg" })));
exports.renderShareQR = renderShareQR;
function getSearchItem(text) {
    const engine = window.settings.getSearchEngine();
    return {
        key: "searchText",
        text: react_intl_universal_1.default.get("context.search", {
            text: (0, utils_1.cutText)(text, 15),
            engine: (0, utils_1.getSearchEngineName)(engine),
        }),
        iconProps: { iconName: "Search" },
        onClick: () => (0, utils_1.webSearch)(text, engine),
    };
}
class ContextMenu extends React.Component {
    constructor() {
        super(...arguments);
        this.getItems = () => {
            switch (this.props.type) {
                case 1 /* Item */:
                    return [
                        {
                            key: "showItem",
                            text: react_intl_universal_1.default.get("context.read"),
                            iconProps: { iconName: "TextDocument" },
                            onClick: () => {
                                this.props.markRead(this.props.item);
                                this.props.showItem(this.props.feedId, this.props.item);
                            },
                        },
                        {
                            key: "openInBrowser",
                            text: react_intl_universal_1.default.get("openExternal"),
                            iconProps: { iconName: "NavigateExternalInline" },
                            onClick: e => {
                                this.props.markRead(this.props.item);
                                window.utils.openExternal(this.props.item.link, (0, utils_1.platformCtrl)(e));
                            },
                        },
                        {
                            key: "markAsRead",
                            text: this.props.item.hasRead
                                ? react_intl_universal_1.default.get("article.markUnread")
                                : react_intl_universal_1.default.get("article.markRead"),
                            iconProps: this.props.item.hasRead
                                ? {
                                    iconName: "RadioBtnOn",
                                    style: { fontSize: 14, textAlign: "center" },
                                }
                                : { iconName: "StatusCircleRing" },
                            onClick: () => {
                                if (this.props.item.hasRead)
                                    this.props.markUnread(this.props.item);
                                else
                                    this.props.markRead(this.props.item);
                            },
                            split: true,
                            subMenuProps: {
                                items: [
                                    {
                                        key: "markBelow",
                                        text: react_intl_universal_1.default.get("article.markBelow"),
                                        iconProps: {
                                            iconName: "Down",
                                            style: { fontSize: 14 },
                                        },
                                        onClick: () => this.props.markAllRead(null, this.props.item.date),
                                    },
                                    {
                                        key: "markAbove",
                                        text: react_intl_universal_1.default.get("article.markAbove"),
                                        iconProps: {
                                            iconName: "Up",
                                            style: { fontSize: 14 },
                                        },
                                        onClick: () => this.props.markAllRead(null, this.props.item.date, false),
                                    },
                                ],
                            },
                        },
                        {
                            key: "toggleStarred",
                            text: this.props.item.starred
                                ? react_intl_universal_1.default.get("article.unstar")
                                : react_intl_universal_1.default.get("article.star"),
                            iconProps: {
                                iconName: this.props.item.starred
                                    ? "FavoriteStar"
                                    : "FavoriteStarFill",
                            },
                            onClick: () => {
                                this.props.toggleStarred(this.props.item);
                            },
                        },
                        {
                            key: "toggleHidden",
                            text: this.props.item.hidden
                                ? react_intl_universal_1.default.get("article.unhide")
                                : react_intl_universal_1.default.get("article.hide"),
                            iconProps: {
                                iconName: this.props.item.hidden ? "View" : "Hide3",
                            },
                            onClick: () => {
                                this.props.toggleHidden(this.props.item);
                            },
                        },
                        {
                            key: "divider_1",
                            itemType: ContextualMenu_1.ContextualMenuItemType.Divider,
                        },
                        {
                            key: "share",
                            text: react_intl_universal_1.default.get("context.share"),
                            iconProps: { iconName: "Share" },
                            subMenuProps: {
                                items: (0, exports.shareSubmenu)(this.props.item),
                            },
                        },
                        {
                            key: "copyTitle",
                            text: react_intl_universal_1.default.get("context.copyTitle"),
                            onClick: () => {
                                window.utils.writeClipboard(this.props.item.title);
                            },
                        },
                        {
                            key: "copyURL",
                            text: react_intl_universal_1.default.get("context.copyURL"),
                            onClick: () => {
                                window.utils.writeClipboard(this.props.item.link);
                            },
                        },
                        ...(this.props.viewConfigs !== undefined
                            ? [
                                {
                                    key: "divider_2",
                                    itemType: ContextualMenu_1.ContextualMenuItemType.Divider,
                                },
                                {
                                    key: "view",
                                    text: react_intl_universal_1.default.get("context.view"),
                                    subMenuProps: {
                                        items: [
                                            {
                                                key: "showCover",
                                                text: react_intl_universal_1.default.get("context.showCover"),
                                                canCheck: true,
                                                checked: Boolean(this.props.viewConfigs &
                                                    1 /* ShowCover */),
                                                onClick: () => this.props.setViewConfigs(this.props.viewConfigs ^
                                                    1 /* ShowCover */),
                                            },
                                            {
                                                key: "showSnippet",
                                                text: react_intl_universal_1.default.get("context.showSnippet"),
                                                canCheck: true,
                                                checked: Boolean(this.props.viewConfigs &
                                                    2 /* ShowSnippet */),
                                                onClick: () => this.props.setViewConfigs(this.props.viewConfigs ^
                                                    2 /* ShowSnippet */),
                                            },
                                            {
                                                key: "fadeRead",
                                                text: react_intl_universal_1.default.get("context.fadeRead"),
                                                canCheck: true,
                                                checked: Boolean(this.props.viewConfigs &
                                                    4 /* FadeRead */),
                                                onClick: () => this.props.setViewConfigs(this.props.viewConfigs ^
                                                    4 /* FadeRead */),
                                            },
                                        ],
                                    },
                                },
                            ]
                            : []),
                    ];
                case 2 /* Text */: {
                    const items = this.props.text
                        ? [
                            {
                                key: "copyText",
                                text: react_intl_universal_1.default.get("context.copy"),
                                iconProps: { iconName: "Copy" },
                                onClick: () => {
                                    window.utils.writeClipboard(this.props.text);
                                },
                            },
                            getSearchItem(this.props.text),
                        ]
                        : [];
                    if (this.props.url) {
                        items.push({
                            key: "urlSection",
                            itemType: ContextualMenu_1.ContextualMenuItemType.Section,
                            sectionProps: {
                                topDivider: items.length > 0,
                                items: [
                                    {
                                        key: "openInBrowser",
                                        text: react_intl_universal_1.default.get("openExternal"),
                                        iconProps: {
                                            iconName: "NavigateExternalInline",
                                        },
                                        onClick: e => {
                                            window.utils.openExternal(this.props.url, (0, utils_1.platformCtrl)(e));
                                        },
                                    },
                                    {
                                        key: "copyURL",
                                        text: react_intl_universal_1.default.get("context.copyURL"),
                                        iconProps: { iconName: "Link" },
                                        onClick: () => {
                                            window.utils.writeClipboard(this.props.url);
                                        },
                                    },
                                ],
                            },
                        });
                    }
                    return items;
                }
                case 5 /* Image */:
                    return [
                        {
                            key: "openInBrowser",
                            text: react_intl_universal_1.default.get("openExternal"),
                            iconProps: { iconName: "NavigateExternalInline" },
                            onClick: e => {
                                if ((0, utils_1.platformCtrl)(e)) {
                                    window.utils.imageCallback(1 /* OpenExternalBg */);
                                }
                                else {
                                    window.utils.imageCallback(0 /* OpenExternal */);
                                }
                            },
                        },
                        {
                            key: "saveImageAs",
                            text: react_intl_universal_1.default.get("context.saveImageAs"),
                            iconProps: { iconName: "SaveTemplate" },
                            onClick: () => {
                                window.utils.imageCallback(2 /* SaveAs */);
                            },
                        },
                        {
                            key: "copyImage",
                            text: react_intl_universal_1.default.get("context.copyImage"),
                            iconProps: { iconName: "FileImage" },
                            onClick: () => {
                                window.utils.imageCallback(3 /* Copy */);
                            },
                        },
                        {
                            key: "copyImageURL",
                            text: react_intl_universal_1.default.get("context.copyImageURL"),
                            iconProps: { iconName: "Link" },
                            onClick: () => {
                                window.utils.imageCallback(4 /* CopyLink */);
                            },
                        },
                    ];
                case 3 /* View */:
                    return [
                        {
                            key: "section_1",
                            itemType: ContextualMenu_1.ContextualMenuItemType.Section,
                            sectionProps: {
                                title: react_intl_universal_1.default.get("context.view"),
                                bottomDivider: true,
                                items: [
                                    {
                                        key: "cardView",
                                        text: react_intl_universal_1.default.get("context.cardView"),
                                        iconProps: { iconName: "GridViewMedium" },
                                        canCheck: true,
                                        checked: this.props.viewType === 0 /* Cards */,
                                        onClick: () => this.props.switchView(0 /* Cards */),
                                    },
                                    {
                                        key: "listView",
                                        text: react_intl_universal_1.default.get("context.listView"),
                                        iconProps: { iconName: "BacklogList" },
                                        canCheck: true,
                                        checked: this.props.viewType === 1 /* List */,
                                        onClick: () => this.props.switchView(1 /* List */),
                                    },
                                    {
                                        key: "magazineView",
                                        text: react_intl_universal_1.default.get("context.magazineView"),
                                        iconProps: { iconName: "Articles" },
                                        canCheck: true,
                                        checked: this.props.viewType ===
                                            2 /* Magazine */,
                                        onClick: () => this.props.switchView(2 /* Magazine */),
                                    },
                                    {
                                        key: "compactView",
                                        text: react_intl_universal_1.default.get("context.compactView"),
                                        iconProps: { iconName: "BulletedList" },
                                        canCheck: true,
                                        checked: this.props.viewType ===
                                            3 /* Compact */,
                                        onClick: () => this.props.switchView(3 /* Compact */),
                                    },
                                ],
                            },
                        },
                        {
                            key: "section_2",
                            itemType: ContextualMenu_1.ContextualMenuItemType.Section,
                            sectionProps: {
                                title: react_intl_universal_1.default.get("context.filter"),
                                bottomDivider: true,
                                items: [
                                    {
                                        key: "allArticles",
                                        text: react_intl_universal_1.default.get("allArticles"),
                                        iconProps: { iconName: "ClearFilter" },
                                        canCheck: true,
                                        checked: (this.props.filter &
                                            ~feed_1.FilterType.Toggles) ==
                                            feed_1.FilterType.Default,
                                        onClick: () => this.props.switchFilter(feed_1.FilterType.Default),
                                    },
                                    {
                                        key: "unreadOnly",
                                        text: react_intl_universal_1.default.get("context.unreadOnly"),
                                        iconProps: {
                                            iconName: "RadioBtnOn",
                                            style: {
                                                fontSize: 14,
                                                textAlign: "center",
                                            },
                                        },
                                        canCheck: true,
                                        checked: (this.props.filter &
                                            ~feed_1.FilterType.Toggles) ==
                                            feed_1.FilterType.UnreadOnly,
                                        onClick: () => this.props.switchFilter(feed_1.FilterType.UnreadOnly),
                                    },
                                    {
                                        key: "starredOnly",
                                        text: react_intl_universal_1.default.get("context.starredOnly"),
                                        iconProps: { iconName: "FavoriteStarFill" },
                                        canCheck: true,
                                        checked: (this.props.filter &
                                            ~feed_1.FilterType.Toggles) ==
                                            feed_1.FilterType.StarredOnly,
                                        onClick: () => this.props.switchFilter(feed_1.FilterType.StarredOnly),
                                    },
                                ],
                            },
                        },
                        {
                            key: "section_3",
                            itemType: ContextualMenu_1.ContextualMenuItemType.Section,
                            sectionProps: {
                                title: react_intl_universal_1.default.get("search"),
                                bottomDivider: true,
                                items: [
                                    {
                                        key: "caseSensitive",
                                        text: react_intl_universal_1.default.get("context.caseSensitive"),
                                        iconProps: {
                                            style: {
                                                fontSize: 12,
                                                fontStyle: "normal",
                                            },
                                            children: "Aa",
                                        },
                                        canCheck: true,
                                        checked: !(this.props.filter &
                                            feed_1.FilterType.CaseInsensitive),
                                        onClick: () => this.props.toggleFilter(feed_1.FilterType.CaseInsensitive),
                                    },
                                    {
                                        key: "fullSearch",
                                        text: react_intl_universal_1.default.get("context.fullSearch"),
                                        iconProps: { iconName: "Breadcrumb" },
                                        canCheck: true,
                                        checked: Boolean(this.props.filter &
                                            feed_1.FilterType.FullSearch),
                                        onClick: () => this.props.toggleFilter(feed_1.FilterType.FullSearch),
                                    },
                                ],
                            },
                        },
                        {
                            key: "showHidden",
                            text: react_intl_universal_1.default.get("context.showHidden"),
                            canCheck: true,
                            checked: Boolean(this.props.filter & feed_1.FilterType.ShowHidden),
                            onClick: () => this.props.toggleFilter(feed_1.FilterType.ShowHidden),
                        },
                    ];
                case 4 /* Group */:
                    return [
                        {
                            key: "markAllRead",
                            text: react_intl_universal_1.default.get("nav.markAllRead"),
                            iconProps: { iconName: "CheckMark" },
                            onClick: () => this.props.markAllRead(this.props.sids),
                        },
                        {
                            key: "refresh",
                            text: react_intl_universal_1.default.get("nav.refresh"),
                            iconProps: { iconName: "Sync" },
                            onClick: () => this.props.fetchItems(this.props.sids),
                        },
                        {
                            key: "manage",
                            text: react_intl_universal_1.default.get("context.manageSources"),
                            iconProps: { iconName: "Settings" },
                            onClick: () => this.props.settings(this.props.sids),
                        },
                    ];
                case 6 /* MarkRead */:
                    return [
                        {
                            key: "section_1",
                            itemType: ContextualMenu_1.ContextualMenuItemType.Section,
                            sectionProps: {
                                title: react_intl_universal_1.default.get("nav.markAllRead"),
                                items: [
                                    {
                                        key: "all",
                                        text: react_intl_universal_1.default.get("allArticles"),
                                        iconProps: { iconName: "ReceiptCheck" },
                                        onClick: () => this.props.markAllRead(),
                                    },
                                    {
                                        key: "1d",
                                        text: react_intl_universal_1.default.get("app.daysAgo", { days: 1 }),
                                        onClick: () => {
                                            let date = new Date();
                                            date.setTime(date.getTime() - 86400000);
                                            this.props.markAllRead(null, date);
                                        },
                                    },
                                    {
                                        key: "3d",
                                        text: react_intl_universal_1.default.get("app.daysAgo", { days: 3 }),
                                        onClick: () => {
                                            let date = new Date();
                                            date.setTime(date.getTime() - 3 * 86400000);
                                            this.props.markAllRead(null, date);
                                        },
                                    },
                                    {
                                        key: "7d",
                                        text: react_intl_universal_1.default.get("app.daysAgo", { days: 7 }),
                                        onClick: () => {
                                            let date = new Date();
                                            date.setTime(date.getTime() - 7 * 86400000);
                                            this.props.markAllRead(null, date);
                                        },
                                    },
                                ],
                            },
                        },
                    ];
                default:
                    return [];
            }
        };
    }
    render() {
        return this.props.type == 0 /* Hidden */ ? null : (React.createElement(ContextualMenu_1.ContextualMenu, { directionalHint: ContextualMenu_1.DirectionalHint.bottomLeftEdge, items: this.getItems(), target: this.props.event ||
                (this.props.position && {
                    left: this.props.position[0],
                    top: this.props.position[1],
                }), onDismiss: this.props.close }));
    }
}
exports.ContextMenu = ContextMenu;
