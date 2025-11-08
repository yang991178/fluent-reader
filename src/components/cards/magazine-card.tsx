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

const MagazineCard: React.FunctionComponent<Card.Props> = props => {
    const titleStyle: React.CSSProperties = {}
    const snippetStyle: React.CSSProperties = {}

    if (props.fontSize) {
        titleStyle.fontSize = `${props.fontSize}px`
        snippetStyle.fontSize = `${props.fontSize * 0.85}px`
    }
    if (props.fontFamily) {
        titleStyle.fontFamily = props.fontFamily
        snippetStyle.fontFamily = props.fontFamily
    }

    return (
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
                    <h3 className="title" style={titleStyle}>
                        <Highlights
                            text={props.item.title}
                            filter={props.filter}
                            title
                        />
                    </h3>
                    <p className="snippet" style={snippetStyle}>
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
}

export default MagazineCard
