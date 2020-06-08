import * as React from "react"
import { FeedIdType } from "../scripts/models/feed"
import { FeedContainer } from "../containers/feed-container"
import { AnimationClassNames, Icon } from "@fluentui/react"
import ArticleContainer from "../containers/article-container"

type PageProps = {
    menuOn: boolean
    settingsOn: boolean
    feeds: FeedIdType[]
    itemId: number
    dismissItem: () => void
    offsetItem: (offset: number) => void
}

class Page extends React.Component<PageProps> {
    prevItem = (event: React.MouseEvent) => {
        event.stopPropagation()
        this.props.offsetItem(-1)
    }
    nextItem = (event: React.MouseEvent) => {
        event.stopPropagation()
        this.props.offsetItem(1)
    }

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
                    <div className="btn-group prev"><a className="btn" onClick={this.prevItem}><Icon iconName="Back" /></a></div>
                    <div className="btn-group next"><a className="btn" onClick={this.nextItem}><Icon iconName="Forward" /></a></div>
                </div>
            )}
        </>
    )
}

export default Page