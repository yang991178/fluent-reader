import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { fetchItems } from "../scripts/models/item"
import { toggleMenu, toggleLogMenu, toggleSettings, openViewMenu } from "../scripts/models/app"
import { ViewType } from "../scripts/models/page"
import Nav from "../components/nav"

const getState = (state: RootState) => state.app
const getItemShown = (state: RootState) => (state.page.itemId >= 0) && state.page.viewType !== ViewType.List

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
    settings: () => dispatch(toggleSettings())
})

const NavContainer = connect(mapStateToProps, mapDispatchToProps)(Nav)
export default NavContainer