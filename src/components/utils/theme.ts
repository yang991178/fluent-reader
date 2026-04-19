import {
    makeStyles,
    mergeClasses,
    Theme,
    tokens,
    TreeItemLayoutState,
    webDarkTheme,
    webLightTheme,
} from "@fluentui/react-components"
import { CustomStyleHooksContextValue_unstable } from "@fluentui/react-shared-contexts"

export const customLightTheme: Theme = {
    ...webLightTheme,
    colorSubtleBackgroundLightAlphaHover: "#0001",
    colorSubtleBackgroundLightAlphaPressed: "#0002",
}

export const customDarkTheme: Theme = {
    ...webDarkTheme,
    colorSubtleBackgroundLightAlphaHover: "#fff1",
    colorSubtleBackgroundLightAlphaPressed: "#fff1",
}

const useTreeItemLayoutCursorStyles = makeStyles({
    root: {
        cursor: "default",
    },
    iconBefore: {
        paddingRight: tokens.spacingHorizontalS,
    },
})

export const CUSTOM_STYLE_HOOKS: CustomStyleHooksContextValue_unstable = {
    useTreeItemLayoutStyles_unstable: (state: TreeItemLayoutState) => {
        const styles = useTreeItemLayoutCursorStyles()
        state.root.className = mergeClasses(state.root.className, styles.root)
        if (state.iconBefore != null) {
            state.iconBefore.className = mergeClasses(
                state.iconBefore.className,
                styles.iconBefore
            )
        }
    },
}
