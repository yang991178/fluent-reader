import * as React from "react"
import { useCallback } from "react"
import { Feed } from "./feeds/feed"
import { Icon, FocusTrapZone } from "@fluentui/react"
import ArticleContainer from "../containers/article-container"
import { ViewType } from "../schema-types"
import ArticleSearch from "./utils/article-search"
import { useAppSelector, useAppDispatch } from "../scripts/reducer"
import { dismissItem, showOffsetItem } from "../scripts/models/page"
import { ContextMenuType } from "../scripts/models/app"

const Page: React.FC = () => {
    const dispatch = useAppDispatch()

    const feedId = useAppSelector(s => s.page.feedId)
    const settingsOn = useAppSelector(s => s.app.settings.display)
    const menuOn = useAppSelector(s => s.app.menu)
    const contextOn = useAppSelector(
        s => s.app.contextMenu.type !== ContextMenuType.Hidden
    )
    const itemId = useAppSelector(s => s.page.itemId)
    const itemFromFeed = useAppSelector(s => s.page.itemFromFeed)
    const viewType = useAppSelector(s => s.page.viewType)

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
                <div
                    key="list"
                    className={"list-main" + (menuOn ? " menu-on" : "")}>
                    <ArticleSearch />
                    <div className="list-feed-container">
                        <Feed
                            viewType={viewType}
                            feedId={feedId}
                            key={feedId}
                        />
                    </div>
                    {itemId ? (
                        <div className="side-article-wrapper">
                            <ArticleContainer itemId={itemId} />
                        </div>
                    ) : (
                        <div className="side-logo-wrapper">
                            <img
                                className="light"
                                src="icons/logo-outline.svg"
                                alt="Fluent Reader logo"
                            />
                            <img
                                className="dark"
                                src="icons/logo-outline-dark.svg"
                                alt="Fluent Reader logo"
                            />
                        </div>
                    )}
                </div>
            )}
        </>
    ) : (
        <>
            {settingsOn ? null : (
                <div key="card" className={"main" + (menuOn ? " menu-on" : "")}>
                    <ArticleSearch />
                    <Feed
                        viewType={viewType}
                        feedId={feedId}
                        key={feedId + viewType}
                    />
                </div>
            )}
            {!!itemId && (
                <FocusTrapZone
                    disabled={contextOn}
                    ignoreExternalFocusing={true}
                    isClickableOutsideFocusTrap={true}
                    className="article-container"
                    onClick={handleDismissItem}>
                    <div
                        className="article-wrapper"
                        onClick={e => e.stopPropagation()}>
                        <ArticleContainer itemId={itemId} />
                    </div>
                    {itemFromFeed && (
                        <>
                            <div className="btn-group prev">
                                <button
                                    className="btn"
                                    aria-label="Previous article"
                                    onClick={prevItem}>
                                    <Icon iconName="Back" />
                                </button>
                            </div>
                            <div className="btn-group next">
                                <button
                                    className="btn"
                                    aria-label="Next article"
                                    onClick={nextItem}>
                                    <Icon iconName="Forward" />
                                </button>
                            </div>
                        </>
                    )}
                </FocusTrapZone>
            )}
        </>
    )
}

export default Page
