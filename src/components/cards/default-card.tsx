import * as React from "react"
import { Card } from "./card"
import Time from "../utils/time"

class DefaultCard extends Card {
    render() {
        return (
            <div className={"card"+(this.props.item.snippet&&this.props.item.thumb?" transform":"")} 
                onClick={this.onClick} onMouseUp={this.onMouseUp} >
                {this.props.item.thumb ? (
                    <img className="bg" src={this.props.item.thumb} />
                ) : null}
                <div className="bg"></div>
                {this.props.item.thumb ? (
                    <img className="head" src={this.props.item.thumb} />
                ) : null}
                <p className="info">
                    {this.props.source.iconurl ? <img src={this.props.source.iconurl} /> : null}
                    <span className="name">{this.props.source.name}</span>
                    <Time date={this.props.item.date} />
                    {this.props.item.hasRead ? null : <span className="read-indicator"></span>}
                </p>
                <h3 className="title">{this.props.item.title}</h3>
                <p className={"snippet"+(this.props.item.thumb?"":" show")}>{this.props.item.snippet}</p>
            </div>
        )
    }
}

export default DefaultCard