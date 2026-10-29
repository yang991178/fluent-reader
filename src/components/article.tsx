import * as React from "react"
import intl from "react-intl-universal"
import { renderToString } from "react-dom/server"
import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import {
    markRead,
    markUnread,
    toggleStarred,
    toggleHidden,
    itemShortcuts,
} from "../scripts/models/item"
import {
    Stack,
    CommandBarButton,
    IContextualMenuProps,
    FocusZone,
    ContextualMenuItemType,
    Icon,
    Link,
} from "@fluentui/react"
import {
    RSSSource,
    updateSource,
    SourceTextDirection,
} from "../scripts/models/source"
import { shareSubmenu } from "./context-menu"
import { platformCtrl } from "../scripts/utils"
import { Spinner } from "@fluentui/react-components"
import { useAppDispatch, useAppSelector } from "../scripts/reducer"
import { dismissItem, showOffsetItem } from "../scripts/models/page"
import {
    openTextMenu,
    openImageMenu,
    closeContextMenu,
} from "../scripts/models/app"
import { useArticleView } from "./utils/hooks/useArticleView"
import { makeStyles, mergeClasses, shorthands } from "@griffel/react"

const useStyles = makeStyles({
    root: {
        "height": "100%",
        "minWidth": 0,
        "userSelect": "none",
        "& i.ms-Icon": { color: "var(--neutralDarker)" },
    },
    side: {
        display: "flex",
        flexDirection: "column-reverse",
    },
    toolbar: {
        height: "36px",
        flexShrink: 0,
    },
    sideToolbar: {
        borderTop: "1px solid var(--neutralQuaternaryAlt)",
    },
    spacer: { width: "96px" },
    closeGroup: { width: "112px" },
    actions: {
        minWidth: 0,
        color: "var(--black)",
        borderBottom: "1px solid var(--neutralQuaternaryAlt)",
    },
    sideActions: { borderBottomStyle: "none" },
    source: {
        minWidth: 0,
        flexBasis: 0,
    },
    sourceName: {
        lineHeight: "35px",
        userSelect: "none",
        maxWidth: "320px",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "inline-block",
    },
    sourceIcon: {
        "verticalAlign": "middle",
        "margin": "8px 8px 11px 0",
        "&.fui-Spinner": { display: "inline-flex" },
    },
    creator: {
        "color": "var(--neutralSecondaryAlt)",
        "userSelect": "text",
        "::before": {
            display: "inline-block",
            content: '"/"',
            margin: "0 6px",
        },
    },
    content: {
        width: "100%",
        height: "calc(100% - 36px)",
        ...shorthands.borderStyle("none"),
        color: "var(--black)",
    },
    hidden: { display: "none" },
    unreadIcon: { fontSize: "14px", textAlign: "center" },
    menuIcon: { display: "none" },
    errorIcon: { fontSize: "32px" },
    errorCode: { fontSize: "11px" },
})

const FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 17, 18, 19, 20]

type ArticleProps = Readonly<{
    itemId: number
    side?: boolean
}>

function Article({ itemId, side = false }: ArticleProps) {
    const classes = useStyles()
    const dispatch = useAppDispatch()
    const item = useAppSelector(state => state.items[itemId])
    const source = useAppSelector(state => state.sources[item.source])
    const locale = useAppSelector(state => state.app.locale)
    const [fontFamily, setFontFamily] = useState(() =>
        window.settings.getFont()
    )
    const [fontSize, setFontSize] = useState(() =>
        window.settings.getFontSize()
    )
    const {
        articleRef,
        webview,
        webviewKey,
        showWebview,
        loadWebpage,
        loadFull,
        fullContent,
        loaded,
        error,
        toggleWebpage,
        toggleFull,
        reload,
    } = useArticleView(item, source.openTarget)

    const dismiss = () => dispatch(dismissItem())
    const handleNavigationKey = useCallback(
        (key: string) => {
            if (key === "Escape") dispatch(dismissItem())
            else if (key === "ArrowLeft" || key === "ArrowRight")
                dispatch(showOffsetItem(key === "ArrowLeft" ? -1 : 1))
            else return false
            return true
        },
        [dispatch]
    )
    const handleToggleHidden = useCallback(() => {
        if (!item.hidden) dispatch(dismissItem())
        if (!item.hasRead && !item.hidden) dispatch(markRead(item))
        dispatch(toggleHidden(item))
    }, [dispatch, item])

    useEffect(() => {
        return window.utils.addWebviewContextListener((pos, text, url) => {
            if (!pos) dispatch(closeContextMenu())
            else if (text || url) dispatch(openTextMenu(pos, text, url))
            else dispatch(openImageMenu(pos))
        })
    }, [dispatch])

    // A key arriving immediately after navigation must use the committed item.
    useLayoutEffect(() => {
        return window.utils.addWebviewKeydownListener(input => {
            if (input.type !== "keyDown" || handleNavigationKey(input.key))
                return
            switch (input.key) {
                case "l":
                case "L":
                    toggleWebpage()
                    break
                case "w":
                case "W":
                    toggleFull()
                    break
                case "h":
                case "H":
                    if (!input.meta) handleToggleHidden()
                    break
                default: {
                    const event = new KeyboardEvent("keydown", {
                        code: input.code,
                        key: input.key,
                        shiftKey: input.shift,
                        altKey: input.alt,
                        ctrlKey: input.control,
                        metaKey: input.meta,
                        repeat: input.isAutoRepeat,
                        bubbles: true,
                    })
                    dispatch(itemShortcuts(item, event))
                    document.dispatchEvent(event)
                    break
                }
            }
        })
    }, [
        dispatch,
        item,
        toggleWebpage,
        toggleFull,
        handleToggleHidden,
        handleNavigationKey,
    ])

    const updateFontSize = (size: number) => {
        window.settings.setFontSize(size)
        setFontSize(size)
    }
    const updateFont = (font: string) => {
        window.settings.setFont(font)
        setFontFamily(font)
    }

    const fontSizeMenuProps = (): IContextualMenuProps => ({
        items: FONT_SIZE_OPTIONS.map(size => ({
            key: String(size),
            text: String(size),
            canCheck: true,
            checked: size === fontSize,
            onClick: () => updateFontSize(size),
        })),
    })

    const fontFamilyMenuProps = (): IContextualMenuProps => ({
        items: window.fontList.map((font, idx) => ({
            key: String(idx),
            text: font === "" ? intl.get("default") : font,
            canCheck: true,
            checked: fontFamily === font,
            onClick: () => updateFont(font),
        })),
    })

    const updateTextDirection = (direction: SourceTextDirection) => {
        dispatch(updateSource({ ...source, textDir: direction } as RSSSource))
    }

    const directionMenuProps = (): IContextualMenuProps => ({
        items: [
            {
                key: "LTR",
                text: intl.get("article.LTR"),
                iconProps: { iconName: "Forward" },
                canCheck: true,
                checked: source.textDir === SourceTextDirection.LTR,
                onClick: () => updateTextDirection(SourceTextDirection.LTR),
            },
            {
                key: "RTL",
                text: intl.get("article.RTL"),
                iconProps: { iconName: "Back" },
                canCheck: true,
                checked: source.textDir === SourceTextDirection.RTL,
                onClick: () => updateTextDirection(SourceTextDirection.RTL),
            },
            {
                key: "Vertical",
                text: intl.get("article.Vertical"),
                iconProps: { iconName: "Down" },
                canCheck: true,
                checked: source.textDir === SourceTextDirection.Vertical,
                onClick: () =>
                    updateTextDirection(SourceTextDirection.Vertical),
            },
        ],
    })

    const moreMenuProps = (): IContextualMenuProps => ({
        items: [
            {
                key: "openInBrowser",
                text: intl.get("openExternal"),
                iconProps: { iconName: "NavigateExternalInline" },
                onClick: e => {
                    window.utils.openExternal(item.link, platformCtrl(e))
                },
            },
            {
                key: "copyURL",
                text: intl.get("context.copyURL"),
                iconProps: { iconName: "Link" },
                onClick: () => {
                    window.utils.writeClipboard(item.link)
                },
            },
            {
                key: "toggleHidden",
                text: item.hidden
                    ? intl.get("article.unhide")
                    : intl.get("article.hide"),
                iconProps: {
                    iconName: item.hidden ? "View" : "Hide3",
                },
                onClick: () => {
                    handleToggleHidden()
                },
            },
            {
                key: "fontMenu",
                text: intl.get("article.font"),
                iconProps: { iconName: "Font" },
                disabled: loadWebpage,
                subMenuProps: fontFamilyMenuProps(),
            },
            {
                key: "fontSizeMenu",
                text: intl.get("article.fontSize"),
                iconProps: { iconName: "FontSize" },
                disabled: loadWebpage,
                subMenuProps: fontSizeMenuProps(),
            },
            {
                key: "directionMenu",
                text: intl.get("article.textDir"),
                iconProps: { iconName: "ChangeEntitlements" },
                disabled: loadWebpage,
                subMenuProps: directionMenuProps(),
            },
            {
                key: "divider_1",
                itemType: ContextualMenuItemType.Divider,
            },
            ...shareSubmenu(item),
        ],
    })

    const articleView = () => {
        const a = encodeURIComponent(loadFull ? fullContent : item.content)
        const h = encodeURIComponent(
            renderToString(
                <>
                    <p className="title">{item.title}</p>
                    <p className="date">
                        {item.date.toLocaleString(locale, {
                            hour12: !locale.startsWith("zh"),
                        })}
                    </p>
                    <article></article>
                </>
            )
        )
        return `article/article.html?a=${a}&h=${h}&f=${encodeURIComponent(
            fontFamily
        )}&s=${fontSize}&d=${source.textDir}&u=${item.link}&m=${
            loadFull ? 1 : 0
        }`
    }

    return (
        <FocusZone
            elementRef={articleRef}
            tabIndex={-1}
            allowFocusRoot
            preventFocusRestoration
            onKeyDown={event => {
                if (event.target !== event.currentTarget) return
                // Keep content navigation on the pending article, not the toolbar.
                if (
                    handleNavigationKey(event.key) ||
                    [
                        "ArrowUp",
                        "ArrowDown",
                        "PageUp",
                        "PageDown",
                        "Home",
                        "End",
                    ].includes(event.key)
                ) {
                    event.preventDefault()
                    event.stopPropagation()
                }
            }}
            className={mergeClasses(
                "article",
                classes.root,
                side && classes.side
            )}>
            <Stack
                horizontal
                className={mergeClasses(
                    classes.toolbar,
                    side && classes.sideToolbar
                )}>
                <span className={classes.spacer}></span>
                <Stack
                    className={mergeClasses(
                        "actions",
                        classes.actions,
                        side && classes.sideActions
                    )}
                    grow
                    horizontal
                    tokens={{ childrenGap: 12 }}>
                    <Stack.Item grow className={classes.source}>
                        <span className={classes.sourceName}>
                            {loaded ? (
                                source.iconurl && (
                                    <img
                                        className={mergeClasses(
                                            "favicon",
                                            classes.sourceIcon
                                        )}
                                        src={source.iconurl}
                                    />
                                )
                            ) : (
                                <Spinner
                                    size="extra-tiny"
                                    className={classes.sourceIcon}
                                />
                            )}
                            {source.name}
                            {item.creator && (
                                <span className={classes.creator}>
                                    {item.creator}
                                </span>
                            )}
                        </span>
                    </Stack.Item>
                    <CommandBarButton
                        title={
                            item.hasRead
                                ? intl.get("article.markUnread")
                                : intl.get("article.markRead")
                        }
                        iconProps={
                            item.hasRead
                                ? { iconName: "StatusCircleRing" }
                                : {
                                      iconName: "RadioBtnOn",
                                      className: classes.unreadIcon,
                                  }
                        }
                        onClick={() =>
                            dispatch(
                                item.hasRead ? markUnread(item) : markRead(item)
                            )
                        }
                    />
                    <CommandBarButton
                        title={
                            item.starred
                                ? intl.get("article.unstar")
                                : intl.get("article.star")
                        }
                        iconProps={{
                            iconName: item.starred
                                ? "FavoriteStarFill"
                                : "FavoriteStar",
                        }}
                        onClick={() => dispatch(toggleStarred(item))}
                    />
                    <CommandBarButton
                        title={intl.get("article.loadFull")}
                        className={loadFull ? "active" : ""}
                        iconProps={{ iconName: "RawSource" }}
                        onClick={toggleFull}
                    />
                    <CommandBarButton
                        title={intl.get("article.loadWebpage")}
                        className={loadWebpage ? "active" : ""}
                        iconProps={{ iconName: "Globe" }}
                        onClick={toggleWebpage}
                    />
                    <CommandBarButton
                        title={intl.get("more")}
                        iconProps={{ iconName: "More" }}
                        menuIconProps={{ className: classes.menuIcon }}
                        menuProps={moreMenuProps()}
                    />
                </Stack>
                <Stack
                    horizontal
                    horizontalAlign="end"
                    className={classes.closeGroup}>
                    <CommandBarButton
                        title={intl.get("close")}
                        iconProps={{ iconName: "BackToWindow" }}
                        onClick={dismiss}
                    />
                </Stack>
            </Stack>
            {showWebview && (
                <webview
                    id="article"
                    className={mergeClasses(
                        classes.content,
                        error && classes.hidden
                    )}
                    ref={webview}
                    key={webviewKey}
                    src={loadWebpage ? item.link : articleView()}
                    allowpopups={"true" as unknown as boolean}
                    webpreferences="contextIsolation,disableDialogs,autoplayPolicy=document-user-activation-required"
                    partition={loadWebpage ? "sandbox" : undefined}
                />
            )}
            {error && (
                <Stack
                    className={mergeClasses("error-prompt", classes.content)}
                    verticalAlign="center"
                    horizontalAlign="center"
                    tokens={{ childrenGap: 12 }}>
                    <Icon
                        iconName="HeartBroken"
                        className={classes.errorIcon}
                    />
                    <Stack
                        horizontal
                        horizontalAlign="center"
                        tokens={{ childrenGap: 7 }}>
                        <small>{intl.get("article.error")}</small>
                        <small>
                            <Link onClick={reload}>
                                {intl.get("article.reload")}
                            </Link>
                        </small>
                    </Stack>
                    <span className={classes.errorCode}>{error}</span>
                </Stack>
            )}
        </FocusZone>
    )
}

export default Article
