import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import intl from "react-intl-universal"
import {
    Link,
    MessageBar,
    MessageBarBody,
    Text,
} from "@fluentui/react-components"
import {
    Alert24Regular,
    Filter24Regular,
    MoreHorizontal24Regular,
    Star24Regular,
} from "@fluentui/react-icons"
import { getRuleTargetKey, RuleTarget } from "../../schema-types"
import {
    ArticleRule,
    getRulesForTarget,
    updateRulesForTarget,
} from "../../scripts/models/rule"
import { saveSettings } from "../../scripts/models/app"
import { useAppDispatch, useAppSelector } from "../../scripts/reducer"
import { RuleTargetPicker } from "./rules/target-picker"
import { RuleEditor } from "./rules/rule-editor"
import { RuleList } from "./rules/rule-list"
import { RulePreview } from "./rules/rule-preview"
import { useStyles } from "./rules/styles"

function RulesIntro() {
    const classes = useStyles()
    return (
        <div className={classes.intro}>
            <div className={classes.icons}>
                <Filter24Regular />
                <Star24Regular />
                <Alert24Regular />
                <MoreHorizontal24Regular />
            </div>
            <Text className={classes.hint}>
                {intl.get("rules.intro")}{" "}
                <Link
                    onClick={() =>
                        window.utils.openExternal(
                            "https://github.com/yang991178/fluent-reader/wiki/Support#rules"
                        )
                    }>
                    {intl.get("rules.help")}
                </Link>
            </Text>
        </div>
    )
}

const RulesTab: React.FC = () => {
    const classes = useStyles()
    const dispatch = useAppDispatch()
    const sources = useAppSelector(state => state.sources)
    const groups = useAppSelector(state => state.groups)
    const ruleState = useAppSelector(state => state.rules)
    const [target, setTarget] = useState<RuleTarget>(null)
    const [selected, setSelected] = useState(new Set<number>())
    const [editIndex, setEditIndex] = useState(-1)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const rules = target ? ruleState[getRuleTargetKey(target)] || [] : []
    const editing = target && (editIndex >= 0 || rules.length === 0)
    const effectiveRules = useMemo(
        () => (target ? getRulesForTarget(ruleState, groups, target) : []),
        [ruleState, groups, target]
    )

    function changeTarget(next: RuleTarget) {
        setTarget(next)
        setSelected(new Set())
        setEditIndex(-1)
        setError("")
    }

    useEffect(() => {
        if (!target) return
        const exists =
            target.type === "all" ||
            (target.type === "source"
                ? !!sources[target.sid]
                : groups.some(
                      group => group.isMultiple && group.gid === target.gid
                  ))
        if (!exists) changeTarget(null)
    }, [target, sources, groups])

    async function persist(next: ArticleRule[]) {
        if (saving) return
        setSaving(true)
        dispatch(saveSettings())
        setError("")
        try {
            await dispatch(updateRulesForTarget(target, next))
            setSelected(new Set())
            setEditIndex(-1)
        } catch (err) {
            setError(intl.get("rules.saveError"))
        } finally {
            setSaving(false)
            dispatch(saveSettings())
        }
    }

    function editRule(index: number) {
        if (saving) return
        setError("")
        setEditIndex(index)
    }

    function saveRule(rule: ArticleRule) {
        const next = [...rules]
        if (editIndex < 0) next.push(rule)
        else next.splice(editIndex, 1, rule)
        void persist(next)
    }

    return (
        <div className={`tab-body ${classes.root}`}>
            <RuleTargetPicker
                target={target}
                sources={sources}
                groups={groups}
                saving={saving}
                onChange={changeTarget}
            />
            {error && (
                <MessageBar intent="error">
                    <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
            )}
            {target ? (
                <>
                    {editing ? (
                        <RuleEditor
                            key={`${getRuleTargetKey(target)}:${editIndex}`}
                            rule={rules[editIndex]}
                            saving={saving}
                            onSave={saveRule}
                            onCancel={
                                editIndex >= 0
                                    ? () => {
                                          setEditIndex(-1)
                                          setError("")
                                      }
                                    : undefined
                            }
                        />
                    ) : (
                        <RuleList
                            key={`list:${getRuleTargetKey(target)}`}
                            rules={rules}
                            saving={saving}
                            selected={selected}
                            onSelectionChange={setSelected}
                            onNew={() => editRule(rules.length)}
                            onEdit={editRule}
                            onChange={persist}
                        />
                    )}
                    <Text className={classes.hint}>
                        {intl.get("rules.hint")}
                    </Text>
                    <RulePreview
                        key={`preview:${getRuleTargetKey(target)}`}
                        target={target}
                        rules={effectiveRules}
                        saving={saving}
                    />
                </>
            ) : (
                <RulesIntro />
            )}
        </div>
    )
}

export default RulesTab
