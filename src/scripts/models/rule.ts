import { FeedFilter, FilterType } from "./feed"
import { RSSItem } from "./item"
import {
    getRuleTargetKey,
    RuleTarget,
    RuleTargetKey,
    SourceGroup,
    StoredRule,
} from "../../schema-types"
import type { AppThunk } from "../utils"

export const enum ItemAction {
    Read = "r",
    Star = "s",
    Hide = "h",
    Notify = "n",
}

export type RuleActions = {
    [type in ItemAction]: boolean
}
export namespace RuleActions {
    export function toKeys(actions: RuleActions): string[] {
        return Object.entries(actions).map(([t, f]) => `${t}-${f}`)
    }

    export function fromKeys(strs: string[]): RuleActions {
        const fromKey = (str: string): [ItemAction, boolean] => {
            let [t, f] = str.split("-") as [ItemAction, string]
            if (f) return [t, f === "true"]
            else return [t, true]
        }
        return Object.fromEntries(strs.map(fromKey)) as RuleActions
    }
}

type ActionTransformType = {
    [type in ItemAction]: (i: RSSItem, f: boolean) => void
}
const actionTransform: ActionTransformType = {
    [ItemAction.Read]: (i, f) => {
        i.hasRead = f
    },
    [ItemAction.Star]: (i, f) => {
        i.starred = f
    },
    [ItemAction.Hide]: (i, f) => {
        i.hidden = f
    },
    [ItemAction.Notify]: (i, f) => {
        i.notify = f
    },
}

export class ArticleRule {
    filter: FeedFilter
    match: boolean
    actions: RuleActions

    constructor(
        regex: string,
        actions: string[],
        filter: FilterType,
        match: boolean
    ) {
        this.filter = new FeedFilter(filter, regex)
        this.match = match
        this.actions = RuleActions.fromKeys(actions)
    }

    static fromStored(rule: StoredRule): ArticleRule {
        return new ArticleRule(
            rule.search,
            rule.actions,
            rule.filter,
            rule.match
        )
    }

    static toStored(rule: ArticleRule): StoredRule {
        return {
            filter: rule.filter.type,
            search: rule.filter.search,
            match: rule.match,
            actions: RuleActions.toKeys(rule.actions),
        }
    }

    static apply(rule: ArticleRule, item: RSSItem) {
        let result = FeedFilter.testItem(rule.filter, item)
        if (result === rule.match) {
            for (let [action, flag] of Object.entries(rule.actions)) {
                actionTransform[action](item, flag)
            }
        }
    }

    static applyAll(rules: ArticleRule[], item: RSSItem) {
        for (let rule of rules) {
            this.apply(rule, item)
        }
    }
}

export type RuleState = Partial<Record<RuleTargetKey, ArticleRule[]>>

const INIT_RULES = "INIT_RULES"
const UPDATE_RULES = "UPDATE_RULES"

type RuleAction =
    | { type: typeof INIT_RULES; rules: RuleState }
    | { type: typeof UPDATE_RULES; key: RuleTargetKey; rules: ArticleRule[] }

export function ruleReducer(
    state: RuleState = {},
    action: RuleAction
): RuleState {
    switch (action.type) {
        case INIT_RULES:
            return action.rules
        case UPDATE_RULES: {
            const rules = { ...state }
            if (action.rules.length > 0) rules[action.key] = action.rules
            else delete rules[action.key]
            return rules
        }
        default:
            return state
    }
}

export function initRules(): AppThunk {
    return dispatch => {
        const rules = Object.fromEntries(
            Object.entries(window.settings.getAllRules()).map(
                ([key, rules]) => [key, rules.map(ArticleRule.fromStored)]
            )
        ) as RuleState
        dispatch({ type: INIT_RULES, rules })
    }
}

export function updateRulesForTarget(
    target: RuleTarget,
    rules: ArticleRule[]
): AppThunk<Promise<void>> {
    return async dispatch => {
        await window.settings.setRulesForTarget(
            target,
            rules.map(ArticleRule.toStored)
        )
        dispatch({ type: UPDATE_RULES, key: getRuleTargetKey(target), rules })
    }
}

// The editor's preview and every fetch path share the same scope precedence.
export function getRulesForTarget(
    rules: RuleState,
    groups: SourceGroup[],
    target: RuleTarget
): ArticleRule[] {
    const result = [...(rules.all || [])]
    if (target.type === "all") return result
    if (target.type === "source") {
        const group = groups.find(
            g => g.isMultiple && g.sids.includes(target.sid)
        )
        if (group) result.push(...(rules[`group:${group.gid}`] || []))
    }
    result.push(...(rules[getRuleTargetKey(target)] || []))
    return result
}
