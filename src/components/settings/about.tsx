import * as React from "react"
import { Stack, Link } from "@fluentui/react"
import { openExternal } from "../../scripts/utils"

class AboutTab extends React.Component {
    render = () => (
        <div className="tab-body">
            <Stack className="settings-about" horizontalAlign="center">
                <img src="logo.svg" style={{width: 120, height: 120}} />
                <h3>Fluent Reader</h3>
                <small>版本 0.1.0</small>
                <p className="settings-hint">Copyright © 2020 Haoyuan Liu. All rights reserved.</p>
                <Stack horizontal horizontalAlign="center" tokens={{childrenGap: 8}}>
                    <small><Link onClick={() => openExternal("https://github.com/yang991178/fluent-reader")}>开源项目</Link></small>
                    <small><Link onClick={() => openExternal("https://github.com/yang991178/fluent-reader/issues")}>反馈</Link></small>
                </Stack>
            </Stack>
        </div>
    )
}

export default AboutTab