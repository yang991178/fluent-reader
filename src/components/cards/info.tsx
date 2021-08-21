import * as React from "react"
import Time from "../utils/time"
import { RSSSource } from "../../scripts/models/source"
import { RSSItem } from "../../scripts/models/item"

type CardInfoProps = {
    source: RSSSource
    item: RSSItem
    hideTime?: boolean
    showCreator?: boolean
}

const CardInfo: React.FunctionComponent<CardInfoProps> = props => (
    <p className="info">
        {props.source.iconurl ? <img src={props.source.iconurl} /> : null}
        <span className="name">
            {props.source.name}
            {props.showCreator && props.item.creator && (
                <span className="creator">{props.item.creator}</span>
            )}
        </span>
        {props.item.starred ? (
            <span className="starred-indicator"></span>
        ) : null}
        {props.item.hasRead ? null : <span className="read-indicator"></span>}
        {props.hideTime ? null : <Time date={props.item.date} />}
    </p>
)

export default CardInfo
