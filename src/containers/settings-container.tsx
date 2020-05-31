import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { exitSettings} from "../scripts/models/app"
import Settings from "../components/settings"

const getApp = (state: RootState) => state.app

const mapStateToProps = createSelector(
    [getApp],
    (app) => ({
    display: app.settings.display,
    blocked: !app.sourceInit || app.fetchingItems,
    exitting: app.settings.saving
}))

const mapDispatchToProps = dispatch => {
    return { 
        close: () => dispatch(exitSettings())
    }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type SettingsReduxProps = typeof connector
export const SettingsContainer = connector(Settings)