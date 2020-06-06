import * as React from "react"
import { Icon } from "@fluentui/react/lib/Icon"
import { Nav, INavLink, INavLinkGroup } from "office-ui-fabric-react/lib/Nav"
import { SourceGroup } from "../scripts/models/group"
import { SourceState, RSSSource } from "../scripts/models/source"
import { ALL } from "../scripts/models/feed"
import { AnimationClassNames } from "@fluentui/react"

export type MenuProps = {
    status: boolean,
    selected: string,
    sources: SourceState,
    groups: SourceGroup[],
    toggleMenu: () => void,
    allArticles: () => void,
    selectSourceGroup: (group: SourceGroup, menuKey: string) => void,
    selectSource: (source: RSSSource) => void
}

export class Menu extends React.Component<MenuProps> {
    getItems = (): INavLinkGroup[] => [
        {
            links: [
                {
                    name: "搜索",
                    key: "search",
                    icon: "Search",
                    url: null
                },
                {
                    name: "全部文章",
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
                return {
                    name: g.name,
                    key: "g-" + i,
                    url: null,
                    isExpanded: true,
                    onClick: () => this.props.selectSourceGroup(g, "g-" + i),
                    links: g.sids.map(sid => this.props.sources[sid]).map(this.getSource)
                }
            } else {
                return this.getSource(this.props.sources[g.sids[0]])
            }
        }
    )}]

    getSource = (s: RSSSource): INavLink => ({
        name: s.name,
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

    render() {
        return this.props.status ? (
            <div className="menu-container" onClick={this.props.toggleMenu}>
                <div className="menu" onClick={(e) => e.stopPropagation()}>
                    <div className="btn-group">
                        <a className="btn hide-wide" title="关闭菜单" onClick={this.props.toggleMenu}><Icon iconName="Back" /></a>
                        <a className="btn inline-block-wide" title="关闭菜单" onClick={this.props.toggleMenu}><Icon iconName="GlobalNavButton" /></a>
                    </div>
                    <div className="nav-wrapper">
                        <Nav 
                            groups={this.getItems()} 
                            selectedKey={this.props.selected} />
                        <p className={"subs-header " + AnimationClassNames.slideDownIn10}>订阅源</p>
                        <Nav 
                            selectedKey={this.props.selected}
                            groups={this.getGroups()} />
                    </div>
                </div>
            </div>
        ) : null
    }
}