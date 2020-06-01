import * as React from "react"
import { Icon } from "@fluentui/react/lib/Icon"
import { Nav, INavLink, INavStyles, INavLinkGroup } from "office-ui-fabric-react/lib/Nav"
import { MenuStatus } from "../scripts/models/app"
import { SourceGroup } from "../scripts/models/page"
import { SourceState, RSSSource } from "../scripts/models/source"
import { MenuReduxProps } from "../containers/menu-container"
import { ALL } from "../scripts/models/feed"

export type MenuProps = MenuReduxProps & {
    status: MenuStatus,
    selected: string,
    sources: SourceState,
    groups: SourceGroup[],
    closeMenu: () => void,
    allArticles: () => void,
    selectSourceGroup: (group: SourceGroup, menuKey: string) => void,
    selectSource: (source: RSSSource) => void
}

export class Menu extends React.Component<MenuProps> {
    getItems = (): INavLinkGroup[] => [
        {
            links: [
                {
                    name: "主页",
                    key: "home",
                    icon: "Home",
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

    _onRenderGroupHeader(group: INavLinkGroup): JSX.Element {
        return <p className="subs-header">{group.name}</p>;
    }

    render() {
        return this.props.status == MenuStatus.Hidden ? null : (
            <div className="menu-container" onClick={this.props.closeMenu}>
                <div className="menu" onClick={(e) => e.stopPropagation()}>
                    <div className="btn-group">
                        <a className="btn" title="关闭菜单" onClick={this.props.closeMenu}><Icon iconName="Back" /></a>
                    </div>
                    <div className="nav-wrapper">
                        <Nav 
                            groups={this.getItems()} 
                            selectedKey={this.props.selected}
                            onRenderGroupHeader={this._onRenderGroupHeader} />
                        <p className="subs-header">订阅源</p>
                        <Nav 
                            selectedKey={this.props.selected}
                            groups={this.getGroups()} />
                    </div>
                </div>
            </div>
        )
    }
}