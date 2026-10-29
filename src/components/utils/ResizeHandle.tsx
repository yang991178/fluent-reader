import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { makeStyles, mergeClasses } from "@griffel/react"

const useStyles = makeStyles({
    handle: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: "8px",
        zIndex: 1001,
        cursor: "ew-resize",
        touchAction: "none",
        userSelect: "none",
        WebkitAppRegion: "no-drag",
    },
    shield: {
        // Guest webviews must not take the pointer as the divider crosses them.
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        cursor: "ew-resize",
    },
    columnCursor: {
        cursor: "col-resize",
    },
})

type ResizeHandleProps = Readonly<{
    label: string
    width: number
    minWidth: number
    maxWidth: number
    multiplier?: number
    cursor?: "ew-resize" | "col-resize"
    onResize: (width: number) => void
    onResizeEnd: (width: number | null) => void
    styleClass?: string
}>

export function ResizeHandle({
    label,
    width,
    minWidth,
    maxWidth,
    multiplier = 1,
    cursor = "ew-resize",
    onResize,
    onResizeEnd,
    styleClass,
}: ResizeHandleProps) {
    const classes = useStyles()
    const [resizing, setResizing] = useState(false)
    const drag = useRef<{
        pointerId: number
        startX: number
        startWidth: number
        width: number
    }>(null)

    useEffect(
        () => () => {
            const current = drag.current
            if (current) {
                onResizeEnd(
                    current.width === current.startWidth ? null : current.width
                )
            }
        },
        [onResizeEnd]
    )

    const clamp = (value: number) =>
        Math.max(minWidth, Math.min(Math.round(value), maxWidth))

    const finishResize = (event: React.PointerEvent<HTMLDivElement>) => {
        const current = drag.current
        if (current?.pointerId !== event.pointerId) return
        drag.current = null
        setResizing(false)
        onResizeEnd(current.width === current.startWidth ? null : current.width)
    }

    return (
        <>
            {resizing && (
                <div
                    aria-hidden="true"
                    className={mergeClasses(
                        classes.shield,
                        cursor === "col-resize" && classes.columnCursor
                    )}
                    onClick={event => event.stopPropagation()}
                />
            )}
            <div
                className={mergeClasses(
                    classes.handle,
                    cursor === "col-resize" && classes.columnCursor,
                    styleClass
                )}
                role="separator"
                aria-label={label}
                aria-orientation="vertical"
                onClick={event => event.stopPropagation()}
                onPointerDown={event => {
                    if (event.button !== 0 || !event.isPrimary || drag.current)
                        return
                    event.preventDefault()
                    event.stopPropagation()
                    event.currentTarget.setPointerCapture(event.pointerId)
                    drag.current = {
                        pointerId: event.pointerId,
                        startX: event.clientX,
                        startWidth: width,
                        width,
                    }
                    setResizing(true)
                    onResize(width)
                }}
                onPointerMove={event => {
                    const current = drag.current
                    if (!current || current.pointerId !== event.pointerId)
                        return
                    current.width = clamp(
                        current.startWidth +
                            multiplier * (event.clientX - current.startX)
                    )
                    onResize(current.width)
                }}
                onPointerUp={finishResize}
                onPointerCancel={finishResize}
                onLostPointerCapture={finishResize}
            />
        </>
    )
}
