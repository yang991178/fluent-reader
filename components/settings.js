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
const Icon_1 = require("@fluentui/react/lib/Icon");
const Styling_1 = require("@fluentui/react/lib/Styling");
const about_1 = __importDefault(require("./settings/about"));
const react_1 = require("@fluentui/react");
const sources_container_1 = __importDefault(require("../containers/settings/sources-container"));
const groups_container_1 = __importDefault(require("../containers/settings/groups-container"));
const app_container_1 = __importDefault(require("../containers/settings/app-container"));
const rules_container_1 = __importDefault(require("../containers/settings/rules-container"));
const service_container_1 = __importDefault(require("../containers/settings/service-container"));
const utils_1 = require("../scripts/utils");
class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.onKeyDown = (event) => {
            if (event.key === "Escape" && !this.props.exitting)
                this.props.close();
        };
        this.componentDidUpdate = (prevProps) => {
            if (this.props.display !== prevProps.display) {
                if (this.props.display) {
                    if (window.utils.platform === "darwin")
                        window.utils.destroyTouchBar();
                    document.body.addEventListener("keydown", this.onKeyDown);
                }
                else {
                    if (window.utils.platform === "darwin")
                        (0, utils_1.initTouchBarWithTexts)();
                    document.body.removeEventListener("keydown", this.onKeyDown);
                }
            }
        };
        this.render = () => this.props.display && (React.createElement("div", { className: "settings-container" },
            React.createElement("div", { className: "btn-group", style: {
                    position: "absolute",
                    top: 70,
                    left: "calc(50% - 404px)",
                } },
                React.createElement("a", { className: "btn" + (this.props.exitting ? " disabled" : ""), title: react_intl_universal_1.default.get("settings.exit"), onClick: this.props.close },
                    React.createElement(Icon_1.Icon, { iconName: "Back" }))),
            React.createElement("div", { className: "settings " + Styling_1.AnimationClassNames.slideUpIn20 },
                this.props.blocked && (React.createElement(react_1.FocusTrapZone, { isClickableOutsideFocusTrap: true, className: "loading" },
                    React.createElement(react_1.Spinner, { label: react_intl_universal_1.default.get("settings.fetching"), tabIndex: 0 }))),
                React.createElement(react_1.Pivot, null,
                    React.createElement(react_1.PivotItem, { headerText: react_intl_universal_1.default.get("settings.sources"), itemIcon: "Source" },
                        React.createElement(sources_container_1.default, null)),
                    React.createElement(react_1.PivotItem, { headerText: react_intl_universal_1.default.get("settings.grouping"), itemIcon: "GroupList" },
                        React.createElement(groups_container_1.default, null)),
                    React.createElement(react_1.PivotItem, { headerText: react_intl_universal_1.default.get("settings.rules"), itemIcon: "FilterSettings" },
                        React.createElement(rules_container_1.default, null)),
                    React.createElement(react_1.PivotItem, { headerText: react_intl_universal_1.default.get("settings.service"), itemIcon: "CloudImportExport" },
                        React.createElement(service_container_1.default, null)),
                    React.createElement(react_1.PivotItem, { headerText: react_intl_universal_1.default.get("settings.app"), itemIcon: "Settings" },
                        React.createElement(app_container_1.default, null)),
                    React.createElement(react_1.PivotItem, { headerText: react_intl_universal_1.default.get("settings.about"), itemIcon: "Info" },
                        React.createElement(about_1.default, null))))));
    }
}
exports.default = Settings;
