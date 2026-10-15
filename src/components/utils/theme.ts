import {
    ButtonState,
    FieldState,
    LabelState,
    makeStyles,
    mergeClasses,
    MessageBarState,
    Theme,
    tokens,
    TreeItemLayoutState,
    webDarkTheme,
    webLightTheme,
} from "@fluentui/react-components"
import { brandWeb, createV8Theme } from "@fluentui/react-migration-v8-v9"
import { ITheme } from "@fluentui/react"
import { CustomStyleHooksContextValue_unstable } from "@fluentui/react-shared-contexts"

export const customLightTheme: Theme = {
    ...webLightTheme,
    colorSubtleBackgroundLightAlphaHover: "#0001",
    colorSubtleBackgroundLightAlphaPressed: "#0002",
}

export const customDarkTheme: Theme = {
    ...webDarkTheme,
    colorNeutralBackground1: "#1f1f1f",
    colorSubtleBackgroundLightAlphaHover: "#fff1",
    colorSubtleBackgroundLightAlphaPressed: "#fff1",
}

export type AppThemeBundle = {
    v8Theme: ITheme
    v9Theme: Theme
}

export function createAppTheme(
    isDarkTheme: boolean,
    fontFamily: string
): AppThemeBundle {
    const baseTheme = isDarkTheme ? customDarkTheme : customLightTheme
    const v9Theme: Theme = {
        ...baseTheme,
        fontFamilyBase: fontFamily,
    }
    const baseV8Theme = createV8Theme(brandWeb, v9Theme, isDarkTheme)
    const v8Theme: ITheme = isDarkTheme
        ? {
              ...baseV8Theme,
              palette: {
                  ...baseV8Theme.palette,
                  white: "#1f1f1f",
                  black: "#f8f8f8",
              },
          }
        : baseV8Theme
    return {
        v8Theme,
        v9Theme,
    }
}

const useTreeItemLayoutStyles = makeStyles({
    root: {
        cursor: "default",
    },
    iconBefore: {
        paddingRight: tokens.spacingHorizontalS,
    },
})
const useButtonStyles = makeStyles({
    root: {
        "cursor": "default",
        // Fluent injects its hover styles after our extracted stylesheet.
        "&.fui-Button, &.fui-ToggleButton": {
            ":hover": {
                cursor: "default",
            },
            ":hover:active": {
                cursor: "default",
            },
            ":active:focus-visible": {
                cursor: "default",
            },
        },
    },
})
const useMessageBarStyles = makeStyles({
    root: {
        userSelect: "none",
    },
})
const useLabelStyles = makeStyles({
    root: {
        userSelect: "none",
    },
})
const useFieldStyles = makeStyles({
    label: {
        fontWeight: tokens.fontWeightSemibold,
    },
})

function useButtonStylesOverride(state: ButtonState) {
    const styles = useButtonStyles()
    state.root.className = mergeClasses(state.root.className, styles.root)
}

export const CUSTOM_STYLE_HOOKS: CustomStyleHooksContextValue_unstable = {
    useButtonStyles_unstable: useButtonStylesOverride,
    useToggleButtonStyles_unstable: useButtonStylesOverride,
    useMessageBarStyles_unstable: (state: MessageBarState) => {
        const styles = useMessageBarStyles()
        state.root.className = mergeClasses(state.root.className, styles.root)
    },
    useTreeItemLayoutStyles_unstable: (state: TreeItemLayoutState) => {
        const styles = useTreeItemLayoutStyles()
        state.root.className = mergeClasses(state.root.className, styles.root)
        if (state.iconBefore != null) {
            state.iconBefore.className = mergeClasses(
                state.iconBefore.className,
                styles.iconBefore
            )
        }
    },
    useLabelStyles_unstable: (state: LabelState) => {
        const styles = useLabelStyles()
        state.root.className = mergeClasses(state.root.className, styles.root)
    },
    useFieldStyles_unstable: (state: FieldState) => {
        const styles = useFieldStyles()
        if (state.label != null) {
            state.label.className = mergeClasses(
                state.label.className,
                styles.label
            )
        }
    },
}
