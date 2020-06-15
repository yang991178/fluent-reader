import * as React from "react"
import intl = require("react-intl-universal")
import { urlTest, byteToMB, calculateItemSize } from "../../scripts/utils"
import { getProxy, getProxyStatus, toggleProxyStatus, setProxy, getThemeSettings, setThemeSettings, ThemeSettings, getLocaleSettings, exportAll } from "../../scripts/settings"
import { Stack, Label, Toggle, TextField, DefaultButton, ChoiceGroup, IChoiceGroupOption, loadTheme, Dropdown, IDropdownOption, PrimaryButton } from "@fluentui/react"
import { remote } from "electron"
import DangerButton from "../utils/danger-button"

type AppTabProps = {
    setLanguage: (option: string) => void
    deleteArticles: (days: number) => Promise<void>
    importAll: () => void
}

type AppTabState = {
    pacStatus: boolean
    pacUrl: string
    themeSettings: ThemeSettings
    itemSize: string
    cacheSize: string
    deleteIndex: string
}

class AppTab extends React.Component<AppTabProps, AppTabState> {
    constructor(props) {
        super(props)
        this.state = {
            pacStatus: getProxyStatus(),
            pacUrl: getProxy(),
            themeSettings: getThemeSettings(),
            itemSize: null,
            cacheSize: null,
            deleteIndex: null
        }
        this.getItemSize()
        this.getCacheSize()
    }

    getCacheSize = () => {
        remote.session.defaultSession.getCacheSize().then(size => {
            this.setState({ cacheSize: byteToMB(size) })
        })
    }
    getItemSize = () => {
        calculateItemSize().then((size) => {
            this.setState({ itemSize: byteToMB(size) })
        })
    }

    clearCache = () => {
        remote.session.defaultSession.clearCache().then(() => {
            this.getCacheSize()
        })
    }
    
    themeChoices = (): IChoiceGroupOption[] => [
        { key: ThemeSettings.Default, text: intl.get("followSystem") },
        { key: ThemeSettings.Light, text: intl.get("app.lightTheme") },
        { key: ThemeSettings.Dark, text: intl.get("app.darkTheme") }
    ]

    deleteOptions = (): IDropdownOption[] => [
        { key: "7", text: intl.get("app.daysAgo", { days: 7 }) },
        { key: "14", text: intl.get("app.daysAgo", { days: 14 }) },
        { key: "21", text: intl.get("app.daysAgo", { days: 21 }) },
        { key: "28", text: intl.get("app.daysAgo", { days: 28 }) },
        { key: "0", text: intl.get("app.deleteAll") },
    ]

    deleteChange = (_, item: IDropdownOption) => {
        this.setState({ deleteIndex: item ? String(item.key) : null })
    }

    confirmDelete = () => {
        this.setState({ itemSize: null })
        this.props.deleteArticles(parseInt(this.state.deleteIndex))
            .then(() => this.getItemSize())
    }

    languageOptions = (): IDropdownOption[] => [
        { key: "default", text: intl.get("followSystem") },
        { key: "en-US", text: "English" },
        { key: "zh-CN", text: "中文（简体）"}
    ]

    toggleStatus = () => {
        toggleProxyStatus()
        this.setState({ 
            pacStatus: getProxyStatus(),
            pacUrl: getProxy() 
        })
    }
    
    handleInputChange = (event) => {
        const name: string = event.target.name
        // @ts-ignore
        this.setState({[name]: event.target.value.trim()})
    }

    setUrl = (event: React.FormEvent) => {
        event.preventDefault()
        if (urlTest(this.state.pacUrl)) setProxy(this.state.pacUrl)
    }

    onThemeChange = (_, option: IChoiceGroupOption) => {
        setThemeSettings(option.key as ThemeSettings)
        this.setState({ themeSettings: option.key as ThemeSettings })
    }

    exportAll = () => {
        remote.dialog.showSaveDialog(
            remote.getCurrentWindow(),
            {
                defaultPath: "*/Fluent_Reader_Backup.frdata",
                filters: [{ name: intl.get("app.frData"), extensions: ["frdata"] }]
            }
        ).then(result => {
            if (!result.canceled) exportAll(result.filePath)
        })
    }

    render = () => (
        <div className="tab-body">
            <Label>{intl.get("app.language")}</Label>
            <Stack horizontal>
                <Stack.Item>
                    <Dropdown 
                        defaultSelectedKey={getLocaleSettings()}
                        options={this.languageOptions()}
                        onChanged={option => this.props.setLanguage(String(option.key))}
                        style={{width: 200}} />
                </Stack.Item>
            </Stack>

            <ChoiceGroup
                label={intl.get("app.theme")}
                options={this.themeChoices()}
                onChange={this.onThemeChange}
                selectedKey={this.state.themeSettings} />

            <Stack horizontal verticalAlign="baseline">
                <Stack.Item grow>
                    <Label>{intl.get("app.enableProxy")}</Label>
                </Stack.Item>
                <Stack.Item>
                    <Toggle checked={this.state.pacStatus} onChange={this.toggleStatus} />
                </Stack.Item>
            </Stack>
            {this.state.pacStatus && <form onSubmit={this.setUrl}>
                <Stack horizontal>
                    <Stack.Item grow>
                        <TextField
                            required
                            onGetErrorMessage={v => urlTest(v.trim()) ? "" : intl.get("app.badUrl")} 
                            placeholder={intl.get("app.pac")}
                            name="pacUrl"
                            onChange={this.handleInputChange}
                            value={this.state.pacUrl} />
                    </Stack.Item>
                    <Stack.Item>
                        <DefaultButton 
                            disabled={!urlTest(this.state.pacUrl)}
                            type="sumbit" 
                            text={intl.get("app.setPac")} />
                    </Stack.Item>
                </Stack>
            </form>}

            <Label>{intl.get("app.cleanup")}</Label>
            <Stack horizontal>
                <Stack.Item grow>
                    <Dropdown 
                        placeholder={intl.get("app.deleteChoices")} 
                        options={this.deleteOptions()}
                        selectedKey={this.state.deleteIndex}
                        onChange={this.deleteChange} />
                </Stack.Item>
                <Stack.Item>
                    <DangerButton 
                        disabled={this.state.itemSize === null || this.state.deleteIndex === null}
                        text={intl.get("app.confirmDelete")}
                        onClick={this.confirmDelete} />
                </Stack.Item>
            </Stack>
            <span className="settings-hint up">
                {this.state.itemSize ? intl.get("app.itemSize", {size: this.state.itemSize}) : intl.get("app.calculatingSize")}
            </span>
            <Stack horizontal>
                <Stack.Item>
                    <DefaultButton
                        text={intl.get("app.cache")}
                        disabled={this.state.cacheSize === null || this.state.cacheSize === "0MB"}
                        onClick={this.clearCache} />
                </Stack.Item>
            </Stack>
            <span className="settings-hint up">
                {this.state.cacheSize ? intl.get("app.cacheSize", {size: this.state.cacheSize}) : intl.get("app.calculatingSize")}
            </span>

            <Label>{intl.get("app.data")}</Label>
            <Stack horizontal>
            <Stack.Item>
                    <PrimaryButton onClick={this.exportAll} text={intl.get("app.backup")} />
                </Stack.Item>
                <Stack.Item>
                    <DefaultButton onClick={this.props.importAll} text={intl.get("app.restore")} />
                </Stack.Item>
            </Stack>
        </div>
    )
}

export default AppTab