import * as React from "react"
import intl from "react-intl-universal"
import { ServiceConfigs, SyncService } from "../../schema-types"
import { Stack, Icon, Link, Dropdown, IDropdownOption } from "@fluentui/react"
import FeverConfigsTab from "./services/fever"

type ServiceTabProps = {
    configs: ServiceConfigs
    save: (configs: ServiceConfigs) => void
    sync: () => Promise<void>
    remove: () => Promise<void>
    blockActions: () => void
    authenticate: (configs: ServiceConfigs) => Promise<boolean>
}

export type ServiceConfigsTabProps = ServiceTabProps & {
    exit: () => void
}

type ServiceTabState = {
    type: SyncService
}

export class ServiceTab extends React.Component<ServiceTabProps, ServiceTabState> {
    constructor(props: ServiceTabProps) {
        super(props)
        this.state = {
            type: props.configs.type
        }
    }

    serviceOptions = (): IDropdownOption[] => [
        { key: SyncService.Fever, text: "Fever API" },
        { key: -1, text: intl.get("service.suggest") },
    ]

    onServiceOptionChange = (_, option: IDropdownOption) => {
        if (option.key === -1) {
            window.utils.openExternal("https://github.com/yang991178/fluent-reader/issues/23")
        } else {
            this.setState({ type: option.key as number })
        }
    }

    exitConfigsTab = () => {
        this.setState({ type: SyncService.None })
    }

    render = () => (
        <div className="tab-body">
            {this.state.type === SyncService.None
            ? (
                <Stack horizontalAlign="center" style={{marginTop: 64}}>
                    <Stack className="settings-rules-icons" horizontal tokens={{childrenGap: 12}}>
                        <Icon iconName="ThisPC" />
                        <Icon iconName="Sync" />
                        <Icon iconName="Cloud" />
                    </Stack>
                    <span className="settings-hint">
                        {intl.get("service.intro")}
                        <Link 
                            onClick={() => window.utils.openExternal("https://github.com/yang991178/fluent-reader/wiki/Support#services")}
                            style={{marginLeft: 6}}>
                            {intl.get("rules.help")}
                        </Link>
                    </span>
                    <Dropdown
                        placeHolder={intl.get("service.select")}
                        options={this.serviceOptions()}
                        selectedKey={null}
                        onChange={this.onServiceOptionChange}
                        style={{marginTop: 32, width: 180}} />
                </Stack>
            )
            : <FeverConfigsTab {...this.props} exit={this.exitConfigsTab} />}
        </div>
    )
}