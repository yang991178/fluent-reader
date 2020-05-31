import * as React from "react"
import { Feed } from "./feed"
import DefaultCard from "../cards/default-card"
import { PrimaryButton } from 'office-ui-fabric-react';

class CardsFeed extends Feed {
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
        let elemLastRow = this.props.items.length % elemPerRow
        let fixes = new Array<JSX.Element>()
        for (let i = 0; i < elemPerRow - elemLastRow; i += 1) {
            fixes.push(<div className="flex-fix" key={"f-"+i}></div>)
        }
        return fixes
    }

    render() {
        return this.props.feed.loaded && (
            <div className="cards-feed-container">
                {
                    this.props.items.map(item => (
                        <div key={item.id}>
                            <DefaultCard 
                                item={item} 
                                source={this.props.sourceMap[item.source]} 
                                markRead={this.props.markRead}
                                contextMenu={this.props.contextMenu} />
                        </div>
                    ))
                }
                { this.flexFix() }
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

export default CardsFeed