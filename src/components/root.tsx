import * as React from "react"
import { connect } from 'react-redux'
import { FeedContainer } from "../containers/feed-container"
import { ContextMenuContainer } from "../containers/context-menu-container"
import { closeContextMenu } from "../scripts/models/app"
import { MenuContainer } from "../containers/menu-container"
import { NavContainer } from "../containers/nav-container"
import { LogMenuContainer } from "../containers/log-menu-container"
import { SettingsContainer } from "../containers/settings-container"


const Root = ({ dispatch }) => (
    <div id="root" onMouseDown={() => dispatch(closeContextMenu())}>
        <NavContainer />
        <div className="main">
            <FeedContainer />
        </div>
        <LogMenuContainer />
        <MenuContainer />
        <SettingsContainer />
        <ContextMenuContainer />
    </div>
)

export default connect()(Root)