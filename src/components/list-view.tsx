import * as React from "react"
import { CSSProperties, useLayoutEffect, useRef, useState } from "react"
import { makeStyles, mergeClasses } from "@griffel/react"
import { useTheme } from "@fluentui/react"
import {
    LIST_ARTICLE_MIN_WIDTH,
    LIST_VIEW_MIN_WIDTH,
    ViewType,
} from "../schema-types"
import Article from "./article"
import { Feed } from "./feeds/feed"
import ArticleSearch from "./utils/article-search"
import { ResizeHandle } from "./utils/ResizeHandle"
import { useResizableWidth } from "./utils/hooks/useResizableWidth"

const useStyles = makeStyles({
    root: {
        display: "flex",
        height: "100%",
        position: "relative",
        // Keep the resize handle and drag shield below the navigation menu.
        isolation: "isolate",
        marginTop: "calc(-1 * var(--navHeight))",
        marginLeft: 0,
        transition: "margin-left var(--transition-timing) 0.367s",
        overflow: "hidden",
        backgroundColor: "var(--colorNeutralBackground1)",
    },
    menuOpen: {
        "@media (min-width: 1440px)": {
            marginLeft: "280px",
        },
    },
    listPane: {
        "width": "var(--list-view-width)",
        "minWidth": `${LIST_VIEW_MIN_WIDTH}px`,
        "flexShrink": 0,
        "backgroundColor": "var(--neutralLighterAlt)",
        "height": "100%",
        "position": "relative",
        "display": "flex",
        "flexDirection": "column",
        "paddingTop": "var(--navHeight)",
        "boxSizing": "border-box",
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
    articlePane: {
        flexGrow: 1,
        flexBasis: 0,
        minWidth: `${LIST_ARTICLE_MIN_WIDTH}px`,
        paddingTop: "var(--navHeight)",
        height: "100%",
        boxSizing: "border-box",
        backgroundColor: "var(--colorNeutralBackground1)",
        position: "relative",
    },
    paneHeader: {
        "::before": {
            content: '""',
            display: "block",
            width: "100%",
            borderBottom: "1px solid var(--neutralQuaternaryAlt)",
            position: "absolute",
            top: "calc(var(--navHeight) - 1px)",
        },
    },
    feed: {
        "flexGrow": 1,
        "flexBasis": 0,
        "minHeight": 0,
        "& .list-feed": {
            marginTop: 0,
            height: "100%",
        },
    },
    resizeHandle: {
        top: "var(--navHeight)",
        right: "-4px",
    },
    logoPane: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        display: "block",
        width: "120px",
        height: "120px",
        userSelect: "none",
    },
})

export function ListView({
    feedId,
    itemId,
    menuOn,
}: Readonly<{
    feedId: string
    itemId: number
    menuOn: boolean
}>) {
    const classes = useStyles()
    const theme = useTheme()
    const container = useRef<HTMLDivElement>(null)
    const [availableWidth, setAvailableWidth] = useState(0)
    const { requestedWidth, handleProps } = useResizableWidth({
        getWidth: window.settings.getListViewWidth,
        saveWidth: window.settings.setListViewWidth,
        minWidth: LIST_VIEW_MIN_WIDTH,
        maxWidth: availableWidth - LIST_ARTICLE_MIN_WIDTH,
    })

    useLayoutEffect(() => {
        const node = container.current
        setAvailableWidth(node.clientWidth)
        const observer = new ResizeObserver(() =>
            setAvailableWidth(node.clientWidth)
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={container}
            className={mergeClasses(
                "list-main",
                classes.root,
                menuOn && "menu-on",
                menuOn && classes.menuOpen
            )}
            style={
                {
                    "--list-view-width": `min(${requestedWidth}px, calc(100% - ${LIST_ARTICLE_MIN_WIDTH}px))`,
                } as CSSProperties
            }>
            <div
                className={mergeClasses(
                    "list-feed-container",
                    classes.listPane,
                    classes.paneHeader
                )}>
                <ArticleSearch inline />
                <div className={classes.feed}>
                    <Feed
                        viewType={ViewType.List}
                        feedId={feedId}
                        key={feedId}
                    />
                </div>
                <ResizeHandle
                    label="Resize article list"
                    {...handleProps}
                    styleClass={classes.resizeHandle}
                />
            </div>
            {itemId ? (
                <div
                    className={mergeClasses(
                        "side-article-wrapper",
                        classes.articlePane,
                        classes.paneHeader
                    )}>
                    <Article itemId={itemId} side />
                </div>
            ) : (
                <div
                    className={mergeClasses(
                        "side-logo-wrapper",
                        classes.articlePane,
                        classes.logoPane
                    )}>
                    <img
                        className={classes.logo}
                        src={
                            theme.isInverted
                                ? "icons/logo-outline-dark.svg"
                                : "icons/logo-outline.svg"
                        }
                        alt="Fluent Reader logo"
                        draggable={false}
                    />
                </div>
            )}
        </div>
    )
}
