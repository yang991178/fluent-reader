import * as React from "react"
import intl = require("react-intl-universal")
import { Label, DefaultButton, TextField, Stack, PrimaryButton, DetailsList, 
    IColumn, SelectionMode, Selection, IChoiceGroupOption, ChoiceGroup } from "@fluentui/react"
import { SourceState, RSSSource, SourceOpenTarget } from "../../scripts/models/source"
import { urlTest } from "../../scripts/utils"
import DangerButton from "../utils/danger-button"

type SourcesTabProps = {
    sources: SourceState
    addSource: (url: string) => void
    updateSourceName: (source: RSSSource, name: string) => void
    updateSourceOpenTarget: (source: RSSSource, target: SourceOpenTarget) => void
    deleteSource: (source: RSSSource) => void
    importOPML: () => void
    exportOPML: () => void
}

type SourcesTabState = {
    [formName: string]: string
} & {
    selectedSource: RSSSource
}

class SourcesTab extends React.Component<SourcesTabProps, SourcesTabState> {
    selection: Selection

    constructor(props) {
        super(props)
        this.state = {
            newUrl: "",
            newSourceName: "",
            selectedSource: null
        }
        this.selection = new Selection({
            getKey: s => (s as RSSSource).sid,
            onSelectionChanged: () => {
                let source = this.selection.getSelectedCount() ? this.selection.getSelection()[0] as RSSSource : null
                this.setState({
                    selectedSource: source,
                    newSourceName: source ? source.name : ""
                })
            }
        })
    }

    columns = (): IColumn[] => [
        {
            key: "favicon",
            name: intl.get("icon"),
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
            name: intl.get("name"),
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

    sourceOpenTargetChoices = (): IChoiceGroupOption[] => [
        { key: String(SourceOpenTarget.Local), text: intl.get("sources.rssText") },
        { key: String(SourceOpenTarget.Webpage), text: intl.get("sources.loadWebpage") },
        { key: String(SourceOpenTarget.External), text: intl.get("openExternal") }
    ]

    handleInputChange = (event) => {
        const name: string = event.target.name
        this.setState({[name]: event.target.value.trim()})
    }

    addSource = (event: React.FormEvent) => {
        event.preventDefault()
        if (urlTest(this.state.newUrl)) this.props.addSource(this.state.newUrl)
    }

    onOpenTargetChange = (_, option: IChoiceGroupOption) => {
        let newTarget = parseInt(option.key) as SourceOpenTarget
        this.props.updateSourceOpenTarget(this.state.selectedSource, newTarget)
        this.setState({selectedSource: {...this.state.selectedSource, openTarget: newTarget} as RSSSource})
    }

    render = () => (
        <div className="tab-body">
            <Label>{intl.get("sources.opmlFile")}</Label>
            <Stack horizontal>
                <Stack.Item>
                    <PrimaryButton onClick={this.props.importOPML} text={intl.get("sources.import")} />
                </Stack.Item>
                <Stack.Item>
                    <DefaultButton onClick={this.props.exportOPML} text={intl.get("sources.export")} />
                </Stack.Item>
            </Stack>

            <form onSubmit={this.addSource}>
            <Label htmlFor="newUrl">{intl.get("sources.add")}</Label>
                <Stack horizontal>
                    <Stack.Item grow>
                        <TextField 
                            onGetErrorMessage={v => urlTest(v.trim()) ? "" : intl.get("sources.badUrl")} 
                            validateOnLoad={false} 
                            placeholder={intl.get("sources.inputUrl")}
                            value={this.state.newUrl}
                            id="newUrl"
                            name="newUrl"
                            onChange={this.handleInputChange} />
                    </Stack.Item>
                    <Stack.Item>
                        <PrimaryButton 
                            disabled={!urlTest(this.state.newUrl)}
                            type="submit"
                            text={intl.get("add")} />
                    </Stack.Item>
                </Stack>
            </form>

            <DetailsList
                items={Object.values(this.props.sources)} 
                columns={this.columns()}
                getKey={s => s.sid}
                setKey="selected"
                selection={this.selection}
                selectionMode={SelectionMode.single} />

            {this.state.selectedSource && <>
                <Label>{intl.get("sources.selected")}</Label>
                <Stack horizontal>
                    <Stack.Item grow>
                        <TextField
                            onGetErrorMessage={v => v.trim().length == 0 ? intl.get("emptyName") : ""}
                            validateOnLoad={false}
                            placeholder={intl.get("sources.name")}
                            value={this.state.newSourceName}
                            name="newSourceName"
                            onChange={this.handleInputChange} />
                    </Stack.Item>
                    <Stack.Item>
                        <DefaultButton
                            disabled={this.state.newSourceName.length == 0}
                            onClick={() => this.props.updateSourceName(this.state.selectedSource, this.state.newSourceName)}
                            text={intl.get("sources.editName")} />
                    </Stack.Item>
                </Stack>
                <ChoiceGroup 
                    label={intl.get("sources.openTarget")} 
                    options={this.sourceOpenTargetChoices()}
                    selectedKey={String(this.state.selectedSource.openTarget)}
                    onChange={this.onOpenTargetChange} />
                <Stack horizontal>
                    <Stack.Item>
                        <DangerButton
                            onClick={() => this.props.deleteSource(this.state.selectedSource)}
                            key={this.state.selectedSource.sid}
                            text={intl.get("sources.delete")} />
                    </Stack.Item>
                    <Stack.Item>
                        <span className="settings-hint">{intl.get("sources.deleteWarning")}</span>
                    </Stack.Item>
                </Stack>
            </>}
        </div>
    )
}

export default SourcesTab