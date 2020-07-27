import * as React from "react"
import { validateRegex } from "../../scripts/utils"

type HighlightsProps = {
    text: string
    keyword: string
    title?: boolean
}

const Highlights: React.FunctionComponent<HighlightsProps> = (props) => {
    const spans: [string, boolean][] = new Array()
    let regex: RegExp
    if (props.keyword === "" || !(regex = validateRegex(props.keyword, "g"))) {
        if (props.title) spans.push([props.text, false])
        else spans.push([props.text.substr(0, 325), false])
    } else if (props.title) {
        let match: RegExpExecArray
        do {
            const startIndex = regex.lastIndex
            match = regex.exec(props.text)
            if (match) {
                if (startIndex != match.index) {
                    spans.push([props.text.substring(startIndex, match.index), false])
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
                const startIndex = Math.max(match.index - 25, props.text.lastIndexOf(" ", Math.max(match.index - 10, 0)))
                spans.push([props.text.substring(Math.max(0, startIndex), match.index), false])
            }
            spans.push([match[0], true])
            if (regex.lastIndex < props.text.length) {
                spans.push([props.text.substr(regex.lastIndex, 300), false])
            }
        } else {
            spans.push([props.text.substr(0, 325), false])
        }
    }

    return <>
        {spans.map(([text, flag]) => flag ? <span className="h">{text}</span> : text)}
    </>
}

export default Highlights