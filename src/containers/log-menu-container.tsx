import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { toggleLogMenu } from "../scripts/models/app"
import LogMenu from "../components/log-menu"

const getLogs = (state: RootState) => state.app.logMenu

const mapStateToProps = createSelector(getLogs, logs => logs)

const mapDispatchToProps = dispatch => {
    return { close: () => dispatch(toggleLogMenu()) }
}

const connector = connect(mapStateToProps, mapDispatchToProps)
export type LogsReduxProps = typeof connector
export const LogMenuContainer = connector(LogMenu)