import * as React from "react"
import intl from "react-intl-universal"
import { SourceState, RSSSource } from "../../scripts/models/source"
import {
    Stack,
    Label,
    Dropdown,
    IDropdownOption,
    TextField,
    PrimaryButton,
    Icon,
    DropdownMenuItemType,
    DefaultButton,
    DetailsList,
    IColumn,
    CommandBar,
    ICommandBarItemProps,
    Selection,
    SelectionMode,
    MarqueeSelection,
    IDragDropEvents,
    Link,
    IIconProps,
} from "@fluentui/react"
import { SourceRule, RuleActions } from "../../scripts/models/rule"
import { FilterType } from "../../scripts/models/feed"
import { MyParserItem, validateRegex } from "../../scripts/utils"
import { RSSItem } from "../../scripts/models/item"

const actionKeyMap = {
    "r-true": "article.markRead",
    "r-false": "article.markUnread",
    "s-true": "article.star",
    "s-false": "article.unstar",
    "h-true": "article.hide",
    "h-false": "article.unhide",
    "n-true": "article.notify",
    "n-false": "article.dontNotify",
}

type RulesTabProps = {
    sources: SourceState
    updateSourceRules: (source: RSSSource, rules: SourceRule[]) => void
}

type RulesTabState = {
    sid: string
    selectedRules: number[]
    editIndex: number
    regex: string
    searchType: number
    caseSensitive: boolean
    match: boolean
    actionKeys: string[]
    mockTitle: string
    mockCreator: string
    mockContent: string
    mockResult: string
}

class RulesTab extends React.Component<RulesTabProps, RulesTabState> {
    rulesSelection: Selection
    rulesDragDropEvents: IDragDropEvents
    rulesDraggedItem: SourceRule
    rulesDraggedIndex = -1

    constructor(props) {
        super(props)
        this.state = {
            sid: null,
            selectedRules: [],
            editIndex: -1,
            regex: "",
            searchType: 0,
            caseSensitive: false,
            match: true,
            actionKeys: [],
            mockTitle: "",
            mockCreator: "",
            mockContent: "",
            mockResult: "",
        }
        this.rulesSelection = new Selection({
            getKey: (_, i) => i,
            onSelectionChanged: () => {
                this.setState({
                    selectedRules: this.rulesSelection.getSelectedIndices(),
                })
            },
        })
        this.rulesDragDropEvents = this.getRulesDragDropEvents()
    }

    getRulesDragDropEvents = (): IDragDropEvents => ({
        canDrop: () => true,
        canDrag: () => true,
        onDrop: (item?: SourceRule) => {
            if (this.rulesDraggedItem) {
                this.reorderRules(item)
            }
        },
        onDragStart: (item?: SourceRule, itemIndex?: number) => {
            this.rulesDraggedItem = item
            this.rulesDraggedIndex = itemIndex!
        },
        onDragEnd: () => {
            this.rulesDraggedItem = undefined
            this.rulesDraggedIndex = -1
        },
    })

    reorderRules = (item: SourceRule) => {
        let rules = this.getSourceRules()
        let draggedItems = this.rulesSelection.isIndexSelected(
            this.rulesDraggedIndex
        )
            ? (this.rulesSelection.getSelection() as SourceRule[])
            : [this.rulesDraggedItem]

        let insertIndex = rules.indexOf(item)
        let items = rules.filter(r => !draggedItems.includes(r))

        items.splice(insertIndex, 0, ...draggedItems)
        this.rulesSelection.setAllSelected(false)
        let source = this.props.sources[parseInt(this.state.sid)]
        this.props.updateSourceRules(source, items)
    }

    initRuleEdit = (rule: SourceRule = null) => {
        let searchType = 0
        if (rule) {
            if (rule.filter.type & FilterType.FullSearch) searchType = 1
            else if (rule.filter.type & FilterType.CreatorSearch) searchType = 2
        }
        this.setState({
            regex: rule ? rule.filter.search : "",
            searchType: searchType,
            caseSensitive: rule
                ? !(rule.filter.type & FilterType.CaseInsensitive)
                : false,
            match: rule ? rule.match : true,
            actionKeys: rule ? RuleActions.toKeys(rule.actions) : [],
        })
    }

    getSourceRules = () => this.props.sources[parseInt(this.state.sid)].rules

    ruleColumns = (): IColumn[] => [
        {
            isRowHeader: true,
            key: "regex",
            name: intl.get("rules.regex"),
            minWidth: 100,
            maxWidth: 200,
            onRender: (rule: SourceRule) => rule.filter.search,
        },
        {
            key: "actions",
            name: intl.get("rules.action"),
            minWidth: 100,
            onRender: (rule: SourceRule) =>
                RuleActions.toKeys(rule.actions)
                    .map(k => intl.get(actionKeyMap[k]))
                    .join(", "),
        },
    ]

    handleInputChange = event => {
        const name = event.target.name as "regex"
        this.setState({ [name]: event.target.value })
    }

    sourceOptions = (): IDropdownOption[] =>
        Object.entries(this.props.sources).map(([sid, s]) => ({
            key: sid,
            text: s.name,
            data: { icon: s.iconurl },
        }))
    onRenderSourceOption = (option: IDropdownOption) => (
        <div>
            {option.data && option.data.icon && (
                <img src={option.data.icon} className="favicon dropdown" />
            )}
            <span>{option.text}</span>
        </div>
    )
    onRenderSourceTitle = (options: IDropdownOption[]) => {
        return this.onRenderSourceOption(options[0])
    }
    onSourceOptionChange = (_, item: IDropdownOption) => {
        this.initRuleEdit()
        this.rulesSelection.setAllSelected(false)
        this.setState({
            sid: item.key as string,
            selectedRules: [],
            editIndex: -1,
            mockTitle: "",
            mockCreator: "",
            mockContent: "",
            mockResult: "",
        })
    }

    searchOptions = (): IDropdownOption[] => [
        { key: 0, text: intl.get("rules.title") },
        { key: 1, text: intl.get("rules.fullSearch") },
        { key: 2, text: intl.get("rules.creator") },
    ]
    onSearchOptionChange = (_, item: IDropdownOption) => {
        this.setState({ searchType: item.key as number })
    }

    matchOptions = (): IDropdownOption[] => [
        { key: 1, text: intl.get("rules.match") },
        { key: 0, text: intl.get("rules.notMatch") },
    ]
    onMatchOptionChange = (_, item: IDropdownOption) => {
        this.setState({ match: Boolean(item.key) })
    }

    actionOptions = (): IDropdownOption[] =>
        [
            ...Object.entries(actionKeyMap).map(([k, t], i) => {
                if (k.includes("-false")) {
                    return [
                        { key: k, text: intl.get(t) },
                        {
                            key: i,
                            text: "-",
                            itemType: DropdownMenuItemType.Divider,
                        },
                    ]
                } else {
                    return [{ key: k, text: intl.get(t) }]
                }
            }),
        ].flat(1)

    onActionOptionChange = (_, item: IDropdownOption) => {
        if (item.selected) {
            this.setState(prevState => {
                let [a, f] = (item.key as string).split("-")
                let keys = prevState.actionKeys.filter(
                    k => !k.startsWith(`${a}-`)
                )
                keys.push(item.key as string)
                return { actionKeys: keys }
            })
        } else {
            this.setState(prevState => ({
                actionKeys: prevState.actionKeys.filter(k => k !== item.key),
            }))
        }
    }

    validateRegexField = (value: string) => {
        if (value.length === 0) return intl.get("emptyField")
        else if (validateRegex(value) === null)
            return intl.get("rules.badRegex")
        else return ""
    }

    saveRule = () => {
        let filterType = FilterType.Default | FilterType.ShowHidden
        if (!this.state.caseSensitive) filterType |= FilterType.CaseInsensitive
        if (this.state.searchType === 1) filterType |= FilterType.FullSearch
        else if (this.state.searchType === 2)
            filterType |= FilterType.CreatorSearch
        let rule = new SourceRule(
            this.state.regex,
            this.state.actionKeys,
            filterType,
            this.state.match
        )
        let source = this.props.sources[parseInt(this.state.sid)]
        let rules = source.rules ? [...source.rules] : []
        if (this.state.editIndex === -1) {
            rules.push(rule)
        } else {
            rules.splice(this.state.editIndex, 1, rule)
        }
        this.props.updateSourceRules(source, rules)
        this.setState({ editIndex: -1 })
        this.initRuleEdit()
    }
    newRule = () => {
        this.initRuleEdit()
        this.setState({ editIndex: this.getSourceRules().length })
    }
    editRule = (rule: SourceRule, index: number) => {
        this.initRuleEdit(rule)
        this.setState({ editIndex: index })
    }
    deleteRules = () => {
        let rules = this.getSourceRules()
        for (let i of this.state.selectedRules) rules[i] = null
        let source = this.props.sources[parseInt(this.state.sid)]
        this.props.updateSourceRules(
            source,
            rules.filter(r => r !== null)
        )
        this.initRuleEdit()
    }

    commandBarItems = (): ICommandBarItemProps[] => [
        {
            key: "new",
            text: intl.get("rules.new"),
            iconProps: { iconName: "Add" },
            onClick: this.newRule,
        },
    ]
    commandBarFarItems = (): ICommandBarItemProps[] => {
        let items = []
        if (this.state.selectedRules.length === 1) {
            let index = this.state.selectedRules[0]
            items.push({
                key: "edit",
                text: intl.get("edit"),
                iconProps: { iconName: "Edit" },
                onClick: () =>
                    this.editRule(this.getSourceRules()[index], index),
            })
        }
        if (this.state.selectedRules.length > 0) {
            items.push({
                key: "del",
                text: intl.get("delete"),
                iconProps: { iconName: "Delete", style: { color: "#d13438" } },
                onClick: this.deleteRules,
            })
        }
        return items
    }

    testMockItem = () => {
        let parsed = { title: this.state.mockTitle }
        let source = this.props.sources[parseInt(this.state.sid)]
        let item = new RSSItem(parsed as MyParserItem, source)
        item.snippet = this.state.mockContent
        item.creator = this.state.mockCreator
        SourceRule.applyAll(this.getSourceRules(), item)
        let result = []
        result.push(
            intl.get(item.hasRead ? "article.markRead" : "article.markUnread")
        )
        if (item.starred) result.push(intl.get("article.star"))
        if (item.hidden) result.push(intl.get("article.hide"))
        if (item.notify) result.push(intl.get("article.notify"))
        this.setState({ mockResult: result.join(", ") })
    }

    toggleCaseSensitivity = () => {
        this.setState({ caseSensitive: !this.state.caseSensitive })
    }
    regexCaseIconProps = (): IIconProps => ({
        title: intl.get("context.caseSensitive"),
        children: "Aa",
        style: {
            fontSize: 12,
            fontStyle: "normal",
            cursor: "pointer",
            pointerEvents: "unset",
            color: this.state.caseSensitive
                ? "var(--black)"
                : "var(--neutralTertiary)",
            textDecoration: this.state.caseSensitive ? "underline" : "",
        },
        onClick: this.toggleCaseSensitivity,
    })

    render = () => (
        <div className="tab-body">
            <Stack horizontal tokens={{ childrenGap: 16 }}>
                <Stack.Item>
                    <Label>{intl.get("rules.source")}</Label>
                </Stack.Item>
                <Stack.Item grow>
                    <Dropdown
                        placeholder={intl.get("rules.selectSource")}
                        options={this.sourceOptions()}
                        onRenderOption={this.onRenderSourceOption}
                        onRenderTitle={this.onRenderSourceTitle}
                        selectedKey={this.state.sid}
                        onChange={this.onSourceOptionChange}
                    />
                </Stack.Item>
            </Stack>

            {this.state.sid ? (
                this.state.editIndex > -1 ||
                !this.getSourceRules() ||
                this.getSourceRules().length === 0 ? (
                    <>
                        <Label>
                            {intl.get(
                                this.state.editIndex >= 0 &&
                                    this.state.editIndex <
                                        this.getSourceRules().length
                                    ? "edit"
                                    : "rules.new"
                            )}
                        </Label>
                        <Stack horizontal>
                            <Stack.Item>
                                <Label>{intl.get("rules.if")}</Label>
                            </Stack.Item>
                            <Stack.Item>
                                <Dropdown
                                    options={this.searchOptions()}
                                    selectedKey={this.state.searchType}
                                    onChange={this.onSearchOptionChange}
                                    style={{ width: 140 }}
                                />
                            </Stack.Item>
                            <Stack.Item>
                                <Dropdown
                                    options={this.matchOptions()}
                                    selectedKey={this.state.match ? 1 : 0}
                                    onChange={this.onMatchOptionChange}
                                    style={{ width: 130 }}
                                />
                            </Stack.Item>
                            <Stack.Item grow>
                                <TextField
                                    name="regex"
                                    placeholder={intl.get("rules.regex")}
                                    iconProps={this.regexCaseIconProps()}
                                    value={this.state.regex}
                                    onGetErrorMessage={this.validateRegexField}
                                    validateOnLoad={false}
                                    onChange={this.handleInputChange}
                                />
                            </Stack.Item>
                        </Stack>
                        <Stack horizontal>
                            <Stack.Item>
                                <Label>{intl.get("rules.then")}</Label>
                            </Stack.Item>
                            <Stack.Item grow>
                                <Dropdown
                                    multiSelect
                                    placeholder={intl.get("rules.selectAction")}
                                    options={this.actionOptions()}
                                    selectedKeys={this.state.actionKeys}
                                    onChange={this.onActionOptionChange}
                                    onRenderCaretDown={() => (
                                        <Icon iconName="CirclePlus" />
                                    )}
                                />
                            </Stack.Item>
                        </Stack>
                        <Stack horizontal>
                            <Stack.Item>
                                <PrimaryButton
                                    disabled={
                                        this.state.regex.length == 0 ||
                                        validateRegex(this.state.regex) ===
                                            null ||
                                        this.state.actionKeys.length == 0
                                    }
                                    text={intl.get("confirm")}
                                    onClick={this.saveRule}
                                />
                            </Stack.Item>
                            {this.state.editIndex > -1 && (
                                <Stack.Item>
                                    <DefaultButton
                                        text={intl.get("cancel")}
                                        onClick={() =>
                                            this.setState({ editIndex: -1 })
                                        }
                                    />
                                </Stack.Item>
                            )}
                        </Stack>
                    </>
                ) : (
                    <>
                        <CommandBar
                            items={this.commandBarItems()}
                            farItems={this.commandBarFarItems()}
                        />
                        <MarqueeSelection
                            selection={this.rulesSelection}
                            isDraggingConstrainedToRoot>
                            <DetailsList
                                compact
                                columns={this.ruleColumns()}
                                items={this.getSourceRules()}
                                onItemInvoked={this.editRule}
                                dragDropEvents={this.rulesDragDropEvents}
                                setKey="selected"
                                selection={this.rulesSelection}
                                selectionMode={SelectionMode.multiple}
                            />
                        </MarqueeSelection>
                        <span className="settings-hint up">
                            {intl.get("rules.hint")}
                        </span>

                        <Label>{intl.get("rules.test")}</Label>
                        <Stack horizontal>
                            <Stack.Item grow>
                                <TextField
                                    name="mockTitle"
                                    placeholder={intl.get("rules.title")}
                                    value={this.state.mockTitle}
                                    onChange={this.handleInputChange}
                                />
                            </Stack.Item>
                            <Stack.Item grow>
                                <TextField
                                    name="mockCreator"
                                    placeholder={intl.get("rules.creator")}
                                    value={this.state.mockCreator}
                                    onChange={this.handleInputChange}
                                />
                            </Stack.Item>
                        </Stack>
                        <Stack horizontal>
                            <Stack.Item grow>
                                <TextField
                                    name="mockContent"
                                    placeholder={intl.get("rules.content")}
                                    value={this.state.mockContent}
                                    onChange={this.handleInputChange}
                                />
                            </Stack.Item>
                            <Stack.Item>
                                <PrimaryButton
                                    text={intl.get("confirm")}
                                    onClick={this.testMockItem}
                                />
                            </Stack.Item>
                        </Stack>
                        <span className="settings-hint up">
                            {this.state.mockResult}
                        </span>
                    </>
                )
            ) : (
                <Stack horizontalAlign="center" style={{ marginTop: 64 }}>
                    <Stack
                        className="settings-rules-icons"
                        horizontal
                        tokens={{ childrenGap: 12 }}>
                        <Icon iconName="Filter" />
                        <Icon iconName="FavoriteStar" />
                        <Icon iconName="Ringer" />
                        <Icon iconName="More" />
                    </Stack>
                    <span className="settings-hint">
                        {intl.get("rules.intro")}
                        <Link
                            onClick={() =>
                                window.utils.openExternal(
                                    "https://github.com/yang991178/fluent-reader/wiki/Support#rules"
                                )
                            }
                            style={{ marginLeft: 6 }}>
                            {intl.get("rules.help")}
                        </Link>
                    </span>
                </Stack>
            )}
        </div>
    )
}

export default RulesTab
