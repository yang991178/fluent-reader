import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { fetchItems } from "../scripts/models/item"
import { openMenu, toggleLogMenu, toggleSettings } from "../scripts/models/app"
import Nav from "../components/nav"

const getState = (state: RootState) => state.app

const mapStateToProps = createSelector(getState, (state) => ({
    state: state
}))

const mapDispatchToProps = (dispatch) => ({
    fetch: () => dispatch(fetchItems()),
    menu: () => dispatch(openMenu()),
    logs: () => dispatch(toggleLogMenu()),
    settings: () => dispatch(toggleSettings())
})

const connector = connect(mapStateToProps, mapDispatchToProps)
export type NavReduxProps = typeof connector
export const NavContainer = connector(Nav)