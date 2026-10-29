import * as React from "react"
import { useCallback } from "react"
import { Feed } from "./feeds/feed"
import { Icon, FocusTrapZone } from "@fluentui/react"
import Article from "./article"
import { ViewType } from "../schema-types"
import ArticleSearch from "./utils/article-search"
import { useAppSelector, useAppDispatch } from "../scripts/reducer"
import {
    canShowOffsetItem,
    dismissItem,
    showOffsetItem,
} from "../scripts/models/page"
import { ContextMenuType } from "../scripts/models/app"
import { makeStyles, mergeClasses } from "@griffel/react"
import { FlatButton } from "./utils/FlatButton"
import { FlatButtonGroup } from "./utils/FlatButtonGroup"
import { useArticleOverlayOpen } from "./utils/hooks/useArticleOverlayOpen"
import { useArticleOverlayWidth } from "./utils/hooks/useArticleOverlayWidth"
import { ResizeHandle } from "./utils/ResizeHandle"
import { ListView } from "./list-view"

const usePageClasses = makeStyles({
    feedMain: {
        "marginTop": "calc(-1 * var(--navHeight))",
        "marginLeft": 0,
        "transition": "margin-left var(--transition-timing) 0.367s",
        "height": "100%",
        "overflow": "hidden",
        "backgroundColor": "var(--neutralLighterAlt)",
        "::before": {
            content: '""',
            display: "block",
            position: "relative",
            top: "var(--navHeight)",
            left: 0,
            width: "calc(100% - 16px)",
            height: "var(--navHeight)",
            marginBottom: "calc(-1 * var(--navHeight))",
            background: "linear-gradient(var(--neutralLighterAlt), #faf9f800)",
            zIndex: 1,
        },
    },
    feedMenuOpen: {
        "@media (min-width: 1440px)": { marginLeft: "280px" },
    },
    articleContainer: {
        position: "fixed",
        zIndex: 6,
        inset: 0,
    },
    articleScrim: {
        position: "absolute",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        backgroundColor: "#0008",
        animationName: "fade",
        animationDuration: "0.5s",
        animationTimingFunction: "var(--transition-timing)",
        animationFillMode: "backwards",
    },
    feedBlurred: {
        // Keep the article's guest surface outside the filtered background.
        filter: "var(--blur)",
    },
    articleWrapper: {
        position: "relative",
        margin: "32px auto 0",
        width: "var(--article-overlay-width)",
        height: "calc(100% - 50px)",
        backgroundColor: "var(--white)",
        boxShadow:
            "0 6.4px 14.4px 0 rgba(0, 0, 0, 0.132), 0 1.2px 3.6px 0 rgba(0, 0, 0, 0.108)",
        borderRadius: "5px",
        overflow: "hidden",
        animationName: {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
        },
        animationDuration: "0.5s",
        animationTimingFunction: "var(--transition-timing)",
        animationFillMode: "backwards",
    },
    resizeHandle: {
        top: "32px",
        bottom: "18px",
    },
    resizeHandleLeft: {
        left: "calc(50% - var(--article-overlay-width) / 2 - 4px)",
    },
    resizeHandleRight: {
        right: "calc(50% - var(--article-overlay-width) / 2 - 4px)",
    },
    articleBtn: {
        ":enabled": {
            color: "#fff",
        },
    },
    articleGroup: {
        position: "absolute",
        top: "calc(50% - 32px)",
        animationName: "fade",
        animationDuration: "0.5s",
        animationTimingFunction: "var(--transition-timing)",
        animationFillMode: "backwards",
    },
    articleGroupPrev: {
        left: "calc(50% - var(--article-overlay-width) / 2 - 56px)",
    },
    articleGroupNext: {
        right: "calc(50% - var(--article-overlay-width) / 2 - 56px)",
    },
})

const Page: React.FC = () => {
    const dispatch = useAppDispatch()
    const pageClasses = usePageClasses()

    const feedId = useAppSelector(s => s.page.feedId)
    const settingsOn = useAppSelector(s => s.app.settings.display)
    const menuOn = useAppSelector(s => s.app.menu)
    const contextOn = useAppSelector(
        s => s.app.contextMenu.type !== ContextMenuType.Hidden
    )
    const itemId = useAppSelector(s => s.page.itemId)
    const itemFromFeed = useAppSelector(s => s.page.itemFromFeed)
    const hasPrevious = useAppSelector(s => canShowOffsetItem(s, -1))
    const hasNext = useAppSelector(s => canShowOffsetItem(s, 1))
    const viewType = useAppSelector(s => s.page.viewType)
    const articleOverlayOpen = useArticleOverlayOpen()
    const articleWidth = useArticleOverlayWidth()

    const handleDismissItem = useCallback(() => dispatch(dismissItem()), [])
    const handleOffsetItem = useCallback(
        (event: React.MouseEvent, offset: number) => {
            event.stopPropagation()
            dispatch(showOffsetItem(offset))
        },
        []
    )
    const prevItem = useCallback(
        (event: React.MouseEvent) => handleOffsetItem(event, -1),
        [handleOffsetItem]
    )
    const nextItem = useCallback(
        (event: React.MouseEvent) => handleOffsetItem(event, 1),
        [handleOffsetItem]
    )

    return viewType === ViewType.List ? (
        <>
            {settingsOn ? null : (
                <ListView feedId={feedId} itemId={itemId} menuOn={menuOn} />
            )}
        </>
    ) : (
        <>
            {settingsOn ? null : (
                <div
                    key="card"
                    className={mergeClasses(
                        "main",
                        pageClasses.feedMain,
                        menuOn && "menu-on",
                        menuOn && pageClasses.feedMenuOpen,
                        articleOverlayOpen && pageClasses.feedBlurred
                    )}>
                    <ArticleSearch />
                    <Feed
                        viewType={viewType}
                        feedId={feedId}
                        key={feedId + viewType}
                    />
                </div>
            )}
            {articleOverlayOpen && (
                <FocusTrapZone
                    disabled={contextOn}
                    firstFocusableTarget={root => {
                        const webview =
                            root.querySelector<HTMLElement>("webview")
                        return webview?.getClientRects().length
                            ? webview
                            : root.querySelector<HTMLElement>(".article")
                    }}
                    ignoreExternalFocusing={true}
                    isClickableOutsideFocusTrap={true}
                    className={mergeClasses(
                        "article-container",
                        pageClasses.articleContainer
                    )}
                    style={articleWidth.style}
                    onClick={handleDismissItem}>
                    {/* Fade the scrim separately from the article's guest surface. */}
                    <div
                        aria-hidden="true"
                        className={pageClasses.articleScrim}
                    />
                    <div
                        className={mergeClasses(
                            "article-wrapper",
                            pageClasses.articleWrapper
                        )}
                        onClick={e => e.stopPropagation()}>
                        <Article itemId={itemId} />
                    </div>
                    {([-1, 1] as const).map(side => (
                        <ResizeHandle
                            key={side}
                            label={
                                side === -1
                                    ? "Resize article from left"
                                    : "Resize article from right"
                            }
                            multiplier={2 * side}
                            styleClass={mergeClasses(
                                pageClasses.resizeHandle,
                                side === -1
                                    ? pageClasses.resizeHandleLeft
                                    : pageClasses.resizeHandleRight
                            )}
                            {...articleWidth.handleProps}
                        />
                    ))}
                    {itemFromFeed && (
                        <>
                            <FlatButtonGroup
                                styleClass={mergeClasses(
                                    pageClasses.articleGroup,
                                    pageClasses.articleGroupPrev
                                )}>
                                <FlatButton
                                    styleClass={pageClasses.articleBtn}
                                    ariaLabel="Previous article"
                                    disabled={!hasPrevious}
                                    onClick={prevItem}>
                                    <Icon iconName="Back" />
                                </FlatButton>
                            </FlatButtonGroup>
                            <FlatButtonGroup
                                styleClass={mergeClasses(
                                    pageClasses.articleGroup,
                                    pageClasses.articleGroupNext
                                )}>
                                <FlatButton
                                    styleClass={pageClasses.articleBtn}
                                    ariaLabel="Next article"
                                    disabled={!hasNext}
                                    onClick={nextItem}>
                                    <Icon iconName="Forward" />
                                </FlatButton>
                            </FlatButtonGroup>
                        </>
                    )}
                </FocusTrapZone>
            )}
        </>
    )
}

export default Page
