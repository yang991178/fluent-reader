import * as React from "react"
import { SourceGroup } from "../../scripts/models/page"
import { SourceState, RSSSource } from "../../scripts/models/source"
import { IColumn, Selection, SelectionMode, DetailsList, Label, Stack,
     TextField, PrimaryButton, DefaultButton, Dropdown, IDropdownOption, CommandBarButton } from "@fluentui/react"
import DangerButton from "../utils/danger-button"

type GroupsTabProps = {
    sources: SourceState,
    groups: SourceGroup[],
    createGroup: (name: string) => void,
    updateGroup: (group: SourceGroup) => void,
    addToGroup: (groupIndex: number, sid: number) => void,
    deleteGroup: (groupIndex: number) => void,
    removeFromGroup: (groupIndex: number, sids: number[]) => void
}

type GroupsTabState = {
    [formName: string]: any,
    selectedGroup: SourceGroup,
    selectedSources: RSSSource[],
    dropdownIndex: number,
    manageGroup: boolean
}

class GroupsTab extends React.Component<GroupsTabProps, GroupsTabState> {
    groupSelection: Selection
    sourcesSelection: Selection

    constructor(props) {
        super(props)
        this.state = {
            editGroupName: "",
            newGroupName: "",
            selectedGroup: null,
            selectedSources: null,
            dropdownIndex: null,
            manageGroup: false
        }
        this.groupSelection = new Selection({
            getKey: g => (g as SourceGroup).index,
            onSelectionChanged: () => {
                let g = this.groupSelection.getSelectedCount() 
                    ? this.groupSelection.getSelection()[0] as SourceGroup : null
                this.setState({
                    selectedGroup: g,
                    editGroupName: g && g.isMultiple ? g.name : ""
                })
            }
        })
        this.sourcesSelection = new Selection({
            getKey: s => (s as RSSSource).sid,
            onSelectionChanged: () => {
                let sources = this.sourcesSelection.getSelectedCount() 
                    ? this.sourcesSelection.getSelection() as RSSSource[] : null
                this.setState({
                    selectedSources: sources
                })
            }
        })
    }

    groupColumns: IColumn[] = [
        {
            key: "type",
            name: "类型",
            minWidth: 40,
            maxWidth: 40,
            data: "string",
            onRender: (g: SourceGroup) => <>
                {g.isMultiple ? "分组" : "订阅源"}
            </>
        },
        {
            key: "capacity",
            name: "容量",
            minWidth: 40,
            maxWidth: 40,
            data: "string",
            onRender: (g: SourceGroup) => <>
                {g.isMultiple ? g.sids.length : ""}
            </>
        },
        {
            key: "name",
            name: "名称",
            minWidth: 200,
            data: "string",
            isRowHeader: true,
            onRender: (g: SourceGroup) => <>
                {g.isMultiple ? g.name : this.props.sources[g.sids[0]].name}
            </>
        }
    ]

    sourceColumns: IColumn[] = [
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

    manageGroup = (g: SourceGroup) => {
        if (g.isMultiple) {
            this.setState({
                selectedGroup: g,
                editGroupName: g && g.isMultiple ? g.name : "",
                manageGroup: true
            })
        }
    }

    dropdownOptions = () => this.props.groups.filter(g => g.isMultiple).map(g => ({
        key: g.index,
        text: g.name
    }))

    handleInputChange = (event) => {
        const name: string = event.target.name
        this.setState({[name]: event.target.value.trim()})
    }

    createGroup = () => {
        this.props.createGroup(this.state.newGroupName)
    }

    addToGroup = () => {
        this.props.addToGroup(this.state.dropdownIndex, this.state.selectedGroup.sids[0])
    }

    removeFromGroup = () => {
        this.props.removeFromGroup(this.state.selectedGroup.index, this.state.selectedSources.map(s => s.sid))
        this.setState({ selectedSources: null })
    }

    deleteGroup = () => {
        this.props.deleteGroup(this.state.selectedGroup.index)
        this.groupSelection.setIndexSelected(this.state.selectedGroup.index, false, false)
        this.setState({ selectedGroup: null })
    }

    updateGroupName = () => {
        let group = this.state.selectedGroup
        group = { ...group, name: this.state.editGroupName }
        this.props.updateGroup(group)
    }

    dropdownChange = (_, item: IDropdownOption) => {
        this.setState({ dropdownIndex: item ? Number(item.key) : null })
    }

    render = () => (
        <div className="tab-body">
            {this.state.manageGroup
            ?<>
                <Stack horizontal horizontalAlign="space-between" style={{height: 44}}>
                    <CommandBarButton 
                        text="退出分组" 
                        iconProps={{iconName: "BackToWindow"}}
                        onClick={() => this.setState({manageGroup: false})} />
                    {this.state.selectedSources != null && <CommandBarButton 
                        text="从分组删除订阅源" 
                        onClick={this.removeFromGroup}
                        iconProps={{iconName: "RemoveFromShoppingList", style: {color: "#d13438"}}} />}
                </Stack>

                <DetailsList
                    compact={true}
                    items={this.state.selectedGroup.sids.map(sid => this.props.sources[sid])} 
                    columns={this.sourceColumns}
                    setKey="multiple"
                    selection={this.sourcesSelection}
                    selectionMode={SelectionMode.multiple} />
                
            </>
            :<>
                <Label>新建分组</Label>
                <Stack horizontal>
                    <Stack.Item grow>
                        <TextField 
                            onGetErrorMessage={v => v.trim().length == 0 ? "名称不得为空" : ""} 
                            validateOnLoad={false} 
                            placeholder="输入名称"
                            value={this.state.newGroupName}
                            name="newGroupName"
                            onChange={this.handleInputChange} />
                    </Stack.Item>
                    <Stack.Item>
                        <PrimaryButton 
                            disabled={this.state.newGroupName.length == 0}
                            onClick={this.createGroup}
                            text="新建" />
                    </Stack.Item>
                </Stack>

                <DetailsList
                    compact={true}
                    items={Object.values(this.props.groups)} 
                    columns={this.groupColumns}
                    setKey="selected"
                    onItemInvoked={this.manageGroup}
                    selection={this.groupSelection}
                    selectionMode={SelectionMode.single} />

                {this.state.selectedGroup && (
                    this.state.selectedGroup.isMultiple 
                    ?<>
                        <Label>选中分组</Label>
                        <Stack horizontal>
                            <Stack.Item grow>
                                <TextField
                                    onGetErrorMessage={v => v.trim().length == 0 ? "名称不得为空" : ""}
                                    validateOnLoad={false}
                                    placeholder="分组名称"
                                    value={this.state.editGroupName}
                                    name="editGroupName"
                                    onChange={this.handleInputChange} />
                            </Stack.Item>
                            <Stack.Item>
                                <DefaultButton
                                    disabled={this.state.editGroupName.length == 0}
                                    onClick={this.updateGroupName}
                                    text="修改名称" />
                            </Stack.Item>
                            <Stack.Item>
                                <DangerButton
                                    key={this.state.selectedGroup.index}
                                    onClick={this.deleteGroup}
                                    text={`删除分组`} />
                            </Stack.Item>
                        </Stack>
                    </>
                    :<>
                        <Label>选中订阅源</Label>
                        <Stack horizontal>
                            <Stack.Item grow>
                                <Dropdown
                                    placeholder="选择分组"
                                    selectedKey={this.state.dropdownIndex}
                                    options={this.dropdownOptions()}
                                    onChange={this.dropdownChange} />
                            </Stack.Item>
                            <Stack.Item>
                                <DefaultButton
                                    disabled={this.state.dropdownIndex === null}
                                    onClick={this.addToGroup}
                                    text="添加至分组" />
                            </Stack.Item>
                        </Stack>
                    </>
                )}
            </>}

        </div>
    )
}

export default GroupsTab