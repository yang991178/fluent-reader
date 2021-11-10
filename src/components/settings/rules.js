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
const rule_1 = require("../../scripts/models/rule");
const feed_1 = require("../../scripts/models/feed");
const utils_1 = require("../../scripts/utils");
const item_1 = require("../../scripts/models/item");
const actionKeyMap = {
    "r-true": "article.markRead",
    "r-false": "article.markUnread",
    "s-true": "article.star",
    "s-false": "article.unstar",
    "h-true": "article.hide",
    "h-false": "article.unhide",
    "n-true": "article.notify",
    "n-false": "article.dontNotify",
};
class RulesTab extends React.Component {
    constructor(props) {
        super(props);
        this.rulesDraggedIndex = -1;
        this.getRulesDragDropEvents = () => ({
            canDrop: () => true,
            canDrag: () => true,
            onDrop: (item) => {
                if (this.rulesDraggedItem) {
                    this.reorderRules(item);
                }
            },
            onDragStart: (item, itemIndex) => {
                this.rulesDraggedItem = item;
                this.rulesDraggedIndex = itemIndex;
            },
            onDragEnd: () => {
                this.rulesDraggedItem = undefined;
                this.rulesDraggedIndex = -1;
            },
        });
        this.reorderRules = (item) => {
            let rules = this.getSourceRules();
            let draggedItems = this.rulesSelection.isIndexSelected(this.rulesDraggedIndex)
                ? this.rulesSelection.getSelection()
                : [this.rulesDraggedItem];
            let insertIndex = rules.indexOf(item);
            let items = rules.filter(r => !draggedItems.includes(r));
            items.splice(insertIndex, 0, ...draggedItems);
            this.rulesSelection.setAllSelected(false);
            let source = this.props.sources[parseInt(this.state.sid)];
            this.props.updateSourceRules(source, items);
        };
        this.initRuleEdit = (rule = null) => {
            let searchType = 0;
            if (rule) {
                if (rule.filter.type & feed_1.FilterType.FullSearch)
                    searchType = 1;
                else if (rule.filter.type & feed_1.FilterType.CreatorSearch)
                    searchType = 2;
            }
            this.setState({
                regex: rule ? rule.filter.search : "",
                searchType: searchType,
                caseSensitive: rule
                    ? !(rule.filter.type & feed_1.FilterType.CaseInsensitive)
                    : false,
                match: rule ? rule.match : true,
                actionKeys: rule ? rule_1.RuleActions.toKeys(rule.actions) : [],
            });
        };
        this.getSourceRules = () => this.props.sources[parseInt(this.state.sid)].rules;
        this.ruleColumns = () => [
            {
                isRowHeader: true,
                key: "regex",
                name: react_intl_universal_1.default.get("rules.regex"),
                minWidth: 100,
                maxWidth: 200,
                onRender: (rule) => rule.filter.search,
            },
            {
                key: "actions",
                name: react_intl_universal_1.default.get("rules.action"),
                minWidth: 100,
                onRender: (rule) => rule_1.RuleActions.toKeys(rule.actions)
                    .map(k => react_intl_universal_1.default.get(actionKeyMap[k]))
                    .join(", "),
            },
        ];
        this.handleInputChange = event => {
            const name = event.target.name;
            this.setState({ [name]: event.target.value });
        };
        this.sourceOptions = () => Object.entries(this.props.sources).map(([sid, s]) => ({
            key: sid,
            text: s.name,
            data: { icon: s.iconurl },
        }));
        this.onRenderSourceOption = (option) => (React.createElement("div", null,
            option.data && option.data.icon && (React.createElement("img", { src: option.data.icon, className: "favicon dropdown" })),
            React.createElement("span", null, option.text)));
        this.onRenderSourceTitle = (options) => {
            return this.onRenderSourceOption(options[0]);
        };
        this.onSourceOptionChange = (_, item) => {
            this.initRuleEdit();
            this.rulesSelection.setAllSelected(false);
            this.setState({
                sid: item.key,
                selectedRules: [],
                editIndex: -1,
                mockTitle: "",
                mockCreator: "",
                mockContent: "",
                mockResult: "",
            });
        };
        this.searchOptions = () => [
            { key: 0, text: react_intl_universal_1.default.get("rules.title") },
            { key: 1, text: react_intl_universal_1.default.get("rules.fullSearch") },
            { key: 2, text: react_intl_universal_1.default.get("rules.creator") },
        ];
        this.onSearchOptionChange = (_, item) => {
            this.setState({ searchType: item.key });
        };
        this.matchOptions = () => [
            { key: 1, text: react_intl_universal_1.default.get("rules.match") },
            { key: 0, text: react_intl_universal_1.default.get("rules.notMatch") },
        ];
        this.onMatchOptionChange = (_, item) => {
            this.setState({ match: Boolean(item.key) });
        };
        this.actionOptions = () => [
            ...Object.entries(actionKeyMap).map(([k, t], i) => {
                if (k.includes("-false")) {
                    return [
                        { key: k, text: react_intl_universal_1.default.get(t) },
                        {
                            key: i,
                            text: "-",
                            itemType: react_1.DropdownMenuItemType.Divider,
                        },
                    ];
                }
                else {
                    return [{ key: k, text: react_intl_universal_1.default.get(t) }];
                }
            }),
        ].flat(1);
        this.onActionOptionChange = (_, item) => {
            if (item.selected) {
                this.setState(prevState => {
                    let [a, f] = item.key.split("-");
                    let keys = prevState.actionKeys.filter(k => !k.startsWith(`${a}-`));
                    keys.push(item.key);
                    return { actionKeys: keys };
                });
            }
            else {
                this.setState(prevState => ({
                    actionKeys: prevState.actionKeys.filter(k => k !== item.key),
                }));
            }
        };
        this.validateRegexField = (value) => {
            if (value.length === 0)
                return react_intl_universal_1.default.get("emptyField");
            else if ((0, utils_1.validateRegex)(value) === null)
                return react_intl_universal_1.default.get("rules.badRegex");
            else
                return "";
        };
        this.saveRule = () => {
            let filterType = feed_1.FilterType.Default | feed_1.FilterType.ShowHidden;
            if (!this.state.caseSensitive)
                filterType |= feed_1.FilterType.CaseInsensitive;
            if (this.state.searchType === 1)
                filterType |= feed_1.FilterType.FullSearch;
            else if (this.state.searchType === 2)
                filterType |= feed_1.FilterType.CreatorSearch;
            let rule = new rule_1.SourceRule(this.state.regex, this.state.actionKeys, filterType, this.state.match);
            let source = this.props.sources[parseInt(this.state.sid)];
            let rules = source.rules ? [...source.rules] : [];
            if (this.state.editIndex === -1) {
                rules.push(rule);
            }
            else {
                rules.splice(this.state.editIndex, 1, rule);
            }
            this.props.updateSourceRules(source, rules);
            this.setState({ editIndex: -1 });
            this.initRuleEdit();
        };
        this.newRule = () => {
            this.initRuleEdit();
            this.setState({ editIndex: this.getSourceRules().length });
        };
        this.editRule = (rule, index) => {
            this.initRuleEdit(rule);
            this.setState({ editIndex: index });
        };
        this.deleteRules = () => {
            let rules = this.getSourceRules();
            for (let i of this.state.selectedRules)
                rules[i] = null;
            let source = this.props.sources[parseInt(this.state.sid)];
            this.props.updateSourceRules(source, rules.filter(r => r !== null));
            this.initRuleEdit();
        };
        this.commandBarItems = () => [
            {
                key: "new",
                text: react_intl_universal_1.default.get("rules.new"),
                iconProps: { iconName: "Add" },
                onClick: this.newRule,
            },
        ];
        this.commandBarFarItems = () => {
            let items = [];
            if (this.state.selectedRules.length === 1) {
                let index = this.state.selectedRules[0];
                items.push({
                    key: "edit",
                    text: react_intl_universal_1.default.get("edit"),
                    iconProps: { iconName: "Edit" },
                    onClick: () => this.editRule(this.getSourceRules()[index], index),
                });
            }
            if (this.state.selectedRules.length > 0) {
                items.push({
                    key: "del",
                    text: react_intl_universal_1.default.get("delete"),
                    iconProps: { iconName: "Delete", style: { color: "#d13438" } },
                    onClick: this.deleteRules,
                });
            }
            return items;
        };
        this.testMockItem = () => {
            let parsed = { title: this.state.mockTitle };
            let source = this.props.sources[parseInt(this.state.sid)];
            let item = new item_1.RSSItem(parsed, source);
            item.snippet = this.state.mockContent;
            item.creator = this.state.mockCreator;
            rule_1.SourceRule.applyAll(this.getSourceRules(), item);
            let result = [];
            result.push(react_intl_universal_1.default.get(item.hasRead ? "article.markRead" : "article.markUnread"));
            if (item.starred)
                result.push(react_intl_universal_1.default.get("article.star"));
            if (item.hidden)
                result.push(react_intl_universal_1.default.get("article.hide"));
            if (item.notify)
                result.push(react_intl_universal_1.default.get("article.notify"));
            this.setState({ mockResult: result.join(", ") });
        };
        this.toggleCaseSensitivity = () => {
            this.setState({ caseSensitive: !this.state.caseSensitive });
        };
        this.regexCaseIconProps = () => ({
            title: react_intl_universal_1.default.get("context.caseSensitive"),
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
        });
        this.render = () => (React.createElement("div", { className: "tab-body" },
            React.createElement(react_1.Stack, { horizontal: true, tokens: { childrenGap: 16 } },
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.Label, null, react_intl_universal_1.default.get("rules.source"))),
                React.createElement(react_1.Stack.Item, { grow: true },
                    React.createElement(react_1.Dropdown, { placeholder: react_intl_universal_1.default.get("rules.selectSource"), options: this.sourceOptions(), onRenderOption: this.onRenderSourceOption, onRenderTitle: this.onRenderSourceTitle, selectedKey: this.state.sid, onChange: this.onSourceOptionChange }))),
            this.state.sid ? (this.state.editIndex > -1 ||
                !this.getSourceRules() ||
                this.getSourceRules().length === 0 ? (React.createElement(React.Fragment, null,
                React.createElement(react_1.Label, null, react_intl_universal_1.default.get(this.state.editIndex >= 0 &&
                    this.state.editIndex <
                        this.getSourceRules().length
                    ? "edit"
                    : "rules.new")),
                React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, react_intl_universal_1.default.get("rules.if"))),
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Dropdown, { options: this.searchOptions(), selectedKey: this.state.searchType, onChange: this.onSearchOptionChange, style: { width: 140 } })),
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Dropdown, { options: this.matchOptions(), selectedKey: this.state.match ? 1 : 0, onChange: this.onMatchOptionChange, style: { width: 130 } })),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { name: "regex", placeholder: react_intl_universal_1.default.get("rules.regex"), iconProps: this.regexCaseIconProps(), value: this.state.regex, onGetErrorMessage: this.validateRegexField, validateOnLoad: false, onChange: this.handleInputChange }))),
                React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Label, null, react_intl_universal_1.default.get("rules.then"))),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.Dropdown, { multiSelect: true, placeholder: react_intl_universal_1.default.get("rules.selectAction"), options: this.actionOptions(), selectedKeys: this.state.actionKeys, onChange: this.onActionOptionChange, onRenderCaretDown: () => (React.createElement(react_1.Icon, { iconName: "CirclePlus" })) }))),
                React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.PrimaryButton, { disabled: this.state.regex.length == 0 ||
                                (0, utils_1.validateRegex)(this.state.regex) ===
                                    null ||
                                this.state.actionKeys.length == 0, text: react_intl_universal_1.default.get("confirm"), onClick: this.saveRule })),
                    this.state.editIndex > -1 && (React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.DefaultButton, { text: react_intl_universal_1.default.get("cancel"), onClick: () => this.setState({ editIndex: -1 }) })))))) : (React.createElement(React.Fragment, null,
                React.createElement(react_1.CommandBar, { items: this.commandBarItems(), farItems: this.commandBarFarItems() }),
                React.createElement(react_1.MarqueeSelection, { selection: this.rulesSelection, isDraggingConstrainedToRoot: true },
                    React.createElement(react_1.DetailsList, { compact: true, columns: this.ruleColumns(), items: this.getSourceRules(), onItemInvoked: this.editRule, dragDropEvents: this.rulesDragDropEvents, setKey: "selected", selection: this.rulesSelection, selectionMode: react_1.SelectionMode.multiple })),
                React.createElement("span", { className: "settings-hint up" }, react_intl_universal_1.default.get("rules.hint")),
                React.createElement(react_1.Label, null, react_intl_universal_1.default.get("rules.test")),
                React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { name: "mockTitle", placeholder: react_intl_universal_1.default.get("rules.title"), value: this.state.mockTitle, onChange: this.handleInputChange })),
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { name: "mockCreator", placeholder: react_intl_universal_1.default.get("rules.creator"), value: this.state.mockCreator, onChange: this.handleInputChange }))),
                React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { name: "mockContent", placeholder: react_intl_universal_1.default.get("rules.content"), value: this.state.mockContent, onChange: this.handleInputChange })),
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.PrimaryButton, { text: react_intl_universal_1.default.get("confirm"), onClick: this.testMockItem }))),
                React.createElement("span", { className: "settings-hint up" }, this.state.mockResult)))) : (React.createElement(react_1.Stack, { horizontalAlign: "center", style: { marginTop: 64 } },
                React.createElement(react_1.Stack, { className: "settings-rules-icons", horizontal: true, tokens: { childrenGap: 12 } },
                    React.createElement(react_1.Icon, { iconName: "Filter" }),
                    React.createElement(react_1.Icon, { iconName: "FavoriteStar" }),
                    React.createElement(react_1.Icon, { iconName: "Ringer" }),
                    React.createElement(react_1.Icon, { iconName: "More" })),
                React.createElement("span", { className: "settings-hint" },
                    react_intl_universal_1.default.get("rules.intro"),
                    React.createElement(react_1.Link, { onClick: () => window.utils.openExternal("https://github.com/yang991178/fluent-reader/wiki/Support#rules"), style: { marginLeft: 6 } }, react_intl_universal_1.default.get("rules.help")))))));
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
        };
        this.rulesSelection = new react_1.Selection({
            getKey: (_, i) => i,
            onSelectionChanged: () => {
                this.setState({
                    selectedRules: this.rulesSelection.getSelectedIndices(),
                });
            },
        });
        this.rulesDragDropEvents = this.getRulesDragDropEvents();
    }
}
exports.default = RulesTab;
