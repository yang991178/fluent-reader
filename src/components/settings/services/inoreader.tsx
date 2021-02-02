import * as React from "react"
import intl from "react-intl-universal"
import { ServiceConfigsTabProps } from "../service"
import { GReaderConfigs } from "../../../scripts/models/services/greader"
import { SyncService } from "../../../schema-types"
import { Stack, Label, TextField, PrimaryButton, DefaultButton, Checkbox, 
    MessageBar, MessageBarType, Dropdown, IDropdownOption, MessageBarButton, Link } from "@fluentui/react"
import DangerButton from "../../utils/danger-button"
import LiteExporter from "./lite-exporter"

type GReaderConfigsTabState = {
    existing: boolean
    endpoint: string
    username: string
    password: string
    apiId: string
    apiKey: string
    removeAd: boolean
    fetchLimit: number
}

const endpointOptions: IDropdownOption[] = [
    "https://www.inoreader.com",
    "https://www.innoreader.com",
    "https://jp.inoreader.com"
].map(s => ({ key: s, text: s }))

const openSupport = () => window.utils.openExternal("https://github.com/yang991178/fluent-reader/wiki/Support#inoreader")

class InoreaderConfigsTab extends React.Component<ServiceConfigsTabProps, GReaderConfigsTabState> {
    constructor(props: ServiceConfigsTabProps) {
        super(props)
        const configs = props.configs as GReaderConfigs
        this.state = {
            existing: configs.type === SyncService.Inoreader,
            endpoint: configs.endpoint || "https://www.inoreader.com",
            username: configs.username || "",
            password: "",
            apiId: configs.inoreaderId || "",
            apiKey: configs.inoreaderKey || "",
            removeAd: configs.removeInoreaderAd === undefined ? true : configs.removeInoreaderAd,
            fetchLimit: configs.fetchLimit || 250,
        }
    }

    fetchLimitOptions = (): IDropdownOption[] => [
        { key: 250, text: intl.get("service.fetchLimitNum", { count: 250 }) },
        { key: 500, text: intl.get("service.fetchLimitNum", { count: 500 }) },
        { key: 750, text: intl.get("service.fetchLimitNum", { count: 750 }) },
        { key: 1000, text: intl.get("service.fetchLimitNum", { count: 1000 }) },
    ]
    onFetchLimitOptionChange = (_, option: IDropdownOption) => {
        this.setState({ fetchLimit: option.key as number })
    }
    onEndpointChange = (_, option: IDropdownOption) => {
        this.setState({ endpoint: option.key as string })
    }

    handleInputChange = (event) => {
        const name: string = event.target.name
        // @ts-expect-error
        this.setState({[name]: event.target.value})
    }

    checkNotEmpty = (v: string) => {
        return (!this.state.existing && v.length == 0) ? intl.get("emptyField") : ""
    }

    validateForm = () => {
        return (this.state.existing || (this.state.username && this.state.password))
            && this.state.apiId && this.state.apiKey
    }

    save = async () => {
        let configs: GReaderConfigs
        if (this.state.existing) {
            configs = {
                ...this.props.configs,
                endpoint: this.state.endpoint,
                fetchLimit: this.state.fetchLimit,
                inoreaderId: this.state.apiId,
                inoreaderKey: this.state.apiKey,
                removeInoreaderAd: this.state.removeAd,
            } as GReaderConfigs
            if (this.state.password) configs.password = this.state.password
        } else {
            configs = {
                type: SyncService.Inoreader,
                endpoint: this.state.endpoint,
                username: this.state.username,
                password: this.state.password,
                inoreaderId: this.state.apiId,
                inoreaderKey: this.state.apiKey,
                removeInoreaderAd: this.state.removeAd,
                fetchLimit: this.state.fetchLimit,
                importGroups: true,
                useInt64: true
            }
        }
        this.props.blockActions()
        configs = await this.props.reauthenticate(configs) as GReaderConfigs
        const valid = await this.props.authenticate(configs)
        if (valid) {
            this.props.save(configs)
            this.setState({ existing: true })
            this.props.sync()
        } else {
            this.props.blockActions()
            window.utils.showErrorBox(intl.get("service.failure"), intl.get("service.failureHint"))
        }
    }

    createKey = () => window.utils.openExternal(this.state.endpoint + "/all_articles#preferences-developer")

    remove = async () => {
        this.props.exit()
        await this.props.remove()
    }

    render() {
        return <>
            <MessageBar messageBarType={MessageBarType.severeWarning}
                isMultiline={false}
                actions={<MessageBarButton text={intl.get("create")} onClick={this.createKey} />}>
                {intl.get("service.rateLimitWarning")}
                <Link onClick={openSupport} style={{marginLeft: 6}}>{intl.get("rules.help")}</Link>
            </MessageBar>
            {!this.state.existing && (
                <MessageBar messageBarType={MessageBarType.warning}>{intl.get("service.overwriteWarning")}</MessageBar>
            )}
            <Stack horizontalAlign="center" style={{marginTop: 48}}>
                <svg style={{fill: "var(--black)", width: 36, userSelect: "none"}} viewBox="0 0 72 72"><path transform="translate(-1250.000000, -1834.000000)" d="M1286,1834 C1305.88225,1834 1322,1850.11775 1322,1870 C1322,1889.88225 1305.88225,1906 1286,1906 C1266.11775,1906 1250,1889.88225 1250,1870 C1250,1850.11775 1266.11775,1834 1286,1834 Z M1278.01029,1864.98015 C1270.82534,1864.98015 1265,1870.80399 1265,1877.98875 C1265,1885.17483 1270.82534,1891 1278.01029,1891 C1285.19326,1891 1291.01859,1885.17483 1291.01859,1877.98875 C1291.01859,1870.80399 1285.19326,1864.98015 1278.01029,1864.98015 Z M1281.67908,1870.54455 C1283.73609,1870.54455 1285.40427,1872.21533 1285.40427,1874.2703 C1285.40427,1876.33124 1283.73609,1877.9987 1281.67908,1877.9987 C1279.61941,1877.9987 1277.94991,1876.33124 1277.94991,1874.2703 C1277.94991,1872.21533 1279.61941,1870.54455 1281.67908,1870.54455 Z M1278.01003,1855.78714 L1278.01003,1860.47435 C1287.66605,1860.47435 1295.52584,1868.33193 1295.52584,1877.98901 L1295.52584,1877.98901 L1300.21451,1877.98901 C1300.21451,1865.74746 1290.25391,1855.78714 1278.01003,1855.78714 L1278.01003,1855.78714 Z M1278.01009,1846 L1278.01009,1850.68721 C1285.30188,1850.68721 1292.15771,1853.5278 1297.31618,1858.68479 C1302.47398,1863.84179 1305.31067,1870.69942 1305.31067,1877.98901 L1305.31067,1877.98901 L1310,1877.98901 C1310,1869.44534 1306.67162,1861.41192 1300.6293,1855.36845 C1294.58632,1849.32696 1286.55533,1846 1278.01009,1846 L1278.01009,1846 Z"></path></svg>
                <Label style={{margin: "8px 0 36px"}}>Inoreader</Label>
                <Stack className="login-form" horizontal>
                    <Stack.Item>
                        <Label>{intl.get("service.endpoint")}</Label>
                    </Stack.Item>
                    <Stack.Item grow>
                        <Dropdown
                            options={endpointOptions}
                            selectedKey={this.state.endpoint}
                            onChange={this.onEndpointChange} />
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
                            onChange={this.handleInputChange} />
                    </Stack.Item>
                </Stack>
                <Stack className="login-form" horizontal>
                    <Stack.Item>
                        <Label>{intl.get("service.password")}</Label>
                    </Stack.Item>
                    <Stack.Item grow>
                        <TextField
                            type="password"
                            placeholder={this.state.existing ? intl.get("service.unchanged") : ""}
                            onGetErrorMessage={this.checkNotEmpty} 
                            validateOnLoad={false}
                            name="password"
                            value={this.state.password}
                            onChange={this.handleInputChange} />
                    </Stack.Item>
                </Stack>
                <Stack className="login-form" horizontal>
                    <Stack.Item>
                        <Label>API ID</Label>
                    </Stack.Item>
                    <Stack.Item grow>
                    <TextField
                            onGetErrorMessage={this.checkNotEmpty} 
                            validateOnLoad={false}
                            name="apiId"
                            value={this.state.apiId}
                            onChange={this.handleInputChange} />
                    </Stack.Item>
                </Stack>
                <Stack className="login-form" horizontal>
                    <Stack.Item>
                        <Label>API Key</Label>
                    </Stack.Item>
                    <Stack.Item grow>
                    <TextField
                            onGetErrorMessage={this.checkNotEmpty} 
                            validateOnLoad={false}
                            name="apiKey"
                            value={this.state.apiKey}
                            onChange={this.handleInputChange} />
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
                            onChange={this.onFetchLimitOptionChange} />
                    </Stack.Item>
                </Stack>
                <Checkbox 
                    label={intl.get("service.removeAd")} 
                    checked={this.state.removeAd}
                    onChange={(_, c) => this.setState({removeAd: c})} />
                <Stack horizontal style={{marginTop: 32}}>
                    <Stack.Item>
                        <PrimaryButton 
                            disabled={!this.validateForm()}
                            onClick={this.save}
                            text={this.state.existing ? intl.get("edit") : intl.get("confirm")} />
                    </Stack.Item>
                    <Stack.Item>
                        {this.state.existing 
                            ? <DangerButton onClick={this.remove} text={intl.get("delete")} />
                            : <DefaultButton onClick={this.props.exit} text={intl.get("cancel")} />
                        }
                    </Stack.Item>
                </Stack>
                { this.state.existing && <LiteExporter serviceConfigs={this.props.configs} /> }
            </Stack>
        </>
    }
}

export default InoreaderConfigsTab