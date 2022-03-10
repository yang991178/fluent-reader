import * as React from "react"
import { validateRegex } from "../../scripts/utils"
import { FeedFilter, FilterType } from "../../scripts/models/feed"
import { SourceTextDirection } from "../../scripts/models/source"

type HighlightsProps = {
    text: string
    filter: FeedFilter
    title?: boolean
    dir: SourceTextDirection
}

const Highlights: React.FunctionComponent<HighlightsProps> = props => {
    const spans: [string, boolean][] = new Array()
    const flags = props.filter.type & FilterType.CaseInsensitive ? "ig" : "g"
    let regex: RegExp
    if (
        props.filter.search === "" ||
        !(regex = validateRegex(props.filter.search, flags))
    ) {
        if (props.title) spans.push([props.text, false])
        else spans.push([props.text.substr(0, 325), false])
    } else if (props.title) {
        let match: RegExpExecArray
        do {
            const startIndex = regex.lastIndex
            match = regex.exec(props.text)
            if (match) {
                if (startIndex != match.index) {
                    spans.push([
                        props.text.substring(startIndex, match.index),
                        false,
                    ])
                }
                spans.push([match[0], true])
            } else {
                spans.push([props.text.substr(startIndex), false])
            }
        } while (match && regex.lastIndex < props.text.length)
    } else {
        const match = regex.exec(props.text)
        if (match) {
            if (match.index != 0) {
                const startIndex = Math.max(
                    match.index - 25,
                    props.text.lastIndexOf(" ", Math.max(match.index - 10, 0))
                )
                spans.push([
                    props.text.substring(Math.max(0, startIndex), match.index),
                    false,
                ])
            }
            spans.push([match[0], true])
            if (regex.lastIndex < props.text.length) {
                spans.push([props.text.substr(regex.lastIndex, 300), false])
            }
        } else {
            spans.push([props.text.substr(0, 325), false])
        }
    }

    const testStyle = {
        direction: "inherit",
        writingMode: "inherit",
    } as React.CSSProperties
    if (props.dir === SourceTextDirection.RTL) {
        testStyle.direction = "rtl"
    } else if (props.dir === SourceTextDirection.Vertical) {
        testStyle.writingMode = "vertical-rl"
    }
    return (
        <>
            {spans.map(([text, flag]) =>
                flag ? (
                    <div className="h" style={testStyle}>
                        {text}
                    </div>
                ) : (
                    <div style={testStyle}>{text}</div>
                )
            )}
        </>
    )
}

export default Highlights
