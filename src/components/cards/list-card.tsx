import * as React from "react"
import { Card } from "./card"
import Time from "../utils/time"
import { AnimationClassNames } from "@fluentui/react"

class ListCard extends Card {
    render() {
        return (
            <div className={"list-card "+AnimationClassNames.slideUpIn10+(this.props.item.snippet&&this.props.item.thumb?" transform":"")} 
                onClick={this.onClick} onMouseUp={this.onMouseUp} >
                {this.props.item.thumb ? (
                    <div className="head"><img src={this.props.item.thumb} /></div>
                ) : null}
                <div className="data">
                    <p className="info">
                        {this.props.source.iconurl ? <img src={this.props.source.iconurl} /> : null}
                        <span className="name">{this.props.source.name}</span>
                        <Time date={this.props.item.date} />
                        {this.props.item.hasRead ? null : <span className="read-indicator"></span>}
                    </p>
                    <h3 className="title">{this.props.item.title}</h3>
                </div>
            </div>
        )
    }
}

export default ListCard