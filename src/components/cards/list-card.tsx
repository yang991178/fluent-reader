import * as React from "react"
import { Card } from "./card"
import CardInfo from "./info"
import Highlights from "./highlights"
import { ViewConfigs } from "../../schema-types"
import { SourceTextDirection } from "../../scripts/models/source"

const className = (props: Card.Props) => {
    let cn = ["card", "list-card"]
    if (props.item.hidden) cn.push("hidden")
    if (props.selected) cn.push("selected")
    if (props.viewConfigs & ViewConfigs.FadeRead && props.item.hasRead)
        cn.push("read")
    if (props.source.textDir === SourceTextDirection.RTL) cn.push("rtl")
    return cn.join(" ")
}

const ListCard: React.FunctionComponent<Card.Props> = props => (
    <div
        className={className(props)}
        {...Card.bindEventsToProps(props)}
        data-iid={props.item._id}
        data-is-focusable>
        {props.item.thumb && props.viewConfigs & ViewConfigs.ShowCover ? (
            <div className="head">
                <img src={props.item.thumb} />
            </div>
        ) : null}
        <div className="data">
            <CardInfo source={props.source} item={props.item} />
            <h3 className="title">
                <Highlights
                    text={props.item.title}
                    filter={props.filter}
                    title
                />
            </h3>
            {Boolean(props.viewConfigs & ViewConfigs.ShowSnippet) && (
                <p className="snippet">
                    <Highlights
                        text={props.item.snippet}
                        filter={props.filter}
                    />
                </p>
            )}
        </div>
    </div>
)

export default ListCard
