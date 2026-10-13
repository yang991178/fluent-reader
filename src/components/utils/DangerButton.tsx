import * as React from "react"
import { useEffect, useState } from "react"
import intl from "react-intl-universal"
import { Button, ButtonProps, tokens } from "@fluentui/react-components"
import { makeStyles, mergeClasses } from "@griffel/react"

const useStyles = makeStyles({
    danger: {
        "&.fui-Button": {
            "backgroundColor": tokens.colorStatusDangerBackground3,
            "color": tokens.colorNeutralForegroundOnBrand,
            ":hover": {
                backgroundColor: tokens.colorStatusDangerBackground3Hover,
            },
            ":active": {
                backgroundColor: tokens.colorStatusDangerBackground3Pressed,
            },
        },
    },
})

export type DangerButtonProps = Omit<
    Extract<ButtonProps, { as?: "button" }>,
    "appearance" | "as" | "children"
> & {
    text: string
    styleClass?: string
}

export const DangerButton = React.forwardRef<
    HTMLButtonElement,
    DangerButtonProps
>(function DangerButton(
    {
        text,
        disabled,
        disabledFocusable,
        styleClass,
        className,
        onClick,
        type = "button",
        ...props
    },
    ref
) {
    const styles = useStyles()
    const [confirming, setConfirming] = useState(false)

    useEffect(() => {
        if (!confirming) return
        const timer = setTimeout(() => setConfirming(false), 5000)
        return () => clearTimeout(timer)
    }, [confirming])

    return (
        <Button
            {...props}
            as="button"
            ref={ref}
            appearance="primary"
            type={type}
            disabled={disabled}
            disabledFocusable={disabledFocusable}
            className={mergeClasses(
                !disabled && !disabledFocusable && styles.danger,
                className,
                styleClass
            )}
            onClick={event => {
                if (disabled || disabledFocusable) return
                if (confirming) {
                    setConfirming(false)
                    onClick?.(event)
                } else setConfirming(true)
            }}>
            {confirming
                ? intl.get("dangerButton", { action: text.toLowerCase() })
                : text}
        </Button>
    )
})
