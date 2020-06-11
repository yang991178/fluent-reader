import * as React from "react"
import intl = require("react-intl-universal")
import { remote } from "electron"
import { Icon } from "@fluentui/react/lib/Icon"
import { AppState } from "../scripts/models/app"
import { ProgressIndicator } from "@fluentui/react"

type NavProps = {
    state: AppState,
    itemShown: boolean,
    fetch: () => void,
    menu: () => void,
    logs: () => void,
    views: () => void,
    settings: () => void
}

type NavState = {
    maximized: boolean,
    window: Electron.BrowserWindow
}

class Nav extends React.Component<NavProps, NavState> {
    constructor(props) {
        super(props)
        let window = remote.getCurrentWindow()
        window.on("maximize", () => {
            this.setState({ maximized: true })
        })
        window.on("unmaximize", () => {
            this.setState({ maximized: false })
        })
        this.state = {
            maximized: remote.getCurrentWindow().isMaximized(),
            window: window
        }
    }

    minimize = () => {
        this.state.window.minimize()
    }
    maximize = () => {
        if (this.state.maximized) {
            this.state.window.unmaximize()
        } else {
            this.state.window.maximize()
        }
        this.setState({ maximized: !this.state.maximized })
    }
    close = () => {
        this.state.window.close()
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
                        <Icon iconName="GlobalNavButton" />
                    </a>
                </div>
                <span className="title">{this.props.state.title}</span>
                <div className="btn-group" style={{float:"right"}}>
                    <a className={"btn"+this.fetching()} 
                        onClick={this.fetch} 
                        title={intl.get("nav.refresh")}>
                        <Icon iconName="Refresh" />
                    </a>
                    <a className="btn" title={intl.get("nav.markAllRead")}>
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