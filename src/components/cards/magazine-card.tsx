import * as React from "react"
import { Card } from "./card"
import CardInfo from "./info"

const className = (props: Card.Props) => {
    let cn = ["card", "magazine-card"]
    if (props.item.hasRead) cn.push("read")
    if (props.item.hidden) cn.push("hidden")
    return cn.join(" ")
}

const MagazineCard: React.FunctionComponent<Card.Props> = (props) => (
    <div
        className={className(props)}
        onClick={e => Card.onClick(props, e)}
        onMouseUp={e => Card.onMouseUp(props, e)}
        onKeyDown={e => Card.onKeyDown(props, e)}
        data-iid={props.item._id}
        data-is-focusable>
        {props.item.thumb ? (
            <div className="head"><img src={props.item.thumb} /></div>
        ) : null}
        <div className="data">
            <div>
                <h3 className="title">{props.item.title}</h3>
                <p className={"snippet" + (props.item.thumb ? "" : " show")}>{props.item.snippet.slice(0, 325)}</p>
            </div>
            <CardInfo source={props.source} item={props.item} />
        </div>
    </div>
)

export default MagazineCard