import * as React from "react"
import intl from "react-intl-universal"
import { Icon } from "@fluentui/react/lib/Icon"
import { Nav, INavLink, INavLinkGroup } from "office-ui-fabric-react/lib/Nav"
import { SourceGroup } from "../schema-types"
import { SourceState, RSSSource } from "../scripts/models/source"
import { ALL } from "../scripts/models/feed"
import { AnimationClassNames, Stack, FocusZone, Dropdown, IDropdownOption } from "@fluentui/react"
import { SortOption } from "../scripts/models/group"

export type MenuProps = {
    status: boolean
    display: boolean
    selected: string
    sources: SourceState
    groups: SourceGroup[]
    searchOn: boolean
    itemOn: boolean
    toggleMenu: () => void
    allArticles: (init?: boolean) => void
    selectSourceGroup: (group: SourceGroup, menuKey: string) => void
    selectSource: (source: RSSSource) => void
    groupContextMenu: (sids: number[], event: React.MouseEvent) => void
    updateGroupExpansion: (
        event: React.MouseEvent<HTMLElement>,
        key: string,
        selected: string
    ) => void
    toggleSearch: () => void
    sortGroups: (sortOption: SortOption) => void
}

type MenuState = {
    sortOption: SortOption
}

export class Menu extends React.Component<MenuProps, MenuState> {
    constructor(props: MenuProps) {
        super(props)
        this.state = {
            sortOption: SortOption.Default
        }
    }

    countOverflow = (count: number) => (count >= 1000 ? " 999+" : ` ${count}`)

    sortOptions = (): IDropdownOption[] => [
        { key: SortOption.Default, text: intl.get("menu.sortDefault") || "기본 순서" },
        { key: SortOption.Alphabetical, text: intl.get("menu.sortAlphabetical") || "이름순 (A→Z)" },
        { key: SortOption.UnreadCountDesc, text: intl.get("menu.sortUnreadDesc") || "미읽음 많은 순" },
        { key: SortOption.UnreadCountAsc, text: intl.get("menu.sortUnreadAsc") || "미읽음 적은 순" },
    ]

    onSortChange = (_, option: IDropdownOption) => {
        const sortOption = option.key as SortOption
        this.setState({ sortOption })
        this.props.sortGroups(sortOption)
    }

    getLinkGroups = (): INavLinkGroup[] => [
        {
            links: [
                {
                    name: intl.get("search"),
                    ariaLabel:
                        intl.get("search") + (this.props.searchOn ? " ✓" : " "),
                    key: "search",
                    icon: "Search",
                    onClick: this.props.toggleSearch,
                    url: null,
                },
                {
                    name: intl.get("allArticles"),
                    ariaLabel:
                        intl.get("allArticles") +
                        this.countOverflow(
                            Object.values(this.props.sources)
                                .filter(s => !s.hidden)
                                .map(s => s.unreadCount)
                                .reduce((a, b) => a + b, 0)
                        ),
                    key: ALL,
                    icon: "TextDocument",
                    onClick: () =>
                        this.props.allArticles(this.props.selected !== ALL),
                    url: null,
                },
            ],
        },
        {
            name: intl.get("menu.subscriptions"),
            links: this.props.groups
                .filter(g => g.sids.length > 0)
                .map(g => {
                    if (g.isMultiple) {
                        let sources = g.sids.map(sid => this.props.sources[sid])
                        return {
                            name: g.name,
                            ariaLabel:
                                g.name +
                                this.countOverflow(
                                    sources
                                        .map(s => s.unreadCount)
                                        .reduce((a, b) => a + b, 0)
                                ),
                            key: "g-" + g.index,
                            url: null,
                            isExpanded: g.expanded,
                            onClick: () =>
                                this.props.selectSourceGroup(g, "g-" + g.index),
                            links: sources.map(this.getSource),
                        }
                    } else {
                        return this.getSource(this.props.sources[g.sids[0]])
                    }
                }),
        },
    ]

    getSource = (s: RSSSource): INavLink => ({
        name: s.name,
        ariaLabel: s.name + this.countOverflow(s.unreadCount),
        key: "s-" + s.sid,
        onClick: () => this.props.selectSource(s),
        iconProps: s.iconurl ? this.getIconStyle(s.iconurl) : null,
        url: null,
    })

    getIconStyle = (url: string) => ({
        style: { width: 16 },
        imageProps: {
            style: { width: "100%" },
            src: url,
        },
    })

    onContext = (item: INavLink, event: React.MouseEvent) => {
        let sids: number[]
        let [type, index] = item.key.split("-")
        if (type === "s") {
            sids = [parseInt(index)]
        } else if (type === "g") {
            sids = this.props.groups[parseInt(index)].sids
        } else {
            return
        }
        this.props.groupContextMenu(sids, event)
    }

    _onRenderLink = (link: INavLink): JSX.Element => {
        let count = link.ariaLabel.split(" ").pop()
        return (
            <Stack
                className="link-stack"
                horizontal
                grow
                onContextMenu={event => this.onContext(link, event)}>
                <div className="link-text">{link.name}</div>
                {count && count !== "0" && (
                    <div className="unread-count">{count}</div>
                )}
            </Stack>
        )
    }

    _onRenderGroupHeader = (group: INavLinkGroup): JSX.Element => {
        return (
            <p className={"subs-header " + AnimationClassNames.slideDownIn10}>
                {group.name}
            </p>
        )
    }

    render() {
        return (
            this.props.status && (
                <div
                    className={
                        "menu-container" + (this.props.display ? " show" : "")
                    }
                    onClick={this.props.toggleMenu}>
                    <div
                        className={
                            "menu" + (this.props.itemOn ? " item-on" : "")
                        }
                        onClick={e => e.stopPropagation()}>
                        <div className="btn-group">
                            <a
                                className="btn hide-wide"
                                title={intl.get("menu.close")}
                                onClick={this.props.toggleMenu}>
                                <Icon iconName="Back" />
                            </a>
                            <a
                                className="btn inline-block-wide"
                                title={intl.get("menu.close")}
                                onClick={this.props.toggleMenu}>
                                <Icon
                                    iconName={
                                        window.utils.platform === "darwin"
                                            ? "SidePanel"
                                            : "GlobalNavButton"
                                    }
                                />
                            </a>
                            <div style={{ flex: 1 }}></div>
                            <Dropdown
                                placeholder={intl.get("menu.sort") || "정렬"}
                                selectedKey={this.state.sortOption}
                                options={this.sortOptions()}
                                onChange={this.onSortChange}
                                styles={{
                                    dropdown: { 
                                        width: 140,
                                        border: 'none',
                                        fontSize: 13,
                                    },
                                    title: {
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        fontSize: 13,
                                    },
                                    caretDownWrapper: {
                                        fontSize: 10,
                                    }
                                }}
                            />
                        </div>
                        <FocusZone
                            as="div"
                            disabled={!this.props.display}
                            className="nav-wrapper">
                            <Nav
                                onRenderGroupHeader={this._onRenderGroupHeader}
                                onRenderLink={this._onRenderLink}
                                groups={this.getLinkGroups()}
                                selectedKey={this.props.selected}
                                onLinkExpandClick={(event, item) =>
                                    this.props.updateGroupExpansion(
                                        event,
                                        item.key,
                                        this.props.selected
                                    )
                                }
                            />
                        </FocusZone>
                    </div>
                </div>
            )
        )
    }
}
