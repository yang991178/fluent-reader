import * as React from "react"
import { Card } from "./card"
import CardInfo from "./info"

const className = (props: Card.Props) => {
    let cn = ["card", "default-card"]
    if (props.item.snippet && props.item.thumb) cn.push("transform")
    if (props.item.hidden) cn.push("hidden")
    return cn.join(" ")
}

const DefaultCard: React.FunctionComponent<Card.Props> = (props) => (
    <div
        className={className(props)}
        onClick={e => Card.onClick(props, e)}
        onMouseUp={e => Card.onMouseUp(props, e)}
        onKeyDown={e => Card.onKeyDown(props, e)}
        data-iid={props.item._id}
        data-is-focusable>
        {props.item.thumb ? (
            <img className="bg" src={props.item.thumb} />
        ) : null}
        <div className="bg"></div>
        {props.item.thumb ? (
            <img className="head" src={props.item.thumb} />
        ) : null}
        <CardInfo source={props.source} item={props.item} />
        <h3 className="title">{props.item.title}</h3>
        <p className={"snippet" + (props.item.thumb ? "" : " show")}>{props.item.snippet.slice(0, 325)}</p>
    </div>
)

export default DefaultCard