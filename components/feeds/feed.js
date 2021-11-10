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
exports.Feed = void 0;
const React = __importStar(require("react"));
const cards_feed_1 = __importDefault(require("./cards-feed"));
const list_feed_1 = __importDefault(require("./list-feed"));
class Feed extends React.Component {
    render() {
        switch (this.props.viewType) {
            case 0 /* Cards */:
                return React.createElement(cards_feed_1.default, { ...this.props });
            case 2 /* Magazine */:
            case 3 /* Compact */:
            case 1 /* List */:
                return React.createElement(list_feed_1.default, { ...this.props });
        }
    }
}
exports.Feed = Feed;
