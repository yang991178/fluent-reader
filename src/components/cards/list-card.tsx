import * as React from "react"
import { Card } from "./card"
import { AnimationClassNames } from "@fluentui/react"
import CardInfo from "./info"

class ListCard extends Card {
    className = () => {
        let cn = ["list-card", AnimationClassNames.slideUpIn10]
        if (this.props.item.hidden) cn.push("hidden")
        return cn.join(" ")
    }

    render() {
        return (
            <div 
                className={this.className()}
                onClick={this.onClick}
                onMouseUp={this.onMouseUp}
                onKeyDown={this.onKeyDown}
                data-iid={this.props.item._id}
                data-is-focusable>
                {this.props.item.thumb ? (
                    <div className="head"><img src={this.props.item.thumb} /></div>
                ) : null}
                <div className="data">
                    <CardInfo source={this.props.source} item={this.props.item} />
                    <h3 className="title">{this.props.item.title}</h3>
                </div>
            </div>
        )
    }
}

export default ListCard