import * as React from "react"
import intl from "react-intl-universal"
import { ServiceConfigs, SyncService } from "../../schema-types"
import { Stack, Icon, Link, Dropdown, IDropdownOption } from "@fluentui/react"

export type ServiceTabProps = {
    configs: ServiceConfigs
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

        }
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
            : null}
        </div>
    )
}