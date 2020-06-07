import * as React from "react"
import { FeedIdType } from "../scripts/models/feed"
import { FeedContainer } from "../containers/feed-container"
import { RSSItem } from "../scripts/models/item"
import Article from "./article"
import { dismissItem } from "../scripts/models/page"
import { AnimationClassNames } from "@fluentui/react"
import ArticleContainer from "../containers/article-container"

type PageProps = {
    menuOn: boolean
    settingsOn: boolean
    feeds: FeedIdType[]
    itemId: number
    dismissItem: () => void
}

class Page extends React.Component<PageProps> {
    render = () => (
        <>
            {this.props.settingsOn ? null :
            <div className={"main" + (this.props.menuOn ? " menu-on" : "")}>
                {this.props.feeds.map(fid => (
                    <FeedContainer feedId={fid} key={fid} />
                ))}
            </div>}
            {this.props.itemId >= 0 && (
                <div className="article-container" onClick={this.props.dismissItem}>
                    <div className={"article-wrapper " + AnimationClassNames.slideUpIn20} onClick={e => e.stopPropagation()}>
                        <ArticleContainer itemId={this.props.itemId} />
                    </div>
                </div>
            )}
        </>
    )
}

export default Page