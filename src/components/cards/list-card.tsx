import * as React from "react"
import { Card } from "./card"
import CardInfo from "./info"
import Highlights from "./highlights"

const className = (props: Card.Props) => {
    let cn = ["card", "list-card"]
    if (props.item.hidden) cn.push("hidden")
    return cn.join(" ")
}

const ListCard: React.FunctionComponent<Card.Props> = (props) => (
    <div
        className={className(props)}
        {...Card.bindEventsToProps(props)}
        data-iid={props.item._id}
        data-is-focusable>
        {props.item.thumb ? (
            <div className="head"><img src={props.item.thumb} /></div>
        ) : null}
        <div className="data">
            <CardInfo source={props.source} item={props.item} />
            <h3 className="title"><Highlights text={props.item.title} filter={props.filter} title /></h3>
        </div>
    </div>
)

export default ListCard