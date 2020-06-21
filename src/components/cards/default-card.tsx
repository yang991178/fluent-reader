import * as React from "react"
import { Card } from "./card"
import { AnimationClassNames } from "@fluentui/react"
import CardInfo from "./info"

class DefaultCard extends Card {
    className = () => {
        let cn = ["card", AnimationClassNames.slideUpIn10]
        if (this.props.item.snippet && this.props.item.thumb) cn.push("transform")
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
                    <img className="bg" src={this.props.item.thumb} />
                ) : null}
                <div className="bg"></div>
                {this.props.item.thumb ? (
                    <img className="head" src={this.props.item.thumb} />
                ) : null}
                <CardInfo source={this.props.source} item={this.props.item} />
                <h3 className="title">{this.props.item.title}</h3>
                <p className={"snippet"+(this.props.item.thumb?"":" show")}>{this.props.item.snippet.slice(0, 325)}</p>
            </div>
        )
    }
}

export default DefaultCard