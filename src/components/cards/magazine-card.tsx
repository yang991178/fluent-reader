import * as React from "react"
import { Card } from "./card"
import CardInfo from "./info"
import Highlights from "./highlights"
import { SourceTextDirection } from "../../scripts/models/source"

const className = (props: Card.Props) => {
    let cn = ["card", "magazine-card"]
    if (props.item.hasRead) cn.push("read")
    if (props.item.hidden) cn.push("hidden")
    if (props.source.textDir === SourceTextDirection.RTL) cn.push("rtl")
    return cn.join(" ")
}

const MagazineCard: React.FunctionComponent<Card.Props> = props => (
    <div
        className={className(props)}
        {...Card.bindEventsToProps(props)}
        data-iid={props.item._id}
        data-is-focusable>
        {props.item.thumb ? (
            <div className="head">
                <img src={props.item.thumb} />
            </div>
        ) : null}
        <div className="data">
            <div>
                <h3 className="title">
                    <Highlights
                        text={props.item.title}
                        filter={props.filter}
                        title
                    />
                </h3>
                <p className="snippet">
                    <Highlights
                        text={props.item.snippet}
                        filter={props.filter}
                    />
                </p>
            </div>
            <CardInfo source={props.source} item={props.item} showCreator />
        </div>
    </div>
)

export default MagazineCard
