import * as React from "react"
import { makeStyles, mergeClasses } from "@griffel/react"
import { Card } from "./card"
import CardInfo from "./info"
import Highlights from "./highlights"
import { SourceTextDirection } from "../../scripts/models/source"
import { getItemVideoUrl } from "../../scripts/utils"

const useStyles = makeStyles({
    video: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "144px",
        objectFit: "cover",
        zIndex: 1,
        opacity: 0,
        pointerEvents: "none",
    },
    videoPlaying: {
        opacity: 1,
    },
})

const className = (props: Card.Props) => {
    let cn = ["card", "default-card"]
    if (props.item.snippet && props.item.thumb) cn.push("transform")
    if (props.item.hidden) cn.push("hidden")
    if (props.source.textDir === SourceTextDirection.RTL) cn.push("rtl")
    return cn.join(" ")
}

const DefaultCard: React.FunctionComponent<Card.Props> = props => {
    const styles = useStyles()
    const [hovering, setHovering] = React.useState(false)
    const [unplayable, setUnplayable] = React.useState(false)
    const videoRef = React.useRef<HTMLVideoElement>(null)

    // Parsing the body is not free, but an item's content never changes.
    const videoUrl = React.useMemo(
        () => getItemVideoUrl(props.item.content),
        [props.item._id, props.item.content]
    )

    React.useEffect(() => {
        const video = videoRef.current
        if (!video || !videoUrl || unplayable) return
        if (hovering) {
            const started = video.play()
            if (started) started.catch(() => undefined)
        } else {
            video.pause()
            video.currentTime = 0
        }
    }, [hovering, videoUrl, unplayable])

    // A source that cannot be decoded (404, unsupported codec, hotlink guard)
    // must not cover the still thumbnail with an empty box.
    const playable = videoUrl && !unplayable

    // While the video covers the card head, the hover "expand" motion would
    // slide the image out and the text across the video. Freeze those three
    // elements for cards that can play something.
    const frozen = playable && hovering ? { transform: "none" } : undefined

    return (
        <div
            className={className(props)}
            {...Card.bindEventsToProps(props)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            data-iid={props.item._id}
            data-is-focusable>
            {props.item.thumb ? (
                <img className="bg" src={props.item.thumb} />
            ) : null}
            <div className="bg"></div>
            {props.item.thumb ? (
                <img className="head" style={frozen} src={props.item.thumb} />
            ) : null}
            {playable ? (
                <video
                    ref={videoRef}
                    className={mergeClasses(
                        styles.video,
                        hovering && styles.videoPlaying
                    )}
                    src={hovering ? videoUrl : undefined}
                    muted
                    loop
                    playsInline
                    preload="none"
                    onError={() => setUnplayable(true)}
                />
            ) : null}
            <CardInfo source={props.source} item={props.item} />
            <h3 className="title" style={frozen}>
                <Highlights
                    text={props.item.title}
                    filter={props.filter}
                    title
                />
            </h3>
            <p className={"snippet" + (props.item.thumb ? "" : " show")}>
                <Highlights text={props.item.snippet} filter={props.filter} />
            </p>
        </div>
    )
}

export default DefaultCard
