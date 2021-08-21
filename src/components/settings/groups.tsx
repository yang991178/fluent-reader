import * as React from "react"
import intl from "react-intl-universal"
import { SourceGroup } from "../../schema-types"
import { SourceState, RSSSource } from "../../scripts/models/source"
import {
    IColumn,
    Selection,
    SelectionMode,
    DetailsList,
    Label,
    Stack,
    TextField,
    PrimaryButton,
    DefaultButton,
    Dropdown,
    IDropdownOption,
    CommandBarButton,
    MarqueeSelection,
    IDragDropEvents,
    MessageBar,
    MessageBarType,
    MessageBarButton,
} from "@fluentui/react"
import DangerButton from "../utils/danger-button"

type GroupsTabProps = {
    sources: SourceState
    groups: SourceGroup[]
    serviceOn: boolean
    createGroup: (name: string) => void
    updateGroup: (group: SourceGroup) => void
    addToGroup: (groupIndex: number, sid: number) => void
    deleteGroup: (groupIndex: number) => void
    removeFromGroup: (groupIndex: number, sids: number[]) => void
    reorderGroups: (groups: SourceGroup[]) => void
    importGroups: () => Promise<void>
}

type GroupsTabState = {
    [formName: string]: any
    selectedGroup: SourceGroup
    selectedSources: RSSSource[]
    dropdownIndex: number
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
            manageGroup: false,
        }
        this.groupDragDropEvents = this.getGroupDragDropEvents()
        this.sourcesDragDropEvents = this.getSourcesDragDropEvents()
        this.groupSelection = new Selection({
            getKey: g => (g as SourceGroup).index,
            onSelectionChanged: () => {
                let g = this.groupSelection.getSelectedCount()
                    ? (this.groupSelection.getSelection()[0] as SourceGroup)
                    : null
                this.setState({
                    selectedGroup: g,
                    editGroupName: g && g.isMultiple ? g.name : "",
                })
            },
        })
        this.sourcesSelection = new Selection({
            getKey: s => (s as RSSSource).sid,
            onSelectionChanged: () => {
                let sources = this.sourcesSelection.getSelectedCount()
                    ? (this.sourcesSelection.getSelection() as RSSSource[])
                    : null
                this.setState({
                    selectedSources: sources,
                })
            },
        })
    }

    groupColumns = (): IColumn[] => [
        {
            key: "type",
            name: intl.get("groups.type"),
            minWidth: 40,
            maxWidth: 40,
            data: "string",
            onRender: (g: SourceGroup) => (
                <>
                    {g.isMultiple
                        ? intl.get("groups.group")
                        : intl.get("groups.source")}
                </>
            ),
        },
        {
            key: "capacity",
            name: intl.get("groups.capacity"),
            minWidth: 40,
            maxWidth: 60,
            data: "string",
            onRender: (g: SourceGroup) => (
                <>{g.isMultiple ? g.sids.length : ""}</>
            ),
        },
        {
            key: "name",
            name: intl.get("name"),
            minWidth: 200,
            data: "string",
            isRowHeader: true,
            onRender: (g: SourceGroup) => (
                <>
                    {g.isMultiple ? g.name : this.props.sources[g.sids[0]].name}
                </>
            ),
        },
    ]

    sourceColumns: IColumn[] = [
        {
            key: "favicon",
            name: intl.get("icon"),
            fieldName: "name",
            isIconOnly: true,
            iconName: "ImagePixel",
            minWidth: 16,
            maxWidth: 16,
            onRender: (s: RSSSource) =>
                s.iconurl && <img src={s.iconurl} className="favicon" />,
        },
        {
            key: "name",
            name: intl.get("name"),
            fieldName: "name",
            minWidth: 200,
            data: "string",
            isRowHeader: true,
        },
        {
            key: "url",
            name: "URL",
            fieldName: "url",
            minWidth: 280,
            data: "string",
        },
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
        let draggedItem = this.groupSelection.isIndexSelected(
            this.groupDraggedIndex
        )
            ? (this.groupSelection.getSelection()[0] as SourceGroup)
            : this.groupDraggedItem!

        let insertIndex = item.index
        let groups = this.props.groups.filter(g => g.index != draggedItem.index)

        groups.splice(insertIndex, 0, draggedItem)
        this.groupSelection.setAllSelected(false)
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
        let draggedItems = this.sourcesSelection.isIndexSelected(
            this.sourcesDraggedIndex
        )
            ? (this.sourcesSelection.getSelection() as RSSSource[]).map(
                  s => s.sid
              )
            : [this.sourcesDraggedItem!.sid]

        let insertIndex = this.state.selectedGroup.sids.indexOf(item.sid)
        let items = this.state.selectedGroup.sids.filter(
            sid => !draggedItems.includes(sid)
        )

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
                manageGroup: true,
            })
        }
    }

    dropdownOptions = () =>
        this.props.groups
            .filter(g => g.isMultiple)
            .map(g => ({
                key: g.index,
                text: g.name,
            }))

    handleInputChange = event => {
        const name: string = event.target.name
        this.setState({ [name]: event.target.value })
    }

    validateNewGroupName = (v: string) => {
        const name = v.trim()
        if (name.length == 0) {
            return intl.get("emptyName")
        }
        for (let group of this.props.groups) {
            if (group.isMultiple && group.name === name) {
                return intl.get("groups.exist")
            }
        }
        return ""
    }

    createGroup = (event: React.FormEvent) => {
        event.preventDefault()
        let trimmed = this.state.newGroupName.trim()
        if (this.validateNewGroupName(trimmed) === "")
            this.props.createGroup(trimmed)
    }

    addToGroup = () => {
        this.props.addToGroup(
            this.state.dropdownIndex,
            this.state.selectedGroup.sids[0]
        )
    }

    removeFromGroup = () => {
        this.props.removeFromGroup(
            this.state.selectedGroup.index,
            this.state.selectedSources.map(s => s.sid)
        )
        this.setState({ selectedSources: null })
    }

    deleteGroup = () => {
        this.props.deleteGroup(this.state.selectedGroup.index)
        this.groupSelection.setIndexSelected(
            this.state.selectedGroup.index,
            false,
            false
        )
        this.setState({ selectedGroup: null })
    }

    updateGroupName = () => {
        let group = this.state.selectedGroup
        group = { ...group, name: this.state.editGroupName.trim() }
        this.props.updateGroup(group)
    }

    dropdownChange = (_, item: IDropdownOption) => {
        this.setState({ dropdownIndex: item ? Number(item.key) : null })
    }

    render = () => (
        <div className="tab-body">
            {this.state.manageGroup && this.state.selectedGroup && (
                <>
                    <Stack
                        horizontal
                        horizontalAlign="space-between"
                        style={{ height: 40 }}>
                        <CommandBarButton
                            text={intl.get("groups.exitGroup")}
                            iconProps={{ iconName: "BackToWindow" }}
                            onClick={() =>
                                this.setState({ manageGroup: false })
                            }
                        />
                        {this.state.selectedSources != null && (
                            <CommandBarButton
                                text={intl.get("groups.deleteSource")}
                                onClick={this.removeFromGroup}
                                iconProps={{
                                    iconName: "RemoveFromShoppingList",
                                    style: { color: "#d13438" },
                                }}
                            />
                        )}
                    </Stack>

                    <MarqueeSelection
                        selection={this.sourcesSelection}
                        isDraggingConstrainedToRoot={true}>
                        <DetailsList
                            compact={true}
                            items={this.state.selectedGroup.sids.map(
                                sid => this.props.sources[sid]
                            )}
                            columns={this.sourceColumns}
                            dragDropEvents={this.sourcesDragDropEvents}
                            setKey="multiple"
                            selection={this.sourcesSelection}
                            selectionMode={SelectionMode.multiple}
                        />
                    </MarqueeSelection>

                    <span className="settings-hint">
                        {intl.get("groups.sourceHint")}
                    </span>
                </>
            )}
            {!this.state.manageGroup || !this.state.selectedGroup ? (
                <>
                    {this.props.serviceOn && (
                        <MessageBar
                            messageBarType={MessageBarType.info}
                            isMultiline={false}
                            actions={
                                <MessageBarButton
                                    text={intl.get("service.importGroups")}
                                    onClick={this.props.importGroups}
                                />
                            }>
                            {intl.get("service.groupsWarning")}
                        </MessageBar>
                    )}
                    <form onSubmit={this.createGroup}>
                        <Label htmlFor="newGroupName">
                            {intl.get("groups.create")}
                        </Label>
                        <Stack horizontal>
                            <Stack.Item grow>
                                <TextField
                                    onGetErrorMessage={
                                        this.validateNewGroupName
                                    }
                                    validateOnLoad={false}
                                    placeholder={intl.get("groups.enterName")}
                                    value={this.state.newGroupName}
                                    id="newGroupName"
                                    name="newGroupName"
                                    onChange={this.handleInputChange}
                                />
                            </Stack.Item>
                            <Stack.Item>
                                <PrimaryButton
                                    disabled={
                                        this.validateNewGroupName(
                                            this.state.newGroupName
                                        ) !== ""
                                    }
                                    type="sumbit"
                                    text={intl.get("create")}
                                />
                            </Stack.Item>
                        </Stack>
                    </form>

                    <DetailsList
                        compact={true}
                        items={this.props.groups}
                        columns={this.groupColumns()}
                        setKey="selected"
                        onItemInvoked={this.manageGroup}
                        dragDropEvents={this.groupDragDropEvents}
                        selection={this.groupSelection}
                        selectionMode={SelectionMode.single}
                    />

                    {this.state.selectedGroup ? (
                        this.state.selectedGroup.isMultiple ? (
                            <>
                                <Label>
                                    {intl.get("groups.selectedGroup")}
                                </Label>
                                <Stack horizontal>
                                    <Stack.Item grow>
                                        <TextField
                                            onGetErrorMessage={v =>
                                                v.trim().length == 0
                                                    ? intl.get("emptyName")
                                                    : ""
                                            }
                                            validateOnLoad={false}
                                            placeholder={intl.get(
                                                "groups.enterName"
                                            )}
                                            value={this.state.editGroupName}
                                            name="editGroupName"
                                            onChange={this.handleInputChange}
                                        />
                                    </Stack.Item>
                                    <Stack.Item>
                                        <DefaultButton
                                            disabled={
                                                this.state.editGroupName.trim()
                                                    .length == 0
                                            }
                                            onClick={this.updateGroupName}
                                            text={intl.get("groups.editName")}
                                        />
                                    </Stack.Item>
                                    <Stack.Item>
                                        <DangerButton
                                            key={this.state.selectedGroup.index}
                                            onClick={this.deleteGroup}
                                            text={intl.get(
                                                "groups.deleteGroup"
                                            )}
                                        />
                                    </Stack.Item>
                                </Stack>
                            </>
                        ) : (
                            <>
                                <Label>
                                    {intl.get("groups.selectedSource")}
                                </Label>
                                <Stack horizontal>
                                    <Stack.Item grow>
                                        <Dropdown
                                            placeholder={intl.get(
                                                "groups.chooseGroup"
                                            )}
                                            selectedKey={
                                                this.state.dropdownIndex
                                            }
                                            options={this.dropdownOptions()}
                                            onChange={this.dropdownChange}
                                        />
                                    </Stack.Item>
                                    <Stack.Item>
                                        <DefaultButton
                                            disabled={
                                                this.state.dropdownIndex ===
                                                null
                                            }
                                            onClick={this.addToGroup}
                                            text={intl.get("groups.addToGroup")}
                                        />
                                    </Stack.Item>
                                </Stack>
                            </>
                        )
                    ) : (
                        <span className="settings-hint">
                            {intl.get("groups.groupHint")}
                        </span>
                    )}
                </>
            ) : null}
        </div>
    )
}

export default GroupsTab
