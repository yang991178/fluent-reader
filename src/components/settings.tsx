import * as React from "react"
import { Icon } from "@fluentui/react/lib/Icon"
import { AnimationClassNames } from "@fluentui/react/lib/Styling"
import { SettingsReduxProps } from "../containers/settings-container"
import AboutTab from "./settings/about"
import { Pivot, PivotItem, Spinner } from "@fluentui/react"
import { SourcesTabContainer } from "../containers/settings/sources-container"
import GroupsTab from "./settings/groups"

type SettingsProps = SettingsReduxProps & {
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
            <div className={"settings " + AnimationClassNames.slideUpIn20}>
                {this.props.blocked && <div className="loading">
                    <Spinner label="正在更新订阅源，请稍候…" />
                </div>}
                <div className="btn-group" style={{position: "absolute", top: 6, left: -64}}>
                    <a className={"btn" + (this.props.exitting ? " disabled" : "")} title="退出设置" onClick={this.props.close}>
                        <Icon iconName="Back" />
                    </a>
                </div>
                <Pivot>
                    <PivotItem headerText="订阅源" itemIcon="Source">
                        <SourcesTabContainer />
                    </PivotItem>
                    <PivotItem headerText="分组与排序" itemIcon="GroupList">
                        <GroupsTab />
                    </PivotItem>
                    <PivotItem headerText="关于" itemIcon="Info">
                        <AboutTab />
                    </PivotItem>
                </Pivot>
            </div>
        </div>
    )
}

export default Settings