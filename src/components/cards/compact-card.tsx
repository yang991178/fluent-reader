import * as React from "react"
import { Card } from "./card"
import CardInfo from "./info"
import Time from "../utils/time"

const className = (props: Card.Props) => {
    let cn = ["card", "compact-card"]
    if (props.item.hidden) cn.push("hidden")
    return cn.join(" ")
}

const CompactCard: React.FunctionComponent<Card.Props> = (props) => (
    <div
        className={className(props)}
        onClick={e => Card.onClick(props, e)}
        onMouseUp={e => Card.onMouseUp(props, e)}
        onKeyDown={e => Card.onKeyDown(props, e)}
        data-iid={props.item._id}
        data-is-focusable>
        <CardInfo source={props.source} item={props.item} hideTime />
        <div className="data">
            <span className="title">{props.item.title}</span>
            <span className={"snippet" + (props.item.thumb ? "" : " show")}>{props.item.snippet.slice(0, 325)}</span>
        </div>
        <Time date={props.item.date} />
    </div>
)

export default CompactCard