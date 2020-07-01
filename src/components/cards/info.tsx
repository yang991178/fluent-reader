import * as React from "react"
import Time from "../utils/time"
import { RSSSource } from "../../scripts/models/source"
import { RSSItem } from "../../scripts/models/item"

type CardInfoProps = {
    source: RSSSource
    item: RSSItem
}

const CardInfo: React.FunctionComponent<CardInfoProps> = (props) => (
    <p className="info">
        {props.source.iconurl ? <img src={props.source.iconurl} /> : null}
        <span className="name">{props.source.name}</span>
        <Time date={props.item.date} />
        {props.item.hasRead ? null : <span className="read-indicator"></span>}
        {props.item.starred ? <span className="starred-indicator"></span> : null}
    </p>
)

export default CardInfo