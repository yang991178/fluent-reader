import * as React from "react"
import { useEffect, useRef } from "react"
import { makeStyles } from "@griffel/react"
import { Spinner } from "@fluentui/react-components"
import intl from "react-intl-universal"
import { FeedProps } from "./feed"

const useStyles = makeStyles({
    root: {
        width: "100%",
        height: "48px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
})

export function FeedEnd({
    feed,
    loadMore,
}: Pick<FeedProps, "feed" | "loadMore">) {
    const classes = useStyles()
    const element = useRef<HTMLDivElement>(null)
    const latest = useRef({ feed, loadMore })
    const pending = useRef(false)

    useEffect(() => {
        latest.current = { feed, loadMore }
    }, [feed, loadMore])

    useEffect(() => {
        const node = element.current
        if (!node || !feed.loaded || feed.allLoaded) return
        const observer = new IntersectionObserver(
            entries => {
                const { feed, loadMore } = latest.current
                if (
                    !entries.some(entry => entry.isIntersecting) ||
                    feed.loading ||
                    pending.current
                )
                    return
                pending.current = true
                const release = () => {
                    pending.current = false
                }
                loadMore(feed).then(release, release)
            },
            { root: node.parentElement }
        )
        observer.observe(node)
        return () => observer.disconnect()
        // Recheck after items arrive, but do not retry a failed page in a loop.
    }, [feed.loaded, feed.allLoaded, feed.iids])

    return feed.loaded && !feed.allLoaded ? (
        <div ref={element} className={classes.root}>
            {feed.loading && (
                <Spinner size="small" aria-label={intl.get("loadMore")} />
            )}
        </div>
    ) : null
}
