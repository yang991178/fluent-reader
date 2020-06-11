import * as React from "react"
import { urlTest } from "../../scripts/utils"
import { getProxy, getProxyStatus, toggleProxyStatus, setProxy, getThemeSettings, setThemeSettings, ThemeSettings } from "../../scripts/settings"
import { Stack, Label, Toggle, TextField, DefaultButton, ChoiceGroup, IChoiceGroupOption, loadTheme } from "@fluentui/react"

const themeChoices: IChoiceGroupOption[] = [
    { key: ThemeSettings.Default, text: "系统默认" },
    { key: ThemeSettings.Light, text: "浅色模式" },
    { key: ThemeSettings.Dark, text: "深色模式" }
]

class AppTab extends React.Component {
    state = {
        pacStatus: getProxyStatus(),
        pacUrl: getProxy(),
        themeSettings: getThemeSettings()
    }

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
            <Stack horizontal verticalAlign="baseline">
                <Stack.Item grow>
                    <Label>启用代理</Label>
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
                            onGetErrorMessage={v => urlTest(v.trim()) ? "" : "请正确输入URL"} 
                            placeholder="PAC地址"
                            name="pacUrl"
                            onChange={this.handleInputChange}
                            value={this.state.pacUrl} />
                    </Stack.Item>
                    <Stack.Item>
                        <DefaultButton 
                            disabled={!urlTest(this.state.pacUrl)}
                            type="sumbit" 
                            text="设置" />
                    </Stack.Item>
                </Stack>
            </form>}

            <ChoiceGroup
                label="应用主题"
                options={themeChoices}
                onChange={this.onThemeChange}
                selectedKey={this.state.themeSettings} />
        </div>
    )
}

export default AppTab