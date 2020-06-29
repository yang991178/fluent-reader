import * as React from "react"
import intl from "react-intl-universal"
import { FeedProps } from "./feed"
import DefaultCard from "../cards/default-card"
import { PrimaryButton, FocusZone } from 'office-ui-fabric-react';

class CardsFeed extends React.Component<FeedProps> {
    state = { width: window.innerWidth - 12 }

    updateWidth = () => {
        this.setState({ width: window.innerWidth - 12 });
    };

    componentDidMount() {
        window.addEventListener('resize', this.updateWidth);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWidth);
    }

    flexFix = () => {
        let elemPerRow = Math.floor(this.state.width / 280)
        //let elemLastRow = this.props.items.length % elemPerRow
        let fixes = new Array<JSX.Element>()
        for (let i = 0; i < elemPerRow; i += 1) {
            fixes.push(<div className="flex-fix" key={"f-"+i}></div>)
        }
        return fixes
    }

    render() {
        return this.props.feed.loaded && (
            <FocusZone as="div" id="refocus" className="cards-feed-container">
                {
                    this.props.items.map((item) => (
                        <DefaultCard 
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
                { this.flexFix() }
                {
                    (this.props.feed.loaded && !this.props.feed.allLoaded)
                    ? <div className="load-more-wrapper"><PrimaryButton 
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

export default CardsFeed