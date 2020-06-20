import * as React from "react"
import intl = require("react-intl-universal")
import { Icon } from "@fluentui/react/lib/Icon"
import { AnimationClassNames } from "@fluentui/react/lib/Styling"
import AboutTab from "./settings/about"
import { Pivot, PivotItem, Spinner } from "@fluentui/react"
import SourcesTabContainer from "../containers/settings/sources-container"
import GroupsTabContainer from "../containers/settings/groups-container"
import AppTabContainer from "../containers/settings/app-container"

type SettingsProps = {
    display: boolean,
    blocked: boolean,
    exitting: boolean,
    close: () => void
}

class Settings extends React.Component<SettingsProps> { 
    constructor(props){ 
        super(props)
    }

    render = () => this.props.display && (
        <div className="settings-container">
            <div className="btn-group" style={{position: "absolute", top: 70, left: "calc(50% - 404px)"}}>
                <a className={"btn" + (this.props.exitting ? " disabled" : "")} title={intl.get("settings.exit")} onClick={this.props.close}>
                    <Icon iconName="Back" />
                </a>
            </div>
            <div className={"settings " + AnimationClassNames.slideUpIn20}>
                {this.props.blocked && <div className="loading">
                    <Spinner label={intl.get("settings.fetching")} />
                </div>}
                <Pivot>
                    <PivotItem headerText={intl.get("settings.sources")} itemIcon="Source">
                        <SourcesTabContainer />
                    </PivotItem>
                    <PivotItem headerText={intl.get("settings.grouping")} itemIcon="GroupList">
                        <GroupsTabContainer />
                    </PivotItem>
                    <PivotItem headerText={intl.get("settings.app")} itemIcon="Settings">
                        <AppTabContainer />
                    </PivotItem>
                    <PivotItem headerText={intl.get("settings.about")} itemIcon="Info">
                        <AboutTab />
                    </PivotItem>
                </Pivot>
            </div>
        </div>
    )
}

export default Settings