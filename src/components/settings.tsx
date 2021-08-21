import * as React from "react"
import intl from "react-intl-universal"
import { Icon } from "@fluentui/react/lib/Icon"
import { AnimationClassNames } from "@fluentui/react/lib/Styling"
import AboutTab from "./settings/about"
import { Pivot, PivotItem, Spinner, FocusTrapZone } from "@fluentui/react"
import SourcesTabContainer from "../containers/settings/sources-container"
import GroupsTabContainer from "../containers/settings/groups-container"
import AppTabContainer from "../containers/settings/app-container"
import RulesTabContainer from "../containers/settings/rules-container"
import ServiceTabContainer from "../containers/settings/service-container"
import { initTouchBarWithTexts } from "../scripts/utils"

type SettingsProps = {
    display: boolean
    blocked: boolean
    exitting: boolean
    close: () => void
}

class Settings extends React.Component<SettingsProps> {
    constructor(props) {
        super(props)
    }

    onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !this.props.exitting) this.props.close()
    }

    componentDidUpdate = (prevProps: SettingsProps) => {
        if (this.props.display !== prevProps.display) {
            if (this.props.display) {
                if (window.utils.platform === "darwin")
                    window.utils.destroyTouchBar()
                document.body.addEventListener("keydown", this.onKeyDown)
            } else {
                if (window.utils.platform === "darwin") initTouchBarWithTexts()
                document.body.removeEventListener("keydown", this.onKeyDown)
            }
        }
    }

    render = () =>
        this.props.display && (
            <div className="settings-container">
                <div
                    className="btn-group"
                    style={{
                        position: "absolute",
                        top: 70,
                        left: "calc(50% - 404px)",
                    }}>
                    <a
                        className={
                            "btn" + (this.props.exitting ? " disabled" : "")
                        }
                        title={intl.get("settings.exit")}
                        onClick={this.props.close}>
                        <Icon iconName="Back" />
                    </a>
                </div>
                <div className={"settings " + AnimationClassNames.slideUpIn20}>
                    {this.props.blocked && (
                        <FocusTrapZone
                            isClickableOutsideFocusTrap={true}
                            className="loading">
                            <Spinner
                                label={intl.get("settings.fetching")}
                                tabIndex={0}
                            />
                        </FocusTrapZone>
                    )}
                    <Pivot>
                        <PivotItem
                            headerText={intl.get("settings.sources")}
                            itemIcon="Source">
                            <SourcesTabContainer />
                        </PivotItem>
                        <PivotItem
                            headerText={intl.get("settings.grouping")}
                            itemIcon="GroupList">
                            <GroupsTabContainer />
                        </PivotItem>
                        <PivotItem
                            headerText={intl.get("settings.rules")}
                            itemIcon="FilterSettings">
                            <RulesTabContainer />
                        </PivotItem>
                        <PivotItem
                            headerText={intl.get("settings.service")}
                            itemIcon="CloudImportExport">
                            <ServiceTabContainer />
                        </PivotItem>
                        <PivotItem
                            headerText={intl.get("settings.app")}
                            itemIcon="Settings">
                            <AppTabContainer />
                        </PivotItem>
                        <PivotItem
                            headerText={intl.get("settings.about")}
                            itemIcon="Info">
                            <AboutTab />
                        </PivotItem>
                    </Pivot>
                </div>
            </div>
        )
}

export default Settings
