import * as React from "react"
import { FeedIdType } from "../scripts/models/feed"
import { FeedContainer } from "../containers/feed-container"

type PageProps = {
    menuOn: boolean
    settingsOn: boolean
    feeds: FeedIdType[]
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
        </>
    )
}

export default Page