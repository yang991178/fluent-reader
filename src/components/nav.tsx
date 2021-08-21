import * as React from "react"
import intl from "react-intl-universal"
import { Icon } from "@fluentui/react/lib/Icon"
import { AppState } from "../scripts/models/app"
import { ProgressIndicator, IObjectWithKey } from "@fluentui/react"
import { getWindowBreakpoint } from "../scripts/utils"
import { WindowStateListenerType } from "../schema-types"

type NavProps = {
    state: AppState
    itemShown: boolean
    menu: () => void
    search: () => void
    markAllRead: () => void
    fetch: () => void
    logs: () => void
    views: () => void
    settings: () => void
}

type NavState = {
    maximized: boolean
}

class Nav extends React.Component<NavProps, NavState> {
    constructor(props) {
        super(props)
        this.setBodyFocusState(window.utils.isFocused())
        this.setBodyFullscreenState(window.utils.isFullscreen())
        window.utils.addWindowStateListener(this.windowStateListener)
        this.state = {
            maximized: window.utils.isMaximized(),
        }
    }

    setBodyFocusState = (focused: boolean) => {
        if (focused) document.body.classList.remove("blur")
        else document.body.classList.add("blur")
    }

    setBodyFullscreenState = (fullscreen: boolean) => {
        if (fullscreen) document.body.classList.remove("not-fullscreen")
        else document.body.classList.add("not-fullscreen")
    }

    windowStateListener = (type: WindowStateListenerType, state: boolean) => {
        switch (type) {
            case WindowStateListenerType.Maximized:
                this.setState({ maximized: state })
                break
            case WindowStateListenerType.Fullscreen:
                this.setBodyFullscreenState(state)
                break
            case WindowStateListenerType.Focused:
                this.setBodyFocusState(state)
                break
        }
    }

    navShortcutsHandler = (e: KeyboardEvent | IObjectWithKey) => {
        if (!this.props.state.settings.display) {
            switch (e.key) {
                case "F1":
                    this.props.menu()
                    break
                case "F2":
                    this.props.search()
                    break
                case "F5":
                    this.fetch()
                    break
                case "F6":
                    this.props.markAllRead()
                    break
                case "F7":
                    if (!this.props.itemShown) this.props.logs()
                    break
                case "F8":
                    if (!this.props.itemShown) this.props.views()
                    break
                case "F9":
                    if (!this.props.itemShown) this.props.settings()
                    break
            }
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.navShortcutsHandler)
        if (window.utils.platform === "darwin")
            window.utils.addTouchBarEventsListener(this.navShortcutsHandler)
    }
    componentWillUnmount() {
        document.removeEventListener("keydown", this.navShortcutsHandler)
    }

    minimize = () => {
        window.utils.minimizeWindow()
    }
    maximize = () => {
        window.utils.maximizeWindow()
        this.setState({ maximized: !this.state.maximized })
    }
    close = () => {
        window.utils.closeWindow()
    }

    canFetch = () =>
        this.props.state.sourceInit &&
        this.props.state.feedInit &&
        !this.props.state.syncing &&
        !this.props.state.fetchingItems
    fetching = () => (!this.canFetch() ? " fetching" : "")
    getClassNames = () => {
        const classNames = new Array<string>()
        if (this.props.state.settings.display) classNames.push("hide-btns")
        if (this.props.state.menu) classNames.push("menu-on")
        if (this.props.itemShown) classNames.push("item-on")
        return classNames.join(" ")
    }

    fetch = () => {
        if (this.canFetch()) this.props.fetch()
    }

    views = () => {
        if (this.props.state.contextMenu.event !== "#view-toggle") {
            this.props.views()
        }
    }

    getProgress = () => {
        return this.props.state.fetchingTotal > 0
            ? this.props.state.fetchingProgress / this.props.state.fetchingTotal
            : null
    }

    render() {
        return (
            <nav className={this.getClassNames()}>
                <div className="btn-group">
                    <a
                        className="btn hide-wide"
                        title={intl.get("nav.menu")}
                        onClick={this.props.menu}>
                        <Icon
                            iconName={
                                window.utils.platform === "darwin"
                                    ? "SidePanel"
                                    : "GlobalNavButton"
                            }
                        />
                    </a>
                </div>
                <span className="title">{this.props.state.title}</span>
                <div className="btn-group" style={{ float: "right" }}>
                    <a
                        className={"btn" + this.fetching()}
                        onClick={this.fetch}
                        title={intl.get("nav.refresh")}>
                        <Icon iconName="Refresh" />
                    </a>
                    <a
                        className="btn"
                        id="mark-all-toggle"
                        onClick={this.props.markAllRead}
                        title={intl.get("nav.markAllRead")}
                        onMouseDown={e => {
                            if (
                                this.props.state.contextMenu.event ===
                                "#mark-all-toggle"
                            )
                                e.stopPropagation()
                        }}>
                        <Icon iconName="InboxCheck" />
                    </a>
                    <a
                        className="btn"
                        id="log-toggle"
                        title={intl.get("nav.notifications")}
                        onClick={this.props.logs}>
                        {this.props.state.logMenu.notify ? (
                            <Icon iconName="RingerSolid" />
                        ) : (
                            <Icon iconName="Ringer" />
                        )}
                    </a>
                    <a
                        className="btn"
                        id="view-toggle"
                        title={intl.get("nav.view")}
                        onClick={this.props.views}
                        onMouseDown={e => {
                            if (
                                this.props.state.contextMenu.event ===
                                "#view-toggle"
                            )
                                e.stopPropagation()
                        }}>
                        <Icon iconName="View" />
                    </a>
                    <a
                        className="btn"
                        title={intl.get("nav.settings")}
                        onClick={this.props.settings}>
                        <Icon iconName="Settings" />
                    </a>
                    <span className="seperator"></span>
                    <a
                        className="btn system"
                        title={intl.get("nav.minimize")}
                        onClick={this.minimize}
                        style={{ fontSize: 12 }}>
                        <Icon iconName="Remove" />
                    </a>
                    <a
                        className="btn system"
                        title={intl.get("nav.maximize")}
                        onClick={this.maximize}>
                        {this.state.maximized ? (
                            <Icon
                                iconName="ChromeRestore"
                                style={{ fontSize: 11 }}
                            />
                        ) : (
                            <Icon
                                iconName="Checkbox"
                                style={{ fontSize: 10 }}
                            />
                        )}
                    </a>
                    <a
                        className="btn system close"
                        title={intl.get("close")}
                        onClick={this.close}>
                        <Icon iconName="Cancel" />
                    </a>
                </div>
                {!this.canFetch() && (
                    <ProgressIndicator
                        className="progress"
                        percentComplete={this.getProgress()}
                    />
                )}
            </nav>
        )
    }
}

export default Nav
