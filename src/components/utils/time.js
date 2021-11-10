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
class Time extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { now: new Date() };
    }
    componentDidMount() {
        this.timerID = setInterval(() => this.tick(), 60000);
    }
    componentWillUnmount() {
        clearInterval(this.timerID);
    }
    tick() {
        this.setState({ now: new Date() });
    }
    displayTime(past, now) {
        // difference in seconds
        let diff = (now.getTime() - past.getTime()) / 60000;
        if (diff < 1)
            return react_intl_universal_1.default.get("time.now");
        else if (diff < 60)
            return Math.floor(diff) + react_intl_universal_1.default.get("time.m");
        else if (diff < 1440)
            return Math.floor(diff / 60) + react_intl_universal_1.default.get("time.h");
        else
            return Math.floor(diff / 1440) + react_intl_universal_1.default.get("time.d");
    }
    render() {
        return (React.createElement("span", { className: "time" }, this.displayTime(this.props.date, this.state.now)));
    }
}
exports.default = Time;
