import * as React from "react"
import intl = require("react-intl-universal")
import { urlTest } from "../../scripts/utils"
import { getProxy, getProxyStatus, toggleProxyStatus, setProxy, getThemeSettings, setThemeSettings, ThemeSettings, getLocaleSettings } from "../../scripts/settings"
import { Stack, Label, Toggle, TextField, DefaultButton, ChoiceGroup, IChoiceGroupOption, loadTheme, Dropdown, IDropdownOption } from "@fluentui/react"

type AppTabProps = {
    setLanguage: (option: string) => void
}

class AppTab extends React.Component<AppTabProps> {
    state = {
        pacStatus: getProxyStatus(),
        pacUrl: getProxy(),
        themeSettings: getThemeSettings()
    }
    
    themeChoices = (): IChoiceGroupOption[] => [
        { key: ThemeSettings.Default, text: intl.get("followSystem") },
        { key: ThemeSettings.Light, text: intl.get("app.lightTheme") },
        { key: ThemeSettings.Dark, text: intl.get("app.darkTheme") }
    ]

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
        this.setState({[name]: event.target.value.trim()})
    }

    setUrl = (event: React.FormEvent) => {
        event.preventDefault()
        if (urlTest(this.state.pacUrl)) setProxy(this.state.pacUrl)
    }

    onThemeChange = (_, option: IChoiceGroupOption) => {
        setThemeSettings(option.key as ThemeSettings)
        this.setState({ themeSettings: option.key })
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
        </div>
    )
}

export default AppTab