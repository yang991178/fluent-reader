import { useCallback, useState } from "react"

type ResizableWidthOptions = {
    getWidth: () => number
    saveWidth: (width: number) => Promise<void>
    minWidth: number
    maxWidth: number
}

export function useResizableWidth({
    getWidth,
    saveWidth,
    minWidth,
    maxWidth,
}: ResizableWidthOptions) {
    const [preferredWidth, setPreferredWidth] = useState(getWidth)
    const [resizeWidth, setResizeWidth] = useState<number>(null)
    const requestedWidth = resizeWidth ?? preferredWidth
    const maximum = Math.max(minWidth, maxWidth)
    const onResizeEnd = useCallback(
        (width: number | null) => {
            setResizeWidth(null)
            if (width !== null) {
                setPreferredWidth(width)
                saveWidth(width)
            }
        },
        [saveWidth]
    )

    return {
        requestedWidth,
        handleProps: {
            width: Math.max(minWidth, Math.min(requestedWidth, maximum)),
            minWidth,
            maxWidth: maximum,
            onResize: setResizeWidth,
            onResizeEnd,
        },
    }
}
