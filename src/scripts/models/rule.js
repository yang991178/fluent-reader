"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceRule = exports.RuleActions = void 0;
const feed_1 = require("./feed");
var RuleActions;
(function (RuleActions) {
    function toKeys(actions) {
        return Object.entries(actions).map(([t, f]) => `${t}-${f}`);
    }
    RuleActions.toKeys = toKeys;
    function fromKeys(strs) {
        const fromKey = (str) => {
            let [t, f] = str.split("-");
            if (f)
                return [t, f === "true"];
            else
                return [t, true];
        };
        return Object.fromEntries(strs.map(fromKey));
    }
    RuleActions.fromKeys = fromKeys;
})(RuleActions = exports.RuleActions || (exports.RuleActions = {}));
const actionTransform = {
    ["r" /* Read */]: (i, f) => {
        i.hasRead = f;
    },
    ["s" /* Star */]: (i, f) => {
        i.starred = f;
    },
    ["h" /* Hide */]: (i, f) => {
        i.hidden = f;
    },
    ["n" /* Notify */]: (i, f) => {
        i.notify = f;
    },
};
class SourceRule {
    constructor(regex, actions, filter, match) {
        this.filter = new feed_1.FeedFilter(filter, regex);
        this.match = match;
        this.actions = RuleActions.fromKeys(actions);
    }
    static apply(rule, item) {
        let result = feed_1.FeedFilter.testItem(rule.filter, item);
        if (result === rule.match) {
            for (let [action, flag] of Object.entries(rule.actions)) {
                actionTransform[action](item, flag);
            }
        }
    }
    static applyAll(rules, item) {
        for (let rule of rules) {
            this.apply(rule, item);
        }
    }
}
exports.SourceRule = SourceRule;
