import * as React from "react"
import intl from "react-intl-universal"
import { Icon } from "@fluentui/react/lib/Icon"
import { AppState } from "../scripts/models/app"
import { ProgressIndicator } from "@fluentui/react"
import { getWindowBreakpoint } from "../scripts/utils"

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
    maximized: boolean,
}

class Nav extends React.Component<NavProps, NavState> {
    constructor(props) {
        super(props)
        window.utils.addWindowStateListener(this.setMaximizeState)
        this.state = {
            maximized: window.utils.isMaximized()
        }
    }

    setMaximizeState = (state: boolean) => {
        this.setState({ maximized: state })
    }

    navShortcutsHandler = (e: KeyboardEvent) => {
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
                    if (!this.props.state.menu || getWindowBreakpoint())
                        this.props.logs()
                    break
                case "F8":
                    if (!this.props.state.menu || getWindowBreakpoint())
                        this.props.views()
                    break
                case "F9":
                    this.props.settings()
                    break
            }
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.navShortcutsHandler)
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

    canFetch = () => this.props.state.sourceInit && this.props.state.feedInit && !this.props.state.fetchingItems
    fetching = () => !this.canFetch() ? " fetching" : ""
    menuOn = () => this.props.state.menu ? " menu-on" : ""
    itemOn = () => this.props.itemShown ? " item-on" : ""
    hideButtons = () => this.props.state.settings.display ? "hide-btns" : ""

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
            <nav className={this.hideButtons() + this.menuOn() + this.itemOn()}>
                <div className="btn-group">
                    <a className="btn hide-wide" 
                        title={intl.get("nav.menu")} 
                        onClick={this.props.menu}>
                        <Icon iconName={process.platform === "darwin" ? "SidePanel" : "GlobalNavButton"} />
                    </a>
                </div>
                <span className="title">{this.props.state.title}</span>
                <div className="btn-group" style={{float:"right"}}>
                    <a className={"btn"+this.fetching()} 
                        onClick={this.fetch} 
                        title={intl.get("nav.refresh")}>
                        <Icon iconName="Refresh" />
                    </a>
                    <a className="btn" 
                        onClick={this.props.markAllRead}
                        title={intl.get("nav.markAllRead")}>
                        <Icon iconName="InboxCheck" />
                    </a>
                    <a className="btn" 
                        id="log-toggle" 
                        title={intl.get("nav.notifications")} 
                        onClick={this.props.logs}>
                        {this.props.state.logMenu.notify ? <Icon iconName="RingerSolid" /> : <Icon iconName="Ringer" />}
                    </a>
                    <a className="btn" 
                        id="view-toggle" 
                        title={intl.get("nav.view")}
                        onClick={this.props.views} 
                        onMouseDown={e => {
                            if (this.props.state.contextMenu.event === "#view-toggle") e.stopPropagation()}}>
                            <Icon iconName="View" /></a>
                    <a className="btn" 
                        title={intl.get("nav.settings")}
                        onClick={this.props.settings}>
                        <Icon iconName="Settings" />
                    </a>
                    <span className="seperator"></span>
                    <a className="btn system" 
                        title={intl.get("nav.minimize")} 
                        onClick={this.minimize} 
                        style={{fontSize: 12}}>
                        <Icon iconName="Remove" />
                    </a>
                    <a className="btn system" 
                        title={intl.get("nav.maximize")} 
                        onClick={this.maximize}>
                        {this.state.maximized 
                            ? <Icon iconName="ChromeRestore" style={{fontSize: 11}} /> 
                            : <Icon iconName="Checkbox" style={{fontSize: 10}} />}
                    </a>
                    <a className="btn system close" 
                        title={intl.get("close")}
                        onClick={this.close}>
                        <Icon iconName="Cancel" />
                    </a>
                </div>
                {!this.canFetch() && 
                    <ProgressIndicator
                        className="progress"
                        percentComplete={this.getProgress()} />
                }
            </nav>
        )
    }
}

export default Nav