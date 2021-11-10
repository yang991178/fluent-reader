"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const react_1 = require("@fluentui/react");
const danger_button_1 = __importDefault(require("../utils/danger-button"));
class GroupsTab extends React.Component {
    constructor(props) {
        super(props);
        this.groupDraggedIndex = -1;
        this.sourcesDraggedIndex = -1;
        this.groupColumns = () => [
            {
                key: "type",
                name: react_intl_universal_1.default.get("groups.type"),
                minWidth: 40,
                maxWidth: 40,
                data: "string",
                onRender: (g) => (React.createElement(React.Fragment, null, g.isMultiple
                    ? react_intl_universal_1.default.get("groups.group")
                    : react_intl_universal_1.default.get("groups.source"))),
            },
            {
                key: "capacity",
                name: react_intl_universal_1.default.get("groups.capacity"),
                minWidth: 40,
                maxWidth: 60,
                data: "string",
                onRender: (g) => (React.createElement(React.Fragment, null, g.isMultiple ? g.sids.length : "")),
            },
            {
                key: "name",
                name: react_intl_universal_1.default.get("name"),
                minWidth: 200,
                data: "string",
                isRowHeader: true,
                onRender: (g) => (React.createElement(React.Fragment, null, g.isMultiple ? g.name : this.props.sources[g.sids[0]].name)),
            },
        ];
        this.sourceColumns = [
            {
                key: "favicon",
                name: react_intl_universal_1.default.get("icon"),
                fieldName: "name",
                isIconOnly: true,
                iconName: "ImagePixel",
                minWidth: 16,
                maxWidth: 16,
                onRender: (s) => s.iconurl && React.createElement("img", { src: s.iconurl, className: "favicon" }),
            },
            {
                key: "name",
                name: react_intl_universal_1.default.get("name"),
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
        ];
        this.getGroupDragDropEvents = () => ({
            canDrop: () => true,
            canDrag: () => true,
            onDrop: (item) => {
                if (this.groupDraggedItem) {
                    this.reorderGroups(item);
                }
            },
            onDragStart: (item, itemIndex) => {
                this.groupDraggedItem = item;
                this.groupDraggedIndex = itemIndex;
            },
            onDragEnd: () => {
                this.groupDraggedItem = undefined;
                this.groupDraggedIndex = -1;
            },
        });
        this.reorderGroups = (item) => {
            let draggedItem = this.groupSelection.isIndexSelected(this.groupDraggedIndex)
                ? this.groupSelection.getSelection()[0]
                : this.groupDraggedItem;
            let insertIndex = item.index;
            let groups = this.props.groups.filter(g => g.index != draggedItem.index);
            groups.splice(insertIndex, 0, draggedItem);
            this.groupSelection.setAllSelected(false);
            this.props.reorderGroups(groups);
        };
        this.getSourcesDragDropEvents = () => ({
            canDrop: () => true,
            canDrag: () => true,
            onDrop: (item) => {
                if (this.sourcesDraggedItem) {
                    this.reorderSources(item);
                }
            },
            onDragStart: (item, itemIndex) => {
                this.sourcesDraggedItem = item;
                this.sourcesDraggedIndex = itemIndex;
            },
            onDragEnd: () => {
                this.sourcesDraggedItem = undefined;
                this.sourcesDraggedIndex = -1;
            },
        });
        this.reorderSources = (item) => {
            let draggedItems = this.sourcesSelection.isIndexSelected(this.sourcesDraggedIndex)
                ? this.sourcesSelection.getSelection().map(s => s.sid)
                : [this.sourcesDraggedItem.sid];
            let insertIndex = this.state.selectedGroup.sids.indexOf(item.sid);
            let items = this.state.selectedGroup.sids.filter(sid => !draggedItems.includes(sid));
            items.splice(insertIndex, 0, ...draggedItems);
            let group = { ...this.state.selectedGroup, sids: items };
            this.props.updateGroup(group);
            this.setState({ selectedGroup: group });
        };
        this.manageGroup = (g) => {
            if (g.isMultiple) {
                this.setState({
                    selectedGroup: g,
                    editGroupName: g && g.isMultiple ? g.name : "",
                    manageGroup: true,
                });
            }
        };
        this.dropdownOptions = () => this.props.groups
            .filter(g => g.isMultiple)
            .map(g => ({
            key: g.index,
            text: g.name,
        }));
        this.handleInputChange = event => {
            const name = event.target.name;
            this.setState({ [name]: event.target.value });
        };
        this.validateNewGroupName = (v) => {
            const name = v.trim();
            if (name.length == 0) {
                return react_intl_universal_1.default.get("emptyName");
            }
            for (let group of this.props.groups) {
                if (group.isMultiple && group.name === name) {
                    return react_intl_universal_1.default.get("groups.exist");
                }
            }
            return "";
        };
        this.createGroup = (event) => {
            event.preventDefault();
            let trimmed = this.state.newGroupName.trim();
            if (this.validateNewGroupName(trimmed) === "")
                this.props.createGroup(trimmed);
        };
        this.addToGroup = () => {
            this.props.addToGroup(this.state.dropdownIndex, this.state.selectedGroup.sids[0]);
        };
        this.removeFromGroup = () => {
            this.props.removeFromGroup(this.state.selectedGroup.index, this.state.selectedSources.map(s => s.sid));
            this.setState({ selectedSources: null });
        };
        this.deleteGroup = () => {
            this.props.deleteGroup(this.state.selectedGroup.index);
            this.groupSelection.setIndexSelected(this.state.selectedGroup.index, false, false);
            this.setState({ selectedGroup: null });
        };
        this.updateGroupName = () => {
            let group = this.state.selectedGroup;
            group = { ...group, name: this.state.editGroupName.trim() };
            this.props.updateGroup(group);
        };
        this.dropdownChange = (_, item) => {
            this.setState({ dropdownIndex: item ? Number(item.key) : null });
        };
        this.render = () => (React.createElement("div", { className: "tab-body" },
            this.state.manageGroup && this.state.selectedGroup && (React.createElement(React.Fragment, null,
                React.createElement(react_1.Stack, { horizontal: true, horizontalAlign: "space-between", style: { height: 40 } },
                    React.createElement(react_1.CommandBarButton, { text: react_intl_universal_1.default.get("groups.exitGroup"), iconProps: { iconName: "BackToWindow" }, onClick: () => this.setState({ manageGroup: false }) }),
                    this.state.selectedSources != null && (React.createElement(react_1.CommandBarButton, { text: react_intl_universal_1.default.get("groups.deleteSource"), onClick: this.removeFromGroup, iconProps: {
                            iconName: "RemoveFromShoppingList",
                            style: { color: "#d13438" },
                        } }))),
                React.createElement(react_1.MarqueeSelection, { selection: this.sourcesSelection, isDraggingConstrainedToRoot: true },
                    React.createElement(react_1.DetailsList, { compact: true, items: this.state.selectedGroup.sids.map(sid => this.props.sources[sid]), columns: this.sourceColumns, dragDropEvents: this.sourcesDragDropEvents, setKey: "multiple", selection: this.sourcesSelection, selectionMode: react_1.SelectionMode.multiple })),
                React.createElement("span", { className: "settings-hint" }, react_intl_universal_1.default.get("groups.sourceHint")))),
            !this.state.manageGroup || !this.state.selectedGroup ? (React.createElement(React.Fragment, null,
                this.props.serviceOn && (React.createElement(react_1.MessageBar, { messageBarType: react_1.MessageBarType.info, isMultiline: false, actions: React.createElement(react_1.MessageBarButton, { text: react_intl_universal_1.default.get("service.importGroups"), onClick: this.props.importGroups }) }, react_intl_universal_1.default.get("service.groupsWarning"))),
                React.createElement("form", { onSubmit: this.createGroup },
                    React.createElement(react_1.Label, { htmlFor: "newGroupName" }, react_intl_universal_1.default.get("groups.create")),
                    React.createElement(react_1.Stack, { horizontal: true },
                        React.createElement(react_1.Stack.Item, { grow: true },
                            React.createElement(react_1.TextField, { onGetErrorMessage: this.validateNewGroupName, validateOnLoad: false, placeholder: react_intl_universal_1.default.get("groups.enterName"), value: this.state.newGroupName, id: "newGroupName", name: "newGroupName", onChange: this.handleInputChange })),
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(react_1.PrimaryButton, { disabled: this.validateNewGroupName(this.state.newGroupName) !== "", type: "sumbit", text: react_intl_universal_1.default.get("create") })))),
                React.createElement(react_1.DetailsList, { compact: true, items: this.props.groups, columns: this.groupColumns(), setKey: "selected", onItemInvoked: this.manageGroup, dragDropEvents: this.groupDragDropEvents, selection: this.groupSelection, selectionMode: react_1.SelectionMode.single }),
                this.state.selectedGroup ? (this.state.selectedGroup.isMultiple ? (React.createElement(React.Fragment, null,
                    React.createElement(react_1.Label, null, react_intl_universal_1.default.get("groups.selectedGroup")),
                    React.createElement(react_1.Stack, { horizontal: true },
                        React.createElement(react_1.Stack.Item, { grow: true },
                            React.createElement(react_1.TextField, { onGetErrorMessage: v => v.trim().length == 0
                                    ? react_intl_universal_1.default.get("emptyName")
                                    : "", validateOnLoad: false, placeholder: react_intl_universal_1.default.get("groups.enterName"), value: this.state.editGroupName, name: "editGroupName", onChange: this.handleInputChange })),
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(react_1.DefaultButton, { disabled: this.state.editGroupName.trim()
                                    .length == 0, onClick: this.updateGroupName, text: react_intl_universal_1.default.get("groups.editName") })),
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(danger_button_1.default, { key: this.state.selectedGroup.index, onClick: this.deleteGroup, text: react_intl_universal_1.default.get("groups.deleteGroup") }))))) : (React.createElement(React.Fragment, null,
                    React.createElement(react_1.Label, null, react_intl_universal_1.default.get("groups.selectedSource")),
                    React.createElement(react_1.Stack, { horizontal: true },
                        React.createElement(react_1.Stack.Item, { grow: true },
                            React.createElement(react_1.Dropdown, { placeholder: react_intl_universal_1.default.get("groups.chooseGroup"), selectedKey: this.state.dropdownIndex, options: this.dropdownOptions(), onChange: this.dropdownChange })),
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(react_1.DefaultButton, { disabled: this.state.dropdownIndex ===
                                    null, onClick: this.addToGroup, text: react_intl_universal_1.default.get("groups.addToGroup") })))))) : (React.createElement("span", { className: "settings-hint" }, react_intl_universal_1.default.get("groups.groupHint"))))) : null));
        this.state = {
            editGroupName: "",
            newGroupName: "",
            selectedGroup: null,
            selectedSources: null,
            dropdownIndex: null,
            manageGroup: false,
        };
        this.groupDragDropEvents = this.getGroupDragDropEvents();
        this.sourcesDragDropEvents = this.getSourcesDragDropEvents();
        this.groupSelection = new react_1.Selection({
            getKey: g => g.index,
            onSelectionChanged: () => {
                let g = this.groupSelection.getSelectedCount()
                    ? this.groupSelection.getSelection()[0]
                    : null;
                this.setState({
                    selectedGroup: g,
                    editGroupName: g && g.isMultiple ? g.name : "",
                });
            },
        });
        this.sourcesSelection = new react_1.Selection({
            getKey: s => s.sid,
            onSelectionChanged: () => {
                let sources = this.sourcesSelection.getSelectedCount()
                    ? this.sourcesSelection.getSelection()
                    : null;
                this.setState({
                    selectedSources: sources,
                });
            },
        });
    }
}
exports.default = GroupsTab;
