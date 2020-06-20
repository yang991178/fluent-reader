import * as React from "react"
import intl = require("react-intl-universal")
import { Stack, Link } from "@fluentui/react"
import { openExternal } from "../../scripts/utils"
import { remote } from "electron"

class AboutTab extends React.Component {
    render = () => (
        <div className="tab-body">
            <Stack className="settings-about" horizontalAlign="center">
                <img src="icons/logo.svg" style={{width: 120, height: 120}} />
                <h3>Fluent Reader</h3>
                <small>{intl.get("settings.version")} {remote.app.getVersion()}</small>
                <p className="settings-hint">Copyright © 2020 Haoyuan Liu. All rights reserved.</p>
                <Stack horizontal horizontalAlign="center" tokens={{childrenGap: 12}}>
                    <small><Link onClick={() => openExternal("https://github.com/yang991178/fluent-reader")}>{intl.get("settings.openSource")}</Link></small>
                    <small><Link onClick={() => openExternal("https://github.com/yang991178/fluent-reader/issues")}>{intl.get("settings.feedback")}</Link></small>
                </Stack>
            </Stack>
        </div>
    )
}

export default AboutTab