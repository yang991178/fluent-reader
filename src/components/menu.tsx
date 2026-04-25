import * as React from "react"
import { useMemo, useCallback, useEffect, useRef } from "react"
import intl from "react-intl-universal"
import { SourceGroup, ViewType } from "../schema-types"
import { RSSSource } from "../scripts/models/source"
import { ALL, initFeeds } from "../scripts/models/feed"
import { useAppSelector, useAppDispatch } from "../scripts/reducer"
import { toggleMenu, openGroupMenu } from "../scripts/models/app"
import { toggleGroupExpansion } from "../scripts/models/group"
import {
    selectAllArticles,
    selectSources,
    toggleSearch,
} from "../scripts/models/page"
import {
    makeStyles,
    mergeClasses,
    tokens,
    Tree,
    TreeItem,
    TreeItemLayout,
    TreeOpenChangeData,
    useSubtreeContext_unstable,
} from "@fluentui/react-components"
import { useFocusFinders } from "@fluentui/react-tabster"
import {
    Checkmark16Regular,
    DocumentOnePageMultiple16Regular,
    Search16Regular,
} from "@fluentui/react-icons"
import { FlatButton } from "./utils/FlatButton"
import { FlatButtonGroup } from "./utils/FlatButtonGroup"
import { useIsWideScreen } from "./utils/hooks/useIsWideScreen"
import { useIsBlurred } from "./utils/hooks/useIsBlurred"
import { Icon } from "@fluentui/react"

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
    menuContainer: {
        "position": "fixed",
        "zIndex": 5,
        "left": 0,
        "top": 0,
        "width": "100%",
        "height": "100%",
        "pointerEvents": "none",
        "@media (min-width: 1440px)": {
            width: "280px !important",
            background: "none",
            backdropFilter: "none",
        },
    },
    menuContainerShow: {
        pointerEvents: "unset",
    },
    menuInner: {
        "position": "absolute",
        "left": 0,
        "top": 0,
        "width": "280px",
        "height": "100%",
        "backgroundColor": "var(--neutralLighterAltOpacity)",
        "backdropFilter": "var(--blur)",
        "boxShadow": "5px 0 25px #0004",
        "transition":
            "clip-path var(--transition-timing) 0.367s, opacity cubic-bezier(0, 0, 0.2, 1) 0.367s",
        "clipPath": "inset(0 100% 0 0)",
        "opacity": 0,
        "@media (min-width: 1440px)": {
            "backgroundColor": "var(--neutralLight)",
            "boxShadow": "none",
            "::after": {
                content: '""',
                display: "block",
                pointerEvents: "none",
                position: "absolute",
                top: "-10%",
                right: 0,
                width: "120%",
                height: "120%",
                boxShadow: "inset 5px 0 25px #0004",
            },
        },
    },
    menuInnerShow: {
        "clipPath": "inset(0 -50px 0 0)",
        "opacity": 1,
        "@media (min-width: 1440px)": {
            clipPath: "inset(0)",
        },
    },
    menuInnerDarwin: {
        "@media (min-width: 1440px)": {
            background: "none",
        },
    },
    menuInnerItemOnDarwin: {
        "@media (min-width: 1440px)": {
            backgroundColor: "var(--neutralLight)",
        },
    },
    navWrapper: {
        maxHeight: "calc(100% - var(--navHeight))",
        overflowX: "hidden",
        overflowY: "auto",
    },
    tree: {
        paddingTop: 0,
        paddingBottom: 0,
    },
    subsHeader: {
        fontSize: "12px",
        color: tokens.colorNeutralForeground4,
        marginTop: "16px",
        marginBottom: "4px",
        marginLeft: "8px",
        marginRight: "8px",
        userSelect: "none",
    },
    favicon: {
        width: "16px",
        height: "16px",
        verticalAlign: "middle",
        userSelect: "none",
    },
    primaryIcon: {
        color: tokens.colorCompoundBrandForeground1,
    },
})

export const Menu: React.FC = () => {
    const dispatch = useAppDispatch()
    const menuClasses = useMenuClasses()
    const { findFirstFocusable } = useFocusFinders()
    const isWideScreen = useIsWideScreen()
    const isDarwin = globalThis.utils.platform === "darwin"
    const isBlurred = useIsBlurred()

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

    const openItems = useMemo(
        () =>
            new Set(
                groups
                    .filter(g => g.isMultiple && g.expanded)
                    .map(g => "g-" + g.index)
            ),
        [groups]
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

    const handleOpenChange = useCallback(
        (_event: any, data: TreeOpenChangeData) => {
            if (
                data.type === "ExpandIconClick" ||
                data.type === "ArrowRight" ||
                data.type === "ArrowLeft"
            ) {
                const value = String(data.value)
                if (value.startsWith("g-")) {
                    const index = Number.parseInt(value.split("-")[1])
                    dispatch(toggleGroupExpansion(index))
                }
            }
        },
        []
    )

    const totalUnread = useMemo(
        () =>
            Object.values(sources)
                .filter(s => !s.hidden)
                .map(s => s.unreadCount)
                .reduce((a, b) => a + b, 0),
        [sources]
    )

    const treeRef = useRef<HTMLDivElement>(null)
    const previousDisplayRef = useRef(display)
    useEffect(() => {
        if (display && !previousDisplayRef.current) {
            findFirstFocusable(treeRef.current)?.focus()
        }
        previousDisplayRef.current = display
    }, [display])

    const renderSourceItem = (s: RSSSource) => {
        const key = "s-" + s.sid
        return (
            <MenuTreeItem
                key={key}
                value={key}
                label={s.name}
                isSelected={selected === key}
                icon={
                    s.iconurl ? (
                        <img
                            alt=""
                            className={menuClasses.favicon}
                            src={s.iconurl}
                        />
                    ) : undefined
                }
                unreadCount={s.unreadCount}
                onClick={() => handleSelectSource(s)}
                onContextMenu={e => {
                    handleGroupContextMenu([s.sid], e)
                }}
            />
        )
    }

    return (
        status && (
            <div
                className={mergeClasses(
                    menuClasses.menuContainer,
                    display && menuClasses.menuContainerShow
                )}
                onClick={handleToggleMenu}>
                <div
                    className={mergeClasses(
                        menuClasses.menuInner,
                        display && menuClasses.menuInnerShow,
                        isDarwin && menuClasses.menuInnerDarwin,
                        isDarwin && itemOn && menuClasses.menuInnerItemOnDarwin
                    )}
                    onClick={e => e.stopPropagation()}>
                    <FlatButtonGroup
                        styleClass={
                            isDarwin ? menuClasses.menuGroupDarwin : undefined
                        }>
                        <FlatButton
                            styleClass={mergeClasses(
                                menuClasses.menuBtn,
                                isBlurred
                                    ? menuClasses.menuBtnBlurred
                                    : undefined
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
                    <div className={menuClasses.navWrapper}>
                        <Tree
                            ref={treeRef}
                            className={menuClasses.tree}
                            size="small"
                            appearance="subtle-alpha"
                            openItems={openItems}
                            onOpenChange={handleOpenChange}>
                            <MenuTreeItem
                                value="search"
                                label={intl.get("search")}
                                icon={
                                    <Search16Regular
                                        className={menuClasses.primaryIcon}
                                    />
                                }
                                aside={
                                    searchOn ? (
                                        <Checkmark16Regular
                                            className={menuClasses.primaryIcon}
                                        />
                                    ) : undefined
                                }
                                onClick={handleToggleSearch}
                            />
                            <MenuTreeItem
                                value={ALL}
                                label={intl.get("allArticles")}
                                isSelected={selected === ALL}
                                icon={
                                    <DocumentOnePageMultiple16Regular
                                        className={menuClasses.primaryIcon}
                                    />
                                }
                                unreadCount={totalUnread}
                                onClick={() =>
                                    handleAllArticles(selected !== ALL)
                                }
                            />
                            {groups.length > 0 && (
                                <p className={menuClasses.subsHeader}>
                                    {intl.get("menu.subscriptions")}
                                </p>
                            )}
                            {groups
                                .filter(g => g.sids.length > 0)
                                .map(g => {
                                    if (g.isMultiple) {
                                        const groupSources = g.sids.map(
                                            sid => sources[sid]
                                        )
                                        const groupKey = "g-" + g.index
                                        const isGroupSelected =
                                            selected === groupKey
                                        const groupUnread = groupSources
                                            .map(s => s.unreadCount)
                                            .reduce((a, b) => a + b, 0)
                                        return (
                                            <MenuTreeItem
                                                key={groupKey}
                                                value={groupKey}
                                                itemType="branch"
                                                label={g.name}
                                                isSelected={isGroupSelected}
                                                unreadCount={groupUnread}
                                                onClick={() =>
                                                    handleSelectSourceGroup(
                                                        g,
                                                        groupKey
                                                    )
                                                }
                                                onContextMenu={e =>
                                                    handleGroupContextMenu(
                                                        g.sids,
                                                        e
                                                    )
                                                }>
                                                <Tree>
                                                    {groupSources.map(
                                                        renderSourceItem
                                                    )}
                                                </Tree>
                                            </MenuTreeItem>
                                        )
                                    } else {
                                        return renderSourceItem(
                                            sources[g.sids[0]]
                                        )
                                    }
                                })}
                        </Tree>
                    </div>
                </div>
            </div>
        )
    )
}

const useTreeItemClasses = makeStyles({
    treeItem: {
        minHeight: "32px",
    },
    treeLeafItem: {
        paddingLeft: "12px",
    },
    treeLeafSubItem: {
        paddingLeft: "24px",
    },
    selectedItem: {
        "::after": {
            content: '""',
            position: "absolute",
            left: 0,
            top: "4px",
            width: "4px",
            height: "24px",
            borderRadius: tokens.borderRadiusCircular,
            backgroundColor: tokens.colorCompoundBrandForeground1,
        },
    },
    selectedItemText: {
        color: tokens.colorNeutralForeground1,
        fontWeight: tokens.fontWeightSemibold,
    },
    unreadCount: {
        color: tokens.colorNeutralForeground3,
        marginLeft: "auto",
        paddingLeft: "4px",
        flexShrink: 0,
    },
})

interface MenuTreeItemProps {
    value: string
    itemType?: "leaf" | "branch"
    label: string
    isSelected?: boolean
    icon?: React.ReactElement
    unreadCount?: number
    aside?: React.ReactElement
    onClick: () => void
    onContextMenu?: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

const MenuTreeItem: React.FC<MenuTreeItemProps> = ({
    value,
    itemType = "leaf",
    label,
    isSelected = false,
    icon,
    unreadCount,
    aside,
    onClick,
    onContextMenu,
    children,
}) => {
    const c = useTreeItemClasses()
    const { level } = useSubtreeContext_unstable()
    let resolvedAside: React.ReactElement | undefined = aside
    if (resolvedAside === undefined && unreadCount && unreadCount > 0) {
        resolvedAside = (
            <span className={c.unreadCount}>
                {unreadCount >= 1000 ? "999+" : String(unreadCount)}
            </span>
        )
    }
    const handleContextMenu = onContextMenu
        ? (e: React.MouseEvent) => {
              e.stopPropagation()
              onContextMenu(e)
          }
        : undefined
    return (
        <TreeItem
            value={value}
            itemType={itemType}
            onClick={onClick}
            onContextMenu={handleContextMenu}>
            <TreeItemLayout
                aria-label={`${isSelected ? "Selected: " : ""}${label}`}
                className={mergeClasses(
                    c.treeItem,
                    itemType === "leaf" && c.treeLeafItem,
                    level > 1 && c.treeLeafSubItem,
                    isSelected && c.selectedItem
                )}
                iconBefore={icon}
                aside={resolvedAside}>
                <span className={isSelected ? c.selectedItemText : undefined}>
                    {label}
                </span>
            </TreeItemLayout>
            {children}
        </TreeItem>
    )
}
