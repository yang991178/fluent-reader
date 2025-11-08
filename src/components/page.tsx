import * as React from "react"
import { FeedContainer } from "../containers/feed-container"
import { AnimationClassNames, Icon, FocusTrapZone } from "@fluentui/react"
import ArticleContainer from "../containers/article-container"
import { ViewType } from "../schema-types"
import ArticleSearch from "./utils/article-search"
import ResizeHandle from "./utils/resize-handle"

type PageProps = {
    menuOn: boolean
    contextOn: boolean
    settingsOn: boolean
    feeds: string[]
    itemId: number
    itemFromFeed: boolean
    viewType: ViewType
    listPanelWidth: number
    dismissItem: () => void
    offsetItem: (offset: number) => void
    setListPanelWidth: (width: number) => void
}

type PageState = {
    isResizing: boolean
}

class Page extends React.Component<PageProps, PageState> {
    constructor(props: PageProps) {
        super(props)
        this.state = {
            isResizing: false,
        }
    }

    offsetItem = (event: React.MouseEvent, offset: number) => {
        event.stopPropagation()
        this.props.offsetItem(offset)
    }
    prevItem = (event: React.MouseEvent) => this.offsetItem(event, -1)
    nextItem = (event: React.MouseEvent) => this.offsetItem(event, 1)

    handleResizeDragStart = () => {
        this.setState({ isResizing: true })
    }

    handleResizeDragEnd = () => {
        this.setState({ isResizing: false })
    }

    render = () =>
        this.props.viewType !== ViewType.List ? (
            <>
                {this.props.settingsOn ? null : (
                    <div
                        key="card"
                        className={
                            "main" + (this.props.menuOn ? " menu-on" : "")
                        }>
                        <ArticleSearch />
                        {this.props.feeds.map(fid => (
                            <FeedContainer
                                viewType={this.props.viewType}
                                feedId={fid}
                                key={fid + this.props.viewType}
                            />
                        ))}
                    </div>
                )}
                {this.props.itemId && (
                    <FocusTrapZone
                        disabled={this.props.contextOn}
                        ignoreExternalFocusing={true}
                        isClickableOutsideFocusTrap={true}
                        className="article-container"
                        onClick={this.props.dismissItem}>
                        <div
                            className="article-wrapper"
                            onClick={e => e.stopPropagation()}>
                            <ArticleContainer itemId={this.props.itemId} />
                        </div>
                        {this.props.itemFromFeed && (
                            <>
                                <div className="btn-group prev">
                                    <a className="btn" onClick={this.prevItem}>
                                        <Icon iconName="Back" />
                                    </a>
                                </div>
                                <div className="btn-group next">
                                    <a className="btn" onClick={this.nextItem}>
                                        <Icon iconName="Forward" />
                                    </a>
                                </div>
                            </>
                        )}
                    </FocusTrapZone>
                )}
            </>
        ) : (
            <>
                {this.props.settingsOn ? null : (
                    <div
                        key="list"
                        className={
                            "list-main" + (this.props.menuOn ? " menu-on" : "")
                        }>
                        <ArticleSearch />
                        <div
                            className="list-feed-container"
                            style={{ width: `${this.props.listPanelWidth}px` }}>
                            {this.props.feeds.map(fid => (
                                <FeedContainer
                                    viewType={this.props.viewType}
                                    feedId={fid}
                                    key={fid}
                                />
                            ))}
                        </div>
                        <ResizeHandle
                            onResize={this.props.setListPanelWidth}
                            minWidth={300}
                            maxWidthPercent={50}
                            onDragStart={this.handleResizeDragStart}
                            onDragEnd={this.handleResizeDragEnd}
                        />
                        {this.props.itemId && !this.state.isResizing ? (
                            <div className="side-article-wrapper">
                                <ArticleContainer itemId={this.props.itemId} />
                            </div>
                        ) : (
                            <div className="side-logo-wrapper">
                                <img
                                    className="light"
                                    src="icons/logo-outline.svg"
                                />
                                <img
                                    className="dark"
                                    src="icons/logo-outline-dark.svg"
                                />
                            </div>
                        )}
                    </div>
                )}
            </>
        )
}

export default Page
