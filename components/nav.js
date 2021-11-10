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
const Icon_1 = require("@fluentui/react/lib/Icon");
const react_1 = require("@fluentui/react");
class Nav extends React.Component {
    constructor(props) {
        super(props);
        this.setBodyFocusState = (focused) => {
            if (focused)
                document.body.classList.remove("blur");
            else
                document.body.classList.add("blur");
        };
        this.setBodyFullscreenState = (fullscreen) => {
            if (fullscreen)
                document.body.classList.remove("not-fullscreen");
            else
                document.body.classList.add("not-fullscreen");
        };
        this.windowStateListener = (type, state) => {
            switch (type) {
                case 0 /* Maximized */:
                    this.setState({ maximized: state });
                    break;
                case 2 /* Fullscreen */:
                    this.setBodyFullscreenState(state);
                    break;
                case 1 /* Focused */:
                    this.setBodyFocusState(state);
                    break;
            }
        };
        this.navShortcutsHandler = (e) => {
            if (!this.props.state.settings.display) {
                switch (e.key) {
                    case "F1":
                        this.props.menu();
                        break;
                    case "F2":
                        this.props.search();
                        break;
                    case "F5":
                        this.fetch();
                        break;
                    case "F6":
                        this.props.markAllRead();
                        break;
                    case "F7":
                        if (!this.props.itemShown)
                            this.props.logs();
                        break;
                    case "F8":
                        if (!this.props.itemShown)
                            this.props.views();
                        break;
                    case "F9":
                        if (!this.props.itemShown)
                            this.props.settings();
                        break;
                }
            }
        };
        this.minimize = () => {
            window.utils.minimizeWindow();
        };
        this.maximize = () => {
            window.utils.maximizeWindow();
            this.setState({ maximized: !this.state.maximized });
        };
        this.close = () => {
            window.utils.closeWindow();
        };
        this.canFetch = () => this.props.state.sourceInit &&
            this.props.state.feedInit &&
            !this.props.state.syncing &&
            !this.props.state.fetchingItems;
        this.fetching = () => (!this.canFetch() ? " fetching" : "");
        this.getClassNames = () => {
            const classNames = new Array();
            if (this.props.state.settings.display)
                classNames.push("hide-btns");
            if (this.props.state.menu)
                classNames.push("menu-on");
            if (this.props.itemShown)
                classNames.push("item-on");
            return classNames.join(" ");
        };
        this.fetch = () => {
            if (this.canFetch())
                this.props.fetch();
        };
        this.views = () => {
            if (this.props.state.contextMenu.event !== "#view-toggle") {
                this.props.views();
            }
        };
        this.getProgress = () => {
            return this.props.state.fetchingTotal > 0
                ? this.props.state.fetchingProgress / this.props.state.fetchingTotal
                : null;
        };
        this.setBodyFocusState(window.utils.isFocused());
        this.setBodyFullscreenState(window.utils.isFullscreen());
        window.utils.addWindowStateListener(this.windowStateListener);
        this.state = {
            maximized: window.utils.isMaximized(),
        };
    }
    componentDidMount() {
        document.addEventListener("keydown", this.navShortcutsHandler);
        if (window.utils.platform === "darwin")
            window.utils.addTouchBarEventsListener(this.navShortcutsHandler);
    }
    componentWillUnmount() {
        document.removeEventListener("keydown", this.navShortcutsHandler);
    }
    render() {
        return (React.createElement("nav", { className: this.getClassNames() },
            React.createElement("div", { className: "btn-group" },
                React.createElement("a", { className: "btn hide-wide", title: react_intl_universal_1.default.get("nav.menu"), onClick: this.props.menu },
                    React.createElement(Icon_1.Icon, { iconName: window.utils.platform === "darwin"
                            ? "SidePanel"
                            : "GlobalNavButton" }))),
            React.createElement("span", { className: "title" }, this.props.state.title),
            React.createElement("div", { className: "btn-group", style: { float: "right" } },
                React.createElement("a", { className: "btn" + this.fetching(), onClick: this.fetch, title: react_intl_universal_1.default.get("nav.refresh") },
                    React.createElement(Icon_1.Icon, { iconName: "Refresh" })),
                React.createElement("a", { className: "btn", id: "mark-all-toggle", onClick: this.props.markAllRead, title: react_intl_universal_1.default.get("nav.markAllRead"), onMouseDown: e => {
                        if (this.props.state.contextMenu.event ===
                            "#mark-all-toggle")
                            e.stopPropagation();
                    } },
                    React.createElement(Icon_1.Icon, { iconName: "InboxCheck" })),
                React.createElement("a", { className: "btn", id: "log-toggle", title: react_intl_universal_1.default.get("nav.notifications"), onClick: this.props.logs }, this.props.state.logMenu.notify ? (React.createElement(Icon_1.Icon, { iconName: "RingerSolid" })) : (React.createElement(Icon_1.Icon, { iconName: "Ringer" }))),
                React.createElement("a", { className: "btn", id: "view-toggle", title: react_intl_universal_1.default.get("nav.view"), onClick: this.props.views, onMouseDown: e => {
                        if (this.props.state.contextMenu.event ===
                            "#view-toggle")
                            e.stopPropagation();
                    } },
                    React.createElement(Icon_1.Icon, { iconName: "View" })),
                React.createElement("a", { className: "btn", title: react_intl_universal_1.default.get("nav.settings"), onClick: this.props.settings },
                    React.createElement(Icon_1.Icon, { iconName: "Settings" })),
                React.createElement("span", { className: "seperator" }),
                React.createElement("a", { className: "btn system", title: react_intl_universal_1.default.get("nav.minimize"), onClick: this.minimize, style: { fontSize: 12 } },
                    React.createElement(Icon_1.Icon, { iconName: "Remove" })),
                React.createElement("a", { className: "btn system", title: react_intl_universal_1.default.get("nav.maximize"), onClick: this.maximize }, this.state.maximized ? (React.createElement(Icon_1.Icon, { iconName: "ChromeRestore", style: { fontSize: 11 } })) : (React.createElement(Icon_1.Icon, { iconName: "Checkbox", style: { fontSize: 10 } }))),
                React.createElement("a", { className: "btn system close", title: react_intl_universal_1.default.get("close"), onClick: this.close },
                    React.createElement(Icon_1.Icon, { iconName: "Cancel" }))),
            !this.canFetch() && (React.createElement(react_1.ProgressIndicator, { className: "progress", percentComplete: this.getProgress() }))));
    }
}
exports.default = Nav;
