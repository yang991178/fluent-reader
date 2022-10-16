import * as React from "react"
import intl from "react-intl-universal"
import { ServiceConfigsTabProps } from "../service"
import { NextcloudConfigs } from "../../../scripts/models/services/nextcloud"
import { SyncService } from "../../../schema-types"
import {
    Stack,
    Icon,
    Label,
    TextField,
    PrimaryButton,
    DefaultButton,
    Checkbox,
    MessageBar,
    MessageBarType,
    Dropdown,
    IDropdownOption,
} from "@fluentui/react"
import DangerButton from "../../utils/danger-button"
import { urlTest } from "../../../scripts/utils"

type NextcloudConfigsTabState = {
    existing: boolean
    endpoint: string
    username: string
    password: string
    fetchLimit: number
    importGroups: boolean
}

class NextcloudConfigsTab extends React.Component<
    ServiceConfigsTabProps,
    NextcloudConfigsTabState
> {
    constructor(props: ServiceConfigsTabProps) {
        super(props)
        const configs = props.configs as NextcloudConfigs
        this.state = {
            existing: configs.type === SyncService.Nextcloud,
            endpoint: configs.endpoint || "https://nextcloud.com/",
            username: configs.username || "",
            password: "",
            fetchLimit: configs.fetchLimit || 250,
            importGroups: true,
        }
    }

    fetchLimitOptions = (): IDropdownOption[] => [
        { key: 250, text: intl.get("service.fetchLimitNum", { count: 250 }) },
        { key: 500, text: intl.get("service.fetchLimitNum", { count: 500 }) },
        { key: 750, text: intl.get("service.fetchLimitNum", { count: 750 }) },
        { key: 1000, text: intl.get("service.fetchLimitNum", { count: 1000 }) },
        { key: 1500, text: intl.get("service.fetchLimitNum", { count: 1500 }) },
        {
            key: Number.MAX_SAFE_INTEGER,
            text: intl.get("service.fetchUnlimited"),
        },
    ]
    onFetchLimitOptionChange = (_, option: IDropdownOption) => {
        this.setState({ fetchLimit: option.key as number })
    }

    handleInputChange = event => {
        const name: string = event.target.name
        // @ts-expect-error
        this.setState({ [name]: event.target.value })
    }

    checkNotEmpty = (v: string) => {
        return !this.state.existing && v.length == 0
            ? intl.get("emptyField")
            : ""
    }

    validateForm = () => {
        return (
            urlTest(this.state.endpoint.trim()) &&
            (this.state.existing ||
                (this.state.username && this.state.password))
        )
    }

    save = async () => {
        let configs: NextcloudConfigs
        if (this.state.existing) {
            configs = {
                ...this.props.configs,
                endpoint: this.state.endpoint,
                fetchLimit: this.state.fetchLimit,
            } as NextcloudConfigs
            if (this.state.password) configs.password = this.state.password
        } else {
            configs = {
                type: SyncService.Nextcloud,
                endpoint: this.state.endpoint + "index.php/apps/news/api/v1-3",
                username: this.state.username,
                password: this.state.password,
                fetchLimit: this.state.fetchLimit,
            }
            if (this.state.importGroups) configs.importGroups = true
        }
        this.props.blockActions()
        const valid = await this.props.authenticate(configs)
        if (valid) {
            this.props.save(configs)
            this.setState({ existing: true })
            this.props.sync()
        } else {
            this.props.blockActions()
            window.utils.showErrorBox(
                intl.get("service.failure"),
                intl.get("service.failureHint")
            )
        }
    }

    remove = async () => {
        this.props.exit()
        await this.props.remove()
    }

    render() {
        return (
            <>
                {!this.state.existing && (
                    <MessageBar messageBarType={MessageBarType.warning}>
                        {intl.get("service.overwriteWarning")}
                    </MessageBar>
                )}
                <Stack horizontalAlign="center" style={{ marginTop: 48 }}>
                    <Icon
                        iconName="AlignLeft"
                        style={{
                            color: "var(--black)",
                            fontSize: 32,
                            userSelect: "none",
                        }}
                    />
                    <Label style={{ margin: "8px 0 36px" }}>Nextcloud</Label>
                    <Stack className="login-form" horizontal>
                        <Stack.Item>
                            <Label>{intl.get("service.endpoint")}</Label>
                        </Stack.Item>
                        <Stack.Item grow>
                            <TextField
                                onGetErrorMessage={v =>
                                    urlTest(v.trim())
                                        ? ""
                                        : intl.get("sources.badUrl")
                                }
                                validateOnLoad={false}
                                name="endpoint"
                                value={this.state.endpoint}
                                onChange={this.handleInputChange}
                            />
                        </Stack.Item>
                    </Stack>
                    <Stack className="login-form" horizontal>
                        <Stack.Item>
                            <Label>{intl.get("service.username")}</Label>
                        </Stack.Item>
                        <Stack.Item grow>
                            <TextField
                                disabled={this.state.existing}
                                onGetErrorMessage={this.checkNotEmpty}
                                validateOnLoad={false}
                                name="username"
                                value={this.state.username}
                                onChange={this.handleInputChange}
                            />
                        </Stack.Item>
                    </Stack>
                    <Stack className="login-form" horizontal>
                        <Stack.Item>
                            <Label>{intl.get("service.password")}</Label>
                        </Stack.Item>
                        <Stack.Item grow>
                            <TextField
                                type="password"
                                placeholder={
                                    this.state.existing
                                        ? intl.get("service.unchanged")
                                        : ""
                                }
                                onGetErrorMessage={this.checkNotEmpty}
                                validateOnLoad={false}
                                name="password"
                                value={this.state.password}
                                onChange={this.handleInputChange}
                            />
                        </Stack.Item>
                    </Stack>
                    <Stack className="login-form" horizontal>
                        <Stack.Item>
                            <Label>{intl.get("service.fetchLimit")}</Label>
                        </Stack.Item>
                        <Stack.Item grow>
                            <Dropdown
                                options={this.fetchLimitOptions()}
                                selectedKey={this.state.fetchLimit}
                                onChange={this.onFetchLimitOptionChange}
                            />
                        </Stack.Item>
                    </Stack>
                    {!this.state.existing && (
                        <Checkbox
                            label={intl.get("service.importGroups")}
                            checked={this.state.importGroups}
                            onChange={(_, c) =>
                                this.setState({ importGroups: c })
                            }
                        />
                    )}
                    <Stack horizontal style={{ marginTop: 32 }}>
                        <Stack.Item>
                            <PrimaryButton
                                disabled={!this.validateForm()}
                                onClick={this.save}
                                text={
                                    this.state.existing
                                        ? intl.get("edit")
                                        : intl.get("confirm")
                                }
                            />
                        </Stack.Item>
                        <Stack.Item>
                            {this.state.existing ? (
                                <DangerButton
                                    onClick={this.remove}
                                    text={intl.get("delete")}
                                />
                            ) : (
                                <DefaultButton
                                    onClick={this.props.exit}
                                    text={intl.get("cancel")}
                                />
                            )}
                        </Stack.Item>
                    </Stack>
                </Stack>
            </>
        )
    }
}

export default NextcloudConfigsTab
