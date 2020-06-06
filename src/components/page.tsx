import * as React from "react"
import { FeedIdType } from "../scripts/models/feed"
import { FeedContainer } from "../containers/feed-container"
import { RSSItem } from "../scripts/models/item"
import Article from "./article"
import { dismissItem } from "../scripts/models/page"
import { AnimationClassNames } from "@fluentui/react"

type PageProps = {
    menuOn: boolean
    settingsOn: boolean
    feeds: FeedIdType[]
    item: RSSItem
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
            {this.props.item && (
                <div className="article-container" onClick={this.props.dismissItem}>
                    <div className={"article-wrapper " + AnimationClassNames.slideUpIn20} onClick={e => e.stopPropagation()}>
                        <Article item={this.props.item} dismiss={dismissItem} />
                    </div>
                </div>
            )}
        </>
    )
}

export default Page