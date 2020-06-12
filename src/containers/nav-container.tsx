import { remote } from "electron"
import intl = require("react-intl-universal")
import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { fetchItems, markAllRead } from "../scripts/models/item"
import { toggleMenu, toggleLogMenu, toggleSettings, openViewMenu } from "../scripts/models/app"
import { ViewType } from "../scripts/models/page"
import Nav from "../components/nav"

const getState = (state: RootState) => state.app
const getItemShown = (state: RootState) => state.page.itemId && state.page.viewType !== ViewType.List

const mapStateToProps = createSelector(
    [getState, getItemShown], 
    (state, itemShown) => ({
        state: state,
        itemShown: itemShown
    }
))

const mapDispatchToProps = (dispatch) => ({
    fetch: () => dispatch(fetchItems()),
    menu: () => dispatch(toggleMenu()),
    logs: () => dispatch(toggleLogMenu()),
    views: () => dispatch(openViewMenu()),
    settings: () => dispatch(toggleSettings()),
    markAllRead: () => {
        remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            title: intl.get("nav.markAllRead"),
            message: intl.get("confirmMarkAll"),
            buttons: process.platform === "win32" ? ["Yes", "No"] : [intl.get("confirm"), intl.get("cancel")],
            defaultId: 0,
            cancelId: 1
        }).then(response => {
            if (response.response === 0) {
                dispatch(markAllRead())
            }
        })
    }
})

const NavContainer = connect(mapStateToProps, mapDispatchToProps)(Nav)
export default NavContainer