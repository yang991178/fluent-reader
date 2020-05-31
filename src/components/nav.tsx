import * as React from "react"
import { ipcRenderer } from "electron"
import { Icon } from "@fluentui/react/lib/Icon"
import { AppState, MenuStatus } from "../scripts/models/app"
import { NavReduxProps } from "../containers/nav-container"

type NavProps = NavReduxProps & {
    state: AppState,
    fetch: () => void,
    menu: () => void,
    logs: () => void,
    settings: () => void
}

class Nav extends React.Component<NavProps> {
    ipcSend(message:string) {
        ipcRenderer.send(message)
    }

    canFetch = () => this.props.state.sourceInit && this.props.state.feedInit && !this.props.state.fetchingItems
    fetching = () => !this.canFetch() ? " fetching" : ""
    menuOn = () => this.props.state.menu == MenuStatus.Open ? " on" : ""

    fetch = () => {
        if (this.canFetch()) this.props.fetch()
    }

    render() {
        return (
            <nav>
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
                    <a className={"btn system"+this.menuOn()} title="最小化" onClick={() => this.ipcSend("minimize")} style={{fontSize: 12}}><Icon iconName="Remove" /></a>
                    <a className={"btn system"+this.menuOn()} title="最大化" onClick={() => this.ipcSend("maximize")} style={{fontSize: 10}}><Icon iconName="Checkbox" /></a>
                    <a className={"btn system close"+this.menuOn()} title="关闭" onClick={() => this.ipcSend("close")}><Icon iconName="Cancel" /></a>
                </div>
            </nav>
        )
    }
}

export default Nav