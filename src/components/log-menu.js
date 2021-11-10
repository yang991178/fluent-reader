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
const time_1 = __importDefault(require("./utils/time"));
function getLogIcon(log) {
    switch (log.type) {
        case 0 /* Info */:
            return "Info";
        case 3 /* Article */:
            return "KnowledgeArticle";
        default:
            return "Warning";
    }
}
class LogMenu extends React.Component {
    constructor() {
        super(...arguments);
        this.activityItems = () => this.props.logs
            .map((l, i) => ({
            key: i,
            activityDescription: l.iid ? (React.createElement("b", null,
                React.createElement(react_1.Link, { onClick: () => this.handleArticleClick(l) }, l.title))) : (React.createElement("b", null, l.title)),
            comments: l.details,
            activityIcon: React.createElement(react_1.Icon, { iconName: getLogIcon(l) }),
            timeStamp: React.createElement(time_1.default, { date: l.time }),
        }))
            .reverse();
        this.handleArticleClick = (log) => {
            this.props.close();
            this.props.showItem(log.iid);
        };
    }
    render() {
        return (this.props.display && (React.createElement(react_1.Callout, { target: "#log-toggle", role: "log-menu", directionalHint: react_1.DirectionalHint.bottomCenter, calloutWidth: 320, calloutMaxHeight: 240, onDismiss: this.props.close }, this.props.logs.length == 0 ? (React.createElement("p", { style: { textAlign: "center" } }, react_intl_universal_1.default.get("log.empty"))) : (this.activityItems().map(item => (React.createElement(react_1.ActivityItem, { ...item, key: item.key, style: { margin: 12 } })))))));
    }
}
exports.default = LogMenu;
