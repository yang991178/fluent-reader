import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { toggleLogMenu } from "../scripts/models/app"
import LogMenu from "../components/log-menu"
import { showItemFromId } from "../scripts/models/page"

const getLogs = (state: RootState) => state.app.logMenu

const mapStateToProps = createSelector(getLogs, logs => logs)

const mapDispatchToProps = dispatch => {
    return {
        close: () => dispatch(toggleLogMenu()),
        showItem: (iid: number) => dispatch(showItemFromId(iid)),
    }
}

const LogMenuContainer = connect(mapStateToProps, mapDispatchToProps)(LogMenu)
export default LogMenuContainer
