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
const server_1 = require("react-dom/server");
const react_1 = require("@fluentui/react");
const context_menu_1 = require("./context-menu");
const utils_1 = require("../scripts/utils");
const FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 17, 18, 19, 20];
class Article extends React.Component {
    constructor(props) {
        super(props);
        this.getFontSize = () => {
            return window.settings.getFontSize();
        };
        this.setFontSize = (size) => {
            window.settings.setFontSize(size);
            this.setState({ fontSize: size });
        };
        this.fontMenuProps = () => ({
            items: FONT_SIZE_OPTIONS.map(size => ({
                key: String(size),
                text: String(size),
                canCheck: true,
                checked: size === this.state.fontSize,
                onClick: () => this.setFontSize(size),
            })),
        });
        this.moreMenuProps = () => ({
            items: [
                {
                    key: "openInBrowser",
                    text: react_intl_universal_1.default.get("openExternal"),
                    iconProps: { iconName: "NavigateExternalInline" },
                    onClick: e => {
                        window.utils.openExternal(this.props.item.link, (0, utils_1.platformCtrl)(e));
                    },
                },
                {
                    key: "copyURL",
                    text: react_intl_universal_1.default.get("context.copyURL"),
                    iconProps: { iconName: "Link" },
                    onClick: () => {
                        window.utils.writeClipboard(this.props.item.link);
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
                    key: "fontMenu",
                    text: react_intl_universal_1.default.get("article.fontSize"),
                    iconProps: { iconName: "FontSize" },
                    disabled: this.state.loadWebpage,
                    subMenuProps: this.fontMenuProps(),
                },
                {
                    key: "divider_1",
                    itemType: react_1.ContextualMenuItemType.Divider,
                },
                ...(0, context_menu_1.shareSubmenu)(this.props.item),
            ],
        });
        this.contextMenuHandler = (pos, text, url) => {
            if (pos) {
                if (text || url)
                    this.props.textMenu(pos, text, url);
                else
                    this.props.imageMenu(pos);
            }
            else {
                this.props.dismissContextMenu();
            }
        };
        this.keyDownHandler = (input) => {
            if (input.type === "keyDown") {
                switch (input.key) {
                    case "Escape":
                        this.props.dismiss();
                        break;
                    case "ArrowLeft":
                    case "ArrowRight":
                        this.props.offsetItem(input.key === "ArrowLeft" ? -1 : 1);
                        break;
                    case "l":
                    case "L":
                        this.toggleWebpage();
                        break;
                    case "w":
                    case "W":
                        this.toggleFull();
                        break;
                    case "H":
                    case "h":
                        if (!input.meta)
                            this.props.toggleHidden(this.props.item);
                        break;
                    default:
                        const keyboardEvent = new KeyboardEvent("keydown", {
                            code: input.code,
                            key: input.key,
                            shiftKey: input.shift,
                            altKey: input.alt,
                            ctrlKey: input.control,
                            metaKey: input.meta,
                            repeat: input.isAutoRepeat,
                            bubbles: true,
                        });
                        this.props.shortcuts(this.props.item, keyboardEvent);
                        document.dispatchEvent(keyboardEvent);
                        break;
                }
            }
        };
        this.webviewLoaded = () => {
            this.setState({ loaded: true });
        };
        this.webviewError = (reason) => {
            this.setState({ error: true, errorDescription: reason });
        };
        this.webviewReload = () => {
            if (this.webview) {
                this.setState({ loaded: false, error: false });
                this.webview.reload();
            }
            else if (this.state.loadFull) {
                this.loadFull();
            }
        };
        this.componentDidMount = () => {
            let webview = document.getElementById("article");
            if (webview != this.webview) {
                this.webview = webview;
                if (webview) {
                    webview.focus();
                    this.setState({ loaded: false, error: false });
                    webview.addEventListener("did-stop-loading", this.webviewLoaded);
                    let card = document.querySelector(`#refocus div[data-iid="${this.props.item._id}"]`);
                    // @ts-ignore
                    if (card)
                        card.scrollIntoViewIfNeeded();
                }
            }
        };
        this.componentDidUpdate = (prevProps) => {
            if (prevProps.item._id != this.props.item._id) {
                this.setState({
                    loadWebpage: this.props.source.openTarget === 1 /* Webpage */,
                    loadFull: this.props.source.openTarget ===
                        3 /* FullContent */,
                });
                if (this.props.source.openTarget === 3 /* FullContent */)
                    this.loadFull();
            }
            this.componentDidMount();
        };
        this.componentWillUnmount = () => {
            let refocus = document.querySelector(`#refocus div[data-iid="${this.props.item._id}"]`);
            if (refocus)
                refocus.focus();
        };
        this.toggleWebpage = () => {
            if (this.state.loadWebpage) {
                this.setState({ loadWebpage: false });
            }
            else if (this.props.item.link.startsWith("https://") ||
                this.props.item.link.startsWith("http://")) {
                this.setState({ loadWebpage: true, loadFull: false });
            }
        };
        this.toggleFull = () => {
            if (this.state.loadFull) {
                this.setState({ loadFull: false });
            }
            else if (this.props.item.link.startsWith("https://") ||
                this.props.item.link.startsWith("http://")) {
                this.setState({ loadFull: true, loadWebpage: false });
                this.loadFull();
            }
        };
        this.loadFull = async () => {
            this.setState({ fullContent: "", loaded: false, error: false });
            try {
                const result = await fetch(this.props.item.link);
                if (!result || !result.ok)
                    throw new Error();
                const html = await (0, utils_1.decodeFetchResponse)(result, true);
                this.setState({ fullContent: html });
            }
            catch {
                this.setState({
                    loaded: true,
                    error: true,
                    errorDescription: "MERCURY_PARSER_FAILURE",
                });
            }
        };
        this.articleView = () => {
            const a = encodeURIComponent(this.state.loadFull
                ? this.state.fullContent
                : this.props.item.content);
            const h = encodeURIComponent((0, server_1.renderToString)(React.createElement(React.Fragment, null,
                React.createElement("p", { className: "title" }, this.props.item.title),
                React.createElement("p", { className: "date" }, this.props.item.date.toLocaleString(this.props.locale, { hour12: !this.props.locale.startsWith("zh") })),
                React.createElement("article", null))));
            return `article/article.html?a=${a}&h=${h}&s=${this.state.fontSize}&u=${this.props.item.link}&m=${this.state.loadFull ? 1 : 0}`;
        };
        this.render = () => (React.createElement(react_1.FocusZone, { className: "article" },
            React.createElement(react_1.Stack, { horizontal: true, style: { height: 36 } },
                React.createElement("span", { style: { width: 96 } }),
                React.createElement(react_1.Stack, { className: "actions", grow: true, horizontal: true, tokens: { childrenGap: 12 } },
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement("span", { className: "source-name" },
                            this.state.loaded ? (this.props.source.iconurl && (React.createElement("img", { className: "favicon", src: this.props.source.iconurl }))) : (React.createElement(react_1.Spinner, { size: 1 })),
                            this.props.source.name,
                            this.props.item.creator && (React.createElement("span", { className: "creator" }, this.props.item.creator)))),
                    React.createElement(react_1.CommandBarButton, { title: this.props.item.hasRead
                            ? react_intl_universal_1.default.get("article.markUnread")
                            : react_intl_universal_1.default.get("article.markRead"), iconProps: this.props.item.hasRead
                            ? { iconName: "StatusCircleRing" }
                            : {
                                iconName: "RadioBtnOn",
                                style: {
                                    fontSize: 14,
                                    textAlign: "center",
                                },
                            }, onClick: () => this.props.toggleHasRead(this.props.item) }),
                    React.createElement(react_1.CommandBarButton, { title: this.props.item.starred
                            ? react_intl_universal_1.default.get("article.unstar")
                            : react_intl_universal_1.default.get("article.star"), iconProps: {
                            iconName: this.props.item.starred
                                ? "FavoriteStarFill"
                                : "FavoriteStar",
                        }, onClick: () => this.props.toggleStarred(this.props.item) }),
                    React.createElement(react_1.CommandBarButton, { title: react_intl_universal_1.default.get("article.loadFull"), className: this.state.loadFull ? "active" : "", iconProps: { iconName: "RawSource" }, onClick: this.toggleFull }),
                    React.createElement(react_1.CommandBarButton, { title: react_intl_universal_1.default.get("article.loadWebpage"), className: this.state.loadWebpage ? "active" : "", iconProps: { iconName: "Globe" }, onClick: this.toggleWebpage }),
                    React.createElement(react_1.CommandBarButton, { title: react_intl_universal_1.default.get("more"), iconProps: { iconName: "More" }, menuIconProps: { style: { display: "none" } }, menuProps: this.moreMenuProps() })),
                React.createElement(react_1.Stack, { horizontal: true, horizontalAlign: "end", style: { width: 112 } },
                    React.createElement(react_1.CommandBarButton, { title: react_intl_universal_1.default.get("close"), iconProps: { iconName: "BackToWindow" }, onClick: this.props.dismiss }))),
            (!this.state.loadFull || this.state.fullContent) && (React.createElement("webview", { id: "article", className: this.state.error ? "error" : "", key: this.props.item._id +
                    (this.state.loadWebpage ? "_" : ""), src: this.state.loadWebpage
                    ? this.props.item.link
                    : this.articleView(), webpreferences: "contextIsolation,disableDialogs,autoplayPolicy=document-user-activation-required", partition: this.state.loadWebpage ? "sandbox" : undefined })),
            this.state.error && (React.createElement(react_1.Stack, { className: "error-prompt", verticalAlign: "center", horizontalAlign: "center", tokens: { childrenGap: 12 } },
                React.createElement(react_1.Icon, { iconName: "HeartBroken", style: { fontSize: 32 } }),
                React.createElement(react_1.Stack, { horizontal: true, horizontalAlign: "center", tokens: { childrenGap: 7 } },
                    React.createElement("small", null, react_intl_universal_1.default.get("article.error")),
                    React.createElement("small", null,
                        React.createElement(react_1.Link, { onClick: this.webviewReload }, react_intl_universal_1.default.get("article.reload")))),
                React.createElement("span", { style: { fontSize: 11 } }, this.state.errorDescription)))));
        this.state = {
            fontSize: this.getFontSize(),
            loadWebpage: props.source.openTarget === 1 /* Webpage */,
            loadFull: props.source.openTarget === 3 /* FullContent */,
            fullContent: "",
            loaded: false,
            error: false,
            errorDescription: "",
        };
        window.utils.addWebviewContextListener(this.contextMenuHandler);
        window.utils.addWebviewKeydownListener(this.keyDownHandler);
        window.utils.addWebviewErrorListener(this.webviewError);
        if (props.source.openTarget === 3 /* FullContent */)
            this.loadFull();
    }
}
exports.default = Article;
