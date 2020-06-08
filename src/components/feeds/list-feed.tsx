import * as React from "react"
import { FeedProps } from "./feed"
import { PrimaryButton } from 'office-ui-fabric-react';
import ListCard from "../cards/list-card";

class ListFeed extends React.Component<FeedProps> {
    render() {
        return this.props.feed.loaded && (
            <div className="list-feed">
                {
                    this.props.items.map((item) => (
                        <ListCard 
                            feedId={this.props.feed.id}
                            key={item.id}
                            item={item} 
                            source={this.props.sourceMap[item.source]} 
                            markRead={this.props.markRead}
                            contextMenu={this.props.contextMenu}
                            showItem={this.props.showItem} />
                    ))
                }
                {
                    (this.props.feed.loaded && !this.props.feed.allLoaded)
                    ? <div className="load-more-wrapper"><PrimaryButton 
                        text="加载更多" 
                        disabled={this.props.feed.loading}
                        onClick={() => this.props.loadMore(this.props.feed)} /></div>
                    : null
                }
            </div>
        )
    }
}

export default ListFeed