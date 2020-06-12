import * as React from "react"
import intl = require("react-intl-universal")
import { Icon } from "@fluentui/react/lib/Icon"
import { Nav, INavLink, INavLinkGroup } from "office-ui-fabric-react/lib/Nav"
import { SourceGroup } from "../scripts/models/group"
import { SourceState, RSSSource } from "../scripts/models/source"
import { ALL } from "../scripts/models/feed"
import { AnimationClassNames, Stack } from "@fluentui/react"

export type MenuProps = {
    status: boolean,
    display: boolean,
    selected: string,
    sources: SourceState,
    groups: SourceGroup[],
    toggleMenu: () => void,
    allArticles: () => void,
    selectSourceGroup: (group: SourceGroup, menuKey: string) => void,
    selectSource: (source: RSSSource) => void
}

export class Menu extends React.Component<MenuProps> {
    countOverflow = (count: number) => count >= 1000 ? "999+" : String(count)

    getItems = (): INavLinkGroup[] => [
        {
            links: [
                {
                    name: intl.get("search"),
                    key: "search",
                    icon: "Search",
                    url: null
                },
                {
                    name: intl.get("allArticles"),
                    ariaLabel: this.countOverflow(Object.values(this.props.sources).map(s => s.unreadCount).reduce((a, b) => a + b, 0)),
                    key: ALL,
                    icon: "TextDocument",
                    onClick: this.props.allArticles,
                    url: null
                }
            ]
        }
    ]

    getGroups = (): INavLinkGroup[] => [{
        links: this.props.groups.filter(g => g.sids.length > 0).map((g, i) => {
            if (g.isMultiple) {
                let sources = g.sids.map(sid => this.props.sources[sid])
                return {
                    name: g.name,
                    ariaLabel: this.countOverflow(sources.map(s => s.unreadCount).reduce((a, b) => a + b, 0)),
                    key: "g-" + i,
                    url: null,
                    isExpanded: true,
                    onClick: () => this.props.selectSourceGroup(g, "g-" + i),
                    links: sources.map(this.getSource)
                }
            } else {
                return this.getSource(this.props.sources[g.sids[0]])
            }
        }
    )}]

    getSource = (s: RSSSource): INavLink => ({
        name: s.name,
        ariaLabel: this.countOverflow(s.unreadCount),
        key: "s-" + s.sid,
        onClick: () => this.props.selectSource(s),
        iconProps: s.iconurl ? this.getIconStyle(s.iconurl) : null,
        url: null    
    })
         

    getIconStyle = (url: string) => ({
        style: { width: 16 },
        imageProps: {
            style: { width:"100%" },
            src: url
        }
    })

    _onRenderLink = (link: INavLink): JSX.Element => {
        return (
            <Stack className="link-stack" horizontal grow>
                <div className="link-text">{link.name}</div>
                {link.ariaLabel !== "0" && <div className="unread-count">{link.ariaLabel}</div>}
            </Stack>
        )
        return ;
      };

    render() {
        return this.props.status && (
            <div className="menu-container" onClick={this.props.toggleMenu} style={{display: this.props.display ? "block" : "none"}}>
                <div className="menu" onClick={(e) => e.stopPropagation()}>
                    <div className="btn-group">
                        <a className="btn hide-wide" title={intl.get("menu.close")} onClick={this.props.toggleMenu}><Icon iconName="Back" /></a>
                        <a className="btn inline-block-wide" title={intl.get("menu.close")} onClick={this.props.toggleMenu}><Icon iconName="GlobalNavButton" /></a>
                    </div>
                    <div className="nav-wrapper">
                        <Nav 
                            onRenderLink={this._onRenderLink}
                            groups={this.getItems()} 
                            selectedKey={this.props.selected} />
                        <p className={"subs-header " + AnimationClassNames.slideDownIn10}>{intl.get("menu.subscriptions")}</p>
                        <Nav 
                            selectedKey={this.props.selected}
                            onRenderLink={this._onRenderLink}
                            groups={this.getGroups()} />
                    </div>
                </div>
            </div>
        )
    }
}