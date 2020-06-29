import * as React from "react"
import intl from "react-intl-universal"
import { FeedProps } from "./feed"
import { DefaultButton, FocusZone, FocusZoneDirection } from 'office-ui-fabric-react';
import ListCard from "../cards/list-card";

class ListFeed extends React.Component<FeedProps> {
    render() {
        return this.props.feed.loaded && (
            <FocusZone as="div" id="refocus" direction={FocusZoneDirection.vertical} className="list-feed">
                {
                    this.props.items.map((item) => (
                        <ListCard 
                            feedId={this.props.feed._id}
                            key={item._id}
                            item={item} 
                            source={this.props.sourceMap[item.source]} 
                            shortcuts={this.props.shortcuts}
                            markRead={this.props.markRead}
                            contextMenu={this.props.contextMenu}
                            showItem={this.props.showItem} />
                    ))
                }
                {
                    (this.props.feed.loaded && !this.props.feed.allLoaded)
                    ? <div className="load-more-wrapper"><DefaultButton 
                        text={intl.get("loadMore")} 
                        disabled={this.props.feed.loading}
                        onClick={() => this.props.loadMore(this.props.feed)} /></div>
                    : null
                }
                { this.props.items.length === 0 && (
                    <div className="empty">{intl.get("article.empty")}</div>
                )}
            </FocusZone>
        )
    }
}

export default ListFeed