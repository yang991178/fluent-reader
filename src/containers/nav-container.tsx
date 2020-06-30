import intl from "react-intl-universal"
import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { fetchItems, markAllRead } from "../scripts/models/item"
import { toggleMenu, toggleLogMenu, toggleSettings, openViewMenu } from "../scripts/models/app"
import { toggleSearch } from "../scripts/models/page"
import { ViewType } from "../schema-types"
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
    search: () => dispatch(toggleSearch()),
    markAllRead: () => {
        window.utils.showMessageBox(
            intl.get("nav.markAllRead"),
            intl.get("confirmMarkAll"),
            intl.get("confirm"), intl.get("cancel")
        ).then(response => {
            if (response) {
                dispatch(markAllRead())
            }
        })
    }
})

const NavContainer = connect(mapStateToProps, mapDispatchToProps)(Nav)
export default NavContainer