import * as React from "react"
import { SourceGroup } from "../../scripts/models/group"
import { SourceState, RSSSource } from "../../scripts/models/source"
import { IColumn, Selection, SelectionMode, DetailsList, Label, Stack,
     TextField, PrimaryButton, DefaultButton, Dropdown, IDropdownOption, CommandBarButton, MarqueeSelection, IDragDropEvents, IDragDropContext } from "@fluentui/react"
import DangerButton from "../utils/danger-button"

type GroupsTabProps = {
    sources: SourceState,
    groups: SourceGroup[],
    createGroup: (name: string) => void,
    updateGroup: (group: SourceGroup) => void,
    addToGroup: (groupIndex: number, sid: number) => void,
    deleteGroup: (groupIndex: number) => void,
    removeFromGroup: (groupIndex: number, sids: number[]) => void,
    reorderGroups: (groups: SourceGroup[]) => void
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
    groupDragDropEvents: IDragDropEvents
    groupDraggedItem: SourceGroup
    groupDraggedIndex = -1
    sourcesSelection: Selection
    sourcesDragDropEvents: IDragDropEvents
    sourcesDraggedItem: RSSSource
    sourcesDraggedIndex = -1

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
        this.groupDragDropEvents = this.getGroupDragDropEvents()
        this.sourcesDragDropEvents = this.getSourcesDragDropEvents()
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

    getGroupDragDropEvents = (): IDragDropEvents => ({
        canDrop: () => true,
        canDrag: () => true,
        onDrop: (item?: SourceGroup) => {
            if (this.groupDraggedItem) {
                this.reorderGroups(item)
            }
        },
        onDragStart: (item?: SourceGroup, itemIndex?: number) => {
            this.groupDraggedItem = item
            this.groupDraggedIndex = itemIndex!
        },
        onDragEnd: () => {
            this.groupDraggedItem = undefined
            this.groupDraggedIndex = -1
        },
    })

    reorderGroups = (item: SourceGroup) => {
        let draggedItem = this.groupSelection.isIndexSelected(this.groupDraggedIndex)
        ? this.groupSelection.getSelection()[0] as SourceGroup
        : this.groupDraggedItem!
  
        let insertIndex = item.index
        let groups = this.props.groups.filter(g => g.index != draggedItem.index)
  
        groups.splice(insertIndex, 0, draggedItem)
  
        this.props.reorderGroups(groups)
    }

    getSourcesDragDropEvents = (): IDragDropEvents => ({
        canDrop: () => true,
        canDrag: () => true,
        onDrop: (item?: RSSSource) => {
            if (this.sourcesDraggedItem) {
                this.reorderSources(item)
            }
        },
        onDragStart: (item?: RSSSource, itemIndex?: number) => {
            this.sourcesDraggedItem = item
            this.sourcesDraggedIndex = itemIndex!
        },
        onDragEnd: () => {
            this.sourcesDraggedItem = undefined
            this.sourcesDraggedIndex = -1
        },
    })

    reorderSources = (item: RSSSource) => {
        let draggedItems = this.sourcesSelection.isIndexSelected(this.sourcesDraggedIndex)
        ? (this.sourcesSelection.getSelection() as RSSSource[]).map(s => s.sid)
        : [this.sourcesDraggedItem!.sid]
  
        let insertIndex = this.state.selectedGroup.sids.indexOf(item.sid)
        let items = this.state.selectedGroup.sids.filter(sid => !draggedItems.includes(sid))
  
        items.splice(insertIndex, 0, ...draggedItems)
  
        let group = { ...this.state.selectedGroup, sids: items }
        this.props.updateGroup(group)
        this.setState({ selectedGroup: group })
    }

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

    createGroup = (event: React.FormEvent) => {
        event.preventDefault()
        if (this.state.newGroupName.length > 0) this.props.createGroup(this.state.newGroupName)
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
            {this.state.manageGroup && this.state.selectedGroup &&
            <>
                <Stack horizontal horizontalAlign="space-between" style={{height: 40}}>
                    <CommandBarButton 
                        text="退出分组" 
                        iconProps={{iconName: "BackToWindow"}}
                        onClick={() => this.setState({manageGroup: false})} />
                    {this.state.selectedSources != null && <CommandBarButton 
                        text="从分组删除订阅源" 
                        onClick={this.removeFromGroup}
                        iconProps={{iconName: "RemoveFromShoppingList", style: {color: "#d13438"}}} />}
                </Stack>

                <MarqueeSelection selection={this.sourcesSelection} isDraggingConstrainedToRoot={true}>
                    <DetailsList
                        compact={true}
                        items={this.state.selectedGroup.sids.map(sid => this.props.sources[sid])} 
                        columns={this.sourceColumns}
                        dragDropEvents={this.sourcesDragDropEvents}
                        setKey="multiple"
                        selection={this.sourcesSelection}
                        selectionMode={SelectionMode.multiple} />
                </MarqueeSelection>
                
            </>}
            {(!this.state.manageGroup || !this.state.selectedGroup) 
            ?<>
                <form onSubmit={this.createGroup}>
                    <Label htmlFor="newGroupName">新建分组</Label>
                    <Stack horizontal>
                        <Stack.Item grow>
                            <TextField 
                                onGetErrorMessage={v => v.trim().length == 0 ? "名称不得为空" : ""} 
                                validateOnLoad={false} 
                                placeholder="输入名称"
                                value={this.state.newGroupName}
                                id="newGroupName"
                                name="newGroupName"
                                onChange={this.handleInputChange} />
                        </Stack.Item>
                        <Stack.Item>
                            <PrimaryButton 
                                disabled={this.state.newGroupName.length == 0}
                                type="sumbit"
                                text="新建" />
                        </Stack.Item>
                    </Stack>
                </form>

                <DetailsList
                    compact={true}
                    items={this.props.groups} 
                    columns={this.groupColumns}
                    setKey="selected"
                    onItemInvoked={this.manageGroup}
                    dragDropEvents={this.groupDragDropEvents}
                    selection={this.groupSelection}
                    selectionMode={SelectionMode.single} />

                {this.state.selectedGroup 
                ? ( this.state.selectedGroup.isMultiple 
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
                )
                : <span className="settings-hint">双击分组以修改订阅源，可通过拖拽排序</span>
                }
            </> : null}
        </div>
    )
}

export default GroupsTab