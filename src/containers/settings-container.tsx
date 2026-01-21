import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { exitSettings } from "../scripts/models/app"
import { stopFetchItems } from "../scripts/models/item"
import Settings from "../components/settings"

const getApp = (state: RootState) => state.app

const mapStateToProps = createSelector([getApp], app => ({
    display: app.settings.display,
    blocked:
        !app.sourceInit ||
        app.syncing ||
        app.fetchingItems ||
        app.settings.saving,
    exitting: app.settings.saving,
}))

const mapDispatchToProps = dispatch => {
    return {
        close: () => dispatch(exitSettings()),
        stopFetch: () => dispatch(stopFetchItems()),
    }
}

const SettingsContainer = connect(mapStateToProps, mapDispatchToProps)(Settings)
export default SettingsContainer
