import * as React from "react"
import { useMemo, useCallback, useState, useEffect } from "react"
import intl from "react-intl-universal"
import { Icon } from "@fluentui/react/lib/Icon"
import { Nav, INavLink, INavLinkGroup } from "office-ui-fabric-react/lib/Nav"
import { SourceGroup, ViewType } from "../schema-types"
import { RSSSource } from "../scripts/models/source"
import { ALL, initFeeds } from "../scripts/models/feed"
import { AnimationClassNames, Stack, FocusZone } from "@fluentui/react"
import { useAppSelector, useAppDispatch } from "../scripts/reducer"
import { toggleMenu, openGroupMenu } from "../scripts/models/app"
import { toggleGroupExpansion } from "../scripts/models/group"
import {
    selectAllArticles,
    selectSources,
    toggleSearch,
} from "../scripts/models/page"
import { makeStyles, mergeClasses } from "@fluentui/react-components"
import { FlatButton } from "./utils/FlatButton"
import { FlatButtonGroup } from "./utils/FlatButtonGroup"
import { useIsWideScreen } from "./utils/hooks/useIsWideScreen"
import { useIsBlurred } from "./utils/hooks/useIsBlurred"

const useMenuClasses = makeStyles({
    menuBtn: {
        height: "var(--navHeight)",
        lineHeight: "var(--navHeight)",
    },
    menuBtnBlurred: {
        color: "var(--neutralSecondaryAlt)",
    },
    menuGroupDarwin: {
        display: "flex",
        flexDirection: "row-reverse",
    },
})

export const Menu: React.FC = () => {
    const dispatch = useAppDispatch()
    const menuClasses = useMenuClasses()
    const isWideScreen = useIsWideScreen()
    const isDarwin = globalThis.utils.platform === "darwin"
    const blurred = useIsBlurred()

    const status = useAppSelector(
        s => s.app.sourceInit && !s.app.settings.display
    )
    const display = useAppSelector(s => s.app.menu)
    const selected = useAppSelector(s => s.app.menuKey)
    const sources = useAppSelector(s => s.sources)
    const rawGroups = useAppSelector(s => s.groups)
    const groups = useMemo(
        () => rawGroups.map((g, i) => ({ ...g, index: i })),
        [rawGroups]
    )
    const searchOn = useAppSelector(s => s.page.searchOn)
    const itemOn = useAppSelector(
        s => s.page.itemId !== null && s.page.viewType !== ViewType.List
    )

    const handleToggleMenu = useCallback(() => dispatch(toggleMenu()), [])
    const handleToggleSearch = useCallback(() => dispatch(toggleSearch()), [])
    const handleAllArticles = useCallback((init = false) => {
        dispatch(selectAllArticles(init))
        dispatch(initFeeds())
    }, [])
    const handleSelectSourceGroup = useCallback(
        (group: SourceGroup, menuKey: string) => {
            dispatch(selectSources(group.sids, menuKey, group.name))
            dispatch(initFeeds())
        },
        []
    )
    const handleSelectSource = useCallback((source: RSSSource) => {
        dispatch(selectSources([source.sid], "s-" + source.sid, source.name))
        dispatch(initFeeds())
    }, [])
    const handleGroupContextMenu = useCallback(
        (sids: number[], event: React.MouseEvent) => {
            dispatch(openGroupMenu(sids, event))
        },
        []
    )
    const handleUpdateGroupExpansion = useCallback(
        (event: React.MouseEvent<HTMLElement>, key: string, sel: string) => {
            if ((event.target as HTMLElement).tagName === "I" || key === sel) {
                const [type, index] = key.split("-")
                if (type === "g")
                    dispatch(toggleGroupExpansion(Number.parseInt(index)))
            }
        },
        []
    )

    const countOverflow = (count: number) =>
        count >= 1000 ? " 999+" : ` ${count}`

    const getIconStyle = (url: string) => ({
        style: { width: 16 },
        imageProps: {
            style: { width: "100%" },
            src: url,
        },
    })

    const getSource = (s: RSSSource): INavLink => ({
        name: s.name,
        ariaLabel: s.name + countOverflow(s.unreadCount),
        key: "s-" + s.sid,
        onClick: () => handleSelectSource(s),
        iconProps: s.iconurl ? getIconStyle(s.iconurl) : null,
        url: null,
    })

    const getLinkGroups = (): INavLinkGroup[] => [
        {
            links: [
                {
                    name: intl.get("search"),
                    ariaLabel: intl.get("search") + (searchOn ? " ✓" : " "),
                    key: "search",
                    icon: "Search",
                    onClick: handleToggleSearch,
                    url: null,
                },
                {
                    name: intl.get("allArticles"),
                    ariaLabel:
                        intl.get("allArticles") +
                        countOverflow(
                            Object.values(sources)
                                .filter(s => !s.hidden)
                                .map(s => s.unreadCount)
                                .reduce((a, b) => a + b, 0)
                        ),
                    key: ALL,
                    icon: "TextDocument",
                    onClick: () => handleAllArticles(selected !== ALL),
                    url: null,
                },
            ],
        },
        {
            name: intl.get("menu.subscriptions"),
            links: groups
                .filter(g => g.sids.length > 0)
                .map(g => {
                    if (g.isMultiple) {
                        const groupSources = g.sids.map(sid => sources[sid])
                        return {
                            name: g.name,
                            ariaLabel:
                                g.name +
                                countOverflow(
                                    groupSources
                                        .map(s => s.unreadCount)
                                        .reduce((a, b) => a + b, 0)
                                ),
                            key: "g-" + g.index,
                            url: null,
                            isExpanded: g.expanded,
                            onClick: () =>
                                handleSelectSourceGroup(g, "g-" + g.index),
                            links: groupSources.map(getSource),
                        }
                    } else {
                        return getSource(sources[g.sids[0]])
                    }
                }),
        },
    ]

    const onContext = (item: INavLink, event: React.MouseEvent) => {
        const [type, index] = item.key.split("-")
        let sids: number[]
        if (type === "s") {
            sids = [Number.parseInt(index)]
        } else if (type === "g") {
            sids = groups[Number.parseInt(index)].sids
        } else {
            return
        }
        handleGroupContextMenu(sids, event)
    }

    const onRenderLink = (link: INavLink): JSX.Element => {
        const count = link.ariaLabel.split(" ").pop()
        return (
            <Stack
                className="link-stack"
                horizontal
                grow
                onContextMenu={event => onContext(link, event)}>
                <div className="link-text">{link.name}</div>
                {count && count !== "0" && (
                    <div className="unread-count">{count}</div>
                )}
            </Stack>
        )
    }

    const onRenderGroupHeader = (group: INavLinkGroup): JSX.Element => {
        return (
            <p className={"subs-header " + AnimationClassNames.slideDownIn10}>
                {group.name}
            </p>
        )
    }

    return (
        status && (
            <div
                className={"menu-container" + (display ? " show" : "")}
                onClick={handleToggleMenu}>
                <div
                    className={"menu" + (itemOn ? " item-on" : "")}
                    onClick={e => e.stopPropagation()}>
                    <FlatButtonGroup
                        styleClass={
                            isDarwin ? menuClasses.menuGroupDarwin : undefined
                        }>
                        <FlatButton
                            styleClass={mergeClasses(
                                menuClasses.menuBtn,
                                blurred ? menuClasses.menuBtnBlurred : undefined
                            )}
                            title={intl.get("menu.close")}
                            ariaLabel={intl.get("menu.close")}
                            onClick={handleToggleMenu}>
                            {isWideScreen ? (
                                <Icon
                                    iconName={
                                        isDarwin
                                            ? "SidePanel"
                                            : "GlobalNavButton"
                                    }
                                />
                            ) : (
                                <Icon iconName="Back" />
                            )}
                        </FlatButton>
                    </FlatButtonGroup>
                    <FocusZone
                        as="div"
                        disabled={!display}
                        className="nav-wrapper">
                        <Nav
                            onRenderGroupHeader={onRenderGroupHeader}
                            onRenderLink={onRenderLink}
                            groups={getLinkGroups()}
                            selectedKey={selected}
                            onLinkExpandClick={(event, item) =>
                                handleUpdateGroupExpansion(
                                    event,
                                    item.key,
                                    selected
                                )
                            }
                        />
                    </FocusZone>
                </div>
            </div>
        )
    )
}
