import * as React from "react"
import { connect } from 'react-redux'
import { ContextMenuContainer } from "../containers/context-menu-container"
import { closeContextMenu, openTextMenu } from "../scripts/models/app"
import PageContainer from "../containers/page-container"
import MenuContainer from "../containers/menu-container"
import NavContainer from "../containers/nav-container"
import LogMenuContainer from "../containers/log-menu-container"
import SettingsContainer from "../containers/settings-container"

const Root = ({ dispatch }) => (
    <div id="root" 
        onMouseDown={() => dispatch(closeContextMenu())}
        onContextMenu={event => {
            let text = document.getSelection().toString()
            if (text) dispatch(openTextMenu(text, [event.clientX, event.clientY]))
        }}>
        <NavContainer />
        <PageContainer />
        <LogMenuContainer />
        <MenuContainer />
        <SettingsContainer />
        <ContextMenuContainer />
    </div>
)

export default connect()(Root)