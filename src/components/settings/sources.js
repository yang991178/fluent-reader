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
const utils_1 = require("../../scripts/utils");
const danger_button_1 = __importDefault(require("../utils/danger-button"));
class SourcesTab extends React.Component {
    constructor(props) {
        super(props);
        this.componentDidMount = () => {
            if (this.props.sids.length > 0) {
                for (let sid of this.props.sids) {
                    this.selection.setKeySelected(String(sid), true, false);
                }
                this.props.acknowledgeSIDs();
            }
        };
        this.columns = () => [
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
        this.sourceEditOptions = () => [
            { key: "n" /* Name */, text: react_intl_universal_1.default.get("name") },
            { key: "i" /* Icon */, text: react_intl_universal_1.default.get("icon") },
            { key: "u" /* Url */, text: "URL" },
        ];
        this.onSourceEditOptionChange = (_, option) => {
            this.setState({ sourceEditOption: option.key });
        };
        this.fetchFrequencyOptions = () => [
            { key: "0", text: react_intl_universal_1.default.get("sources.unlimited") },
            { key: "15", text: react_intl_universal_1.default.get("time.minute", { m: 15 }) },
            { key: "30", text: react_intl_universal_1.default.get("time.minute", { m: 30 }) },
            { key: "60", text: react_intl_universal_1.default.get("time.hour", { h: 1 }) },
            { key: "120", text: react_intl_universal_1.default.get("time.hour", { h: 2 }) },
            { key: "180", text: react_intl_universal_1.default.get("time.hour", { h: 3 }) },
            { key: "360", text: react_intl_universal_1.default.get("time.hour", { h: 6 }) },
            { key: "720", text: react_intl_universal_1.default.get("time.hour", { h: 12 }) },
            { key: "1440", text: react_intl_universal_1.default.get("time.day", { d: 1 }) },
        ];
        this.onFetchFrequencyChange = (_, option) => {
            let frequency = parseInt(option.key);
            this.props.updateFetchFrequency(this.state.selectedSource, frequency);
            this.setState({
                selectedSource: {
                    ...this.state.selectedSource,
                    fetchFrequency: frequency,
                },
            });
        };
        this.sourceOpenTargetChoices = () => [
            {
                key: String(0 /* Local */),
                text: react_intl_universal_1.default.get("sources.rssText"),
            },
            {
                key: String(3 /* FullContent */),
                text: react_intl_universal_1.default.get("article.loadFull"),
            },
            {
                key: String(1 /* Webpage */),
                text: react_intl_universal_1.default.get("sources.loadWebpage"),
            },
            {
                key: String(2 /* External */),
                text: react_intl_universal_1.default.get("openExternal"),
            },
        ];
        this.updateSourceName = () => {
            let newName = this.state.newSourceName.trim();
            this.props.updateSourceName(this.state.selectedSource, newName);
            this.setState({
                selectedSource: {
                    ...this.state.selectedSource,
                    name: newName,
                },
            });
        };
        this.updateSourceIcon = () => {
            let newIcon = this.state.newSourceIcon.trim();
            this.props.updateSourceIcon(this.state.selectedSource, newIcon);
            this.setState({
                selectedSource: { ...this.state.selectedSource, iconurl: newIcon },
            });
        };
        this.handleInputChange = event => {
            const name = event.target.name;
            this.setState({ [name]: event.target.value });
        };
        this.addSource = (event) => {
            event.preventDefault();
            let trimmed = this.state.newUrl.trim();
            if ((0, utils_1.urlTest)(trimmed))
                this.props.addSource(trimmed);
        };
        this.onOpenTargetChange = (_, option) => {
            let newTarget = parseInt(option.key);
            this.props.updateSourceOpenTarget(this.state.selectedSource, newTarget);
            this.setState({
                selectedSource: {
                    ...this.state.selectedSource,
                    openTarget: newTarget,
                },
            });
        };
        this.render = () => (React.createElement("div", { className: "tab-body" },
            this.props.serviceOn && (React.createElement(react_1.MessageBar, { messageBarType: react_1.MessageBarType.info }, react_intl_universal_1.default.get("sources.serviceWarning"))),
            React.createElement(react_1.Label, null, react_intl_universal_1.default.get("sources.opmlFile")),
            React.createElement(react_1.Stack, { horizontal: true },
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.PrimaryButton, { onClick: this.props.importOPML, text: react_intl_universal_1.default.get("sources.import") })),
                React.createElement(react_1.Stack.Item, null,
                    React.createElement(react_1.DefaultButton, { onClick: this.props.exportOPML, text: react_intl_universal_1.default.get("sources.export") }))),
            React.createElement("form", { onSubmit: this.addSource },
                React.createElement(react_1.Label, { htmlFor: "newUrl" }, react_intl_universal_1.default.get("sources.add")),
                React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, { grow: true },
                        React.createElement(react_1.TextField, { onGetErrorMessage: v => (0, utils_1.urlTest)(v.trim())
                                ? ""
                                : react_intl_universal_1.default.get("sources.badUrl"), validateOnLoad: false, placeholder: react_intl_universal_1.default.get("sources.inputUrl"), value: this.state.newUrl, id: "newUrl", name: "newUrl", onChange: this.handleInputChange })),
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.PrimaryButton, { disabled: !(0, utils_1.urlTest)(this.state.newUrl.trim()), type: "submit", text: react_intl_universal_1.default.get("add") })))),
            React.createElement(react_1.DetailsList, { compact: Object.keys(this.props.sources).length >= 10, items: Object.values(this.props.sources), columns: this.columns(), getKey: s => s.sid, setKey: "selected", selection: this.selection, selectionMode: react_1.SelectionMode.multiple }),
            this.state.selectedSource && (React.createElement(React.Fragment, null,
                this.state.selectedSource.serviceRef && (React.createElement(react_1.MessageBar, { messageBarType: react_1.MessageBarType.info }, react_intl_universal_1.default.get("sources.serviceManaged"))),
                React.createElement(react_1.Label, null, react_intl_universal_1.default.get("sources.selected")),
                React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(react_1.Dropdown, { options: this.sourceEditOptions(), selectedKey: this.state.sourceEditOption, onChange: this.onSourceEditOptionChange, style: { width: 120 } })),
                    this.state.sourceEditOption ===
                        "n" /* Name */ && (React.createElement(React.Fragment, null,
                        React.createElement(react_1.Stack.Item, { grow: true },
                            React.createElement(react_1.TextField, { onGetErrorMessage: v => v.trim().length == 0
                                    ? react_intl_universal_1.default.get("emptyName")
                                    : "", validateOnLoad: false, placeholder: react_intl_universal_1.default.get("sources.name"), value: this.state.newSourceName, name: "newSourceName", onChange: this.handleInputChange })),
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(react_1.DefaultButton, { disabled: this.state.newSourceName.trim()
                                    .length == 0, onClick: this.updateSourceName, text: react_intl_universal_1.default.get("sources.editName") })))),
                    this.state.sourceEditOption ===
                        "i" /* Icon */ && (React.createElement(React.Fragment, null,
                        React.createElement(react_1.Stack.Item, { grow: true },
                            React.createElement(react_1.TextField, { onGetErrorMessage: v => (0, utils_1.urlTest)(v.trim())
                                    ? ""
                                    : react_intl_universal_1.default.get("sources.badUrl"), validateOnLoad: false, placeholder: react_intl_universal_1.default.get("sources.inputUrl"), value: this.state.newSourceIcon, name: "newSourceIcon", onChange: this.handleInputChange })),
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(react_1.DefaultButton, { disabled: !(0, utils_1.urlTest)(this.state.newSourceIcon.trim()), onClick: this.updateSourceIcon, text: react_intl_universal_1.default.get("edit") })))),
                    this.state.sourceEditOption ===
                        "u" /* Url */ && (React.createElement(React.Fragment, null,
                        React.createElement(react_1.Stack.Item, { grow: true },
                            React.createElement(react_1.TextField, { disabled: true, value: this.state.selectedSource.url })),
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(react_1.DefaultButton, { onClick: () => window.utils.writeClipboard(this.state.selectedSource.url), text: react_intl_universal_1.default.get("context.copy") }))))),
                !this.state.selectedSource.serviceRef && (React.createElement(React.Fragment, null,
                    React.createElement(react_1.Label, null, react_intl_universal_1.default.get("sources.fetchFrequency")),
                    React.createElement(react_1.Stack, null,
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(react_1.Dropdown, { options: this.fetchFrequencyOptions(), selectedKey: this.state.selectedSource
                                    .fetchFrequency
                                    ? String(this.state.selectedSource
                                        .fetchFrequency)
                                    : "0", onChange: this.onFetchFrequencyChange, style: { width: 200 } }))))),
                React.createElement(react_1.ChoiceGroup, { label: react_intl_universal_1.default.get("sources.openTarget"), options: this.sourceOpenTargetChoices(), selectedKey: String(this.state.selectedSource.openTarget), onChange: this.onOpenTargetChange }),
                !this.state.selectedSource.serviceRef && (React.createElement(react_1.Stack, { horizontal: true },
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement(danger_button_1.default, { onClick: () => this.props.deleteSource(this.state.selectedSource), key: this.state.selectedSource.sid, text: react_intl_universal_1.default.get("sources.delete") })),
                    React.createElement(react_1.Stack.Item, null,
                        React.createElement("span", { className: "settings-hint" }, react_intl_universal_1.default.get("sources.deleteWarning"))))))),
            this.state.selectedSources &&
                (this.state.selectedSources.filter(s => s.serviceRef).length ===
                    0 ? (React.createElement(React.Fragment, null,
                    React.createElement(react_1.Label, null, react_intl_universal_1.default.get("sources.selectedMulti")),
                    React.createElement(react_1.Stack, { horizontal: true },
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement(danger_button_1.default, { onClick: () => this.props.deleteSources(this.state.selectedSources), text: react_intl_universal_1.default.get("sources.delete") })),
                        React.createElement(react_1.Stack.Item, null,
                            React.createElement("span", { className: "settings-hint" }, react_intl_universal_1.default.get("sources.deleteWarning")))))) : (React.createElement(react_1.MessageBar, { messageBarType: react_1.MessageBarType.info }, react_intl_universal_1.default.get("sources.serviceManaged"))))));
        this.state = {
            newUrl: "",
            newSourceName: "",
            selectedSource: null,
            selectedSources: null,
        };
        this.selection = new react_1.Selection({
            getKey: s => s.sid,
            onSelectionChanged: () => {
                let count = this.selection.getSelectedCount();
                let sources = count
                    ? this.selection.getSelection()
                    : null;
                this.setState({
                    selectedSource: count === 1 ? sources[0] : null,
                    selectedSources: count > 1 ? sources : null,
                    newSourceName: count === 1 ? sources[0].name : "",
                    newSourceIcon: count === 1 ? sources[0].iconurl || "" : "",
                    sourceEditOption: "n" /* Name */,
                });
            },
        });
    }
}
exports.default = SourcesTab;
