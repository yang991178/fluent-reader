import { CSSProperties, useEffect, useState } from "react"
import { ARTICLE_OVERLAY_MIN_WIDTH } from "../../../schema-types"
import { useResizableWidth } from "./useResizableWidth"

// Each side has a 48px navigation button, an 8px gap and a 10px outer margin.
const NAVIGATION_SPACE = 132

export function useArticleOverlayWidth() {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)
    const { requestedWidth, handleProps } = useResizableWidth({
        getWidth: window.settings.getArticleOverlayWidth,
        saveWidth: window.settings.setArticleOverlayWidth,
        minWidth: ARTICLE_OVERLAY_MIN_WIDTH,
        maxWidth: windowWidth - NAVIGATION_SPACE,
    })

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return {
        style: {
            "--article-overlay-width": `min(${requestedWidth}px, calc(100vw - ${NAVIGATION_SPACE}px))`,
        } as CSSProperties,
        handleProps,
    }
}
