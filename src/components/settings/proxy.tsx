import * as React from "react"
import { getProxy, urlTest, getProxyStatus, toggleProxyStatus, setProxy } from "../../scripts/utils"
import { Stack, Label, Toggle, TextField, DefaultButton } from "@fluentui/react"

class ProxyTab extends React.Component {
    state = {
        pacStatus: getProxyStatus(),
        pacUrl: getProxy() 
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

    render = () => (
        <div className="tab-body">
            <Stack horizontal verticalAlign="center">
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
        </div>
    )
}

export default ProxyTab