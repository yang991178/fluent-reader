import * as React from "react"
import { makeStyles, mergeClasses } from "@fluentui/react-components"

const useStyles = makeStyles({
    root: {
        "display": "inline-block",
        "width": "var(--navHeight)",
        "fontSize": "12px",
        "color": "#c8c6c4",
        "textAlign": "center",
        "verticalAlign": "middle",
        "::before": {
            content: '"|"',
        },
    },
})

export interface FlatButtonSeparatorProps {
    styleClass?: string
}

export const FlatButtonSeparator: React.FC<FlatButtonSeparatorProps> = ({
    styleClass,
}) => {
    const classes = useStyles()

    return <span className={mergeClasses(classes.root, styleClass)}></span>
}
