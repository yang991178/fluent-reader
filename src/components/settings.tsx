import * as React from "react"
import { useEffect, useRef, useCallback } from "react"
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
import { useAppSelector, useAppDispatch } from "../scripts/reducer"
import { exitSettings } from "../scripts/models/app"

const Settings: React.FC = () => {
    const dispatch = useAppDispatch()

    const display = useAppSelector(s => s.app.settings.display)
    const blocked = useAppSelector(
        s =>
            !s.app.sourceInit ||
            s.app.syncing ||
            s.app.fetchingItems ||
            s.app.settings.saving
    )
    const exitting = useAppSelector(s => s.app.settings.saving)

    const exittingRef = useRef(exitting)
    exittingRef.current = exitting

    const close = useCallback(() => dispatch(exitSettings()), [])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !exittingRef.current) close()
        }
        if (display) {
            if (globalThis.utils.platform === "darwin")
                globalThis.utils.destroyTouchBar()
            document.body.addEventListener("keydown", onKeyDown)
        } else if (globalThis.utils.platform === "darwin") {
            initTouchBarWithTexts()
        }
        return () => {
            document.body.removeEventListener("keydown", onKeyDown)
        }
    }, [display])

    return (
        display && (
            <div className="settings-container">
                <div
                    className="btn-group"
                    style={{
                        position: "absolute",
                        top: 70,
                        left: "calc(50% - 404px)",
                    }}>
                    <button
                        className={"btn" + (exitting ? " disabled" : "")}
                        title={intl.get("settings.exit")}
                        aria-label={intl.get("settings.exit")}
                        disabled={exitting}
                        onClick={close}>
                        <Icon iconName="Back" />
                    </button>
                </div>
                <div className={"settings " + AnimationClassNames.slideUpIn20}>
                    {blocked && (
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
    )
}

export default Settings
