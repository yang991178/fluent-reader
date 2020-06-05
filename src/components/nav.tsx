import * as React from "react"
import { ipcRenderer, remote } from "electron"
import { Icon } from "@fluentui/react/lib/Icon"
import { AppState, MenuStatus } from "../scripts/models/app"

type NavProps = {
    state: AppState,
    fetch: () => void,
    menu: () => void,
    logs: () => void,
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
    menuOn = () => this.props.state.menu == MenuStatus.Open ? " on" : ""
    hideButtons = () => (this.props.state.menu == MenuStatus.Open || this.props.state.settings.display) ? "hide-btns" : ""

    fetch = () => {
        if (this.canFetch()) this.props.fetch()
    }

    render() {
        return (
            <nav className={this.hideButtons()}>
                <div className="btn-group">
                    <a className="btn" title="菜单" onClick={this.props.menu}><Icon iconName="GlobalNavButton" /></a>
                </div>
                <span className="title">{this.props.state.title}</span>
                <div className="btn-group" style={{float:"right"}}>
                    <a className={"btn"+this.fetching()} onClick={this.fetch} title="刷新"><Icon iconName="Refresh" /></a>
                    <a className="btn" title="全部标为已读"><Icon iconName="InboxCheck" /></a>
                    <a className="btn" id="log-toggle" title="消息" onClick={this.props.logs}>
                        {this.props.state.logMenu.notify ? <Icon iconName="RingerSolid" /> : <Icon iconName="Ringer" />}
                    </a>
                    <a className="btn" title="视图"><Icon iconName="View" /></a>
                    <a className="btn" title="选项" onClick={this.props.settings}><Icon iconName="Settings" /></a>
                    <span className="seperator"></span>
                    <a className={"btn system"+this.menuOn()} title="最小化" onClick={this.minimize} style={{fontSize: 12}}><Icon iconName="Remove" /></a>
                    <a className={"btn system"+this.menuOn()} title="最大化" onClick={this.maximize}>
                        {this.state.maximized ? <Icon iconName="ChromeRestore" style={{fontSize: 11}} /> :<Icon iconName="Checkbox" style={{fontSize: 10}} />}
                    </a>
                    <a className={"btn system close"+this.menuOn()} title="关闭" onClick={this.close}><Icon iconName="Cancel" /></a>
                </div>
            </nav>
        )
    }
}

export default Nav