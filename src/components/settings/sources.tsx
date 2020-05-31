import * as React from "react"
import { Label, DefaultButton, TextField, Stack, PrimaryButton, DetailsList, Spinner, IColumn, SelectionMode, IRefObject, ITextField } from "@fluentui/react"
import { SourcesTabReduxProps } from "../../containers/settings/sources-container"
import { SourceState, RSSSource } from "../../scripts/models/source"
import { urlTest } from "../../scripts/utils"

type SourcesTabProps = SourcesTabReduxProps & {
    sources: SourceState,
    addSource: (url: string) => void
}

type SourcesTabState = {
    [formName: string]: string
}

const columns: IColumn[] = [
    {
        key: "favicon",
        name: "图标",
        fieldName: "name",
        isIconOnly: true,
        iconName: "ImagePixel",
        minWidth: 16,
        maxWidth: 16,
        onRender: (s: RSSSource) => s.iconurl && (
            <img src={s.iconurl} className="favicon" />
        )
    },
    {
        key: "name",
        name: "名称",
        fieldName: "name",
        minWidth: 200,
        data: 'string',
        isRowHeader: true
    },
    {
        key: "url",
        name: "URL",
        fieldName: "url",
        minWidth: 280,
        data: 'string'
    }
]

class SourcesTab extends React.Component<SourcesTabProps, SourcesTabState> {
    constructor(props) {
        super(props)
        this.state = {
            newUrl: ""
        }
    }

    handleInputChange = (event) => {
        const name: string = event.target.name
        this.setState({[name]: event.target.value})
    }

    render = () => (
        <div className="tab-body">
            <Label>OPML文件</Label>
            <Stack horizontal>
                <Stack.Item>
                    <PrimaryButton text="导入文件" />
                </Stack.Item>
                <Stack.Item>
                    <DefaultButton text="导出文件" />
                </Stack.Item>
            </Stack>

            <Label>添加订阅源</Label>
            <Stack horizontal>
                <Stack.Item grow>
                    <TextField 
                        onGetErrorMessage={v => urlTest(v) ? "" : "请正确输入URL"} 
                        validateOnLoad={false} 
                        placeholder="输入URL"
                        value={this.state.newUrl}
                        name="newUrl"
                        onChange={this.handleInputChange} />
                </Stack.Item>
                <Stack.Item>
                    <PrimaryButton 
                        disabled={!urlTest(this.state.newUrl)} 
                        onClick={() => this.props.addSource(this.state.newUrl)}
                        text="添加" />
                </Stack.Item>
            </Stack>

            <Label>订阅源列表</Label>
            <DetailsList
                items={Object.values(this.props.sources)} 
                columns={columns}
                selectionMode={SelectionMode.single} />

            <Label>选中订阅源</Label>
        </div>
    )
}

export default SourcesTab