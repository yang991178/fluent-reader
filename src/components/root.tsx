import * as React from "react"
import { connect } from "react-redux"
import { ContextMenuContainer } from "../containers/context-menu-container"
import { closeContextMenu } from "../scripts/models/app"
import PageContainer from "../containers/page-container"
import MenuContainer from "../containers/menu-container"
import NavContainer from "../containers/nav-container"
import LogMenuContainer from "../containers/log-menu-container"
import SettingsContainer from "../containers/settings-container"
import { RootState } from "../scripts/reducer"

const Root = ({ locale, dispatch }) =>
    locale && (
        <div
            id="root"
            key={locale}
            onMouseDown={() => dispatch(closeContextMenu())}>
            <NavContainer />
            <PageContainer />
            <LogMenuContainer />
            <MenuContainer />
            <SettingsContainer />
            <ContextMenuContainer />
        </div>
    )

const getLocale = (state: RootState) => ({ locale: state.app.locale })
export default connect(getLocale)(Root)
