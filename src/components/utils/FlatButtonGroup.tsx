import * as React from "react"
import { makeStyles, mergeClasses } from "@fluentui/react-components"

const useStyles = makeStyles({
    root: {
        display: "inline-block",
        userSelect: "none",
        WebkitAppRegion: "no-drag",
    },
})

export interface FlatButtonGroupProps {
    children: React.ReactNode
    styleClass?: string
}

export const FlatButtonGroup: React.FC<FlatButtonGroupProps> = ({
    children,
    styleClass,
}) => {
    const classes = useStyles()

    return (
        <div className={mergeClasses(classes.root, styleClass)}>{children}</div>
    )
}
