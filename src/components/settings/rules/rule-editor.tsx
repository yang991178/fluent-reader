import * as React from "react"
import { useState } from "react"
import intl from "react-intl-universal"
import {
    Button,
    Dropdown,
    Field,
    Input,
    Option,
    OptionGroup,
    Text,
    ToggleButton,
} from "@fluentui/react-components"
import { ArticleRule, RuleActions } from "../../../scripts/models/rule"
import { FilterType } from "../../../scripts/models/feed"
import { validateRegex } from "../../../scripts/utils"
import { actionGroups, actionKeyMap } from "./actions"
import { useStyles } from "./styles"

type RuleEditorProps = {
    rule?: ArticleRule
    saving: boolean
    onSave: (rule: ArticleRule) => void
    onCancel?: () => void
}

export function RuleEditor({
    rule,
    saving,
    onSave,
    onCancel,
}: RuleEditorProps) {
    const classes = useStyles()
    const [regex, setRegex] = useState(rule?.filter.search || "")
    const [touched, setTouched] = useState(false)
    const [searchType, setSearchType] = useState(
        rule?.filter.type & FilterType.FullSearch
            ? "1"
            : rule?.filter.type & FilterType.CreatorSearch
            ? "2"
            : "0"
    )
    const [caseSensitive, setCaseSensitive] = useState(
        rule ? !(rule.filter.type & FilterType.CaseInsensitive) : false
    )
    const [match, setMatch] = useState(rule ? rule.match : true)
    const [actionKeys, setActionKeys] = useState<string[]>(
        rule ? RuleActions.toKeys(rule.actions) : []
    )
    const searchOptions = ["rules.title", "rules.fullSearch", "rules.creator"]
    const regexError =
        regex.length === 0
            ? intl.get("emptyField")
            : validateRegex(regex) === null
            ? intl.get("rules.badRegex")
            : ""
    function saveRule() {
        if (regexError || actionKeys.length === 0) return
        let filter = FilterType.Default | FilterType.ShowHidden
        if (!caseSensitive) filter |= FilterType.CaseInsensitive
        if (searchType === "1") filter |= FilterType.FullSearch
        else if (searchType === "2") filter |= FilterType.CreatorSearch
        const rule = new ArticleRule(regex, actionKeys, filter, match)
        onSave(rule)
    }

    return (
        <fieldset className={classes.fieldset} disabled={saving}>
            <Text weight="semibold">
                {intl.get(rule !== undefined ? "edit" : "rules.new")}
            </Text>
            <div className={classes.row}>
                <Field
                    className={classes.search}
                    label={intl.get("rules.searchField")}>
                    <Dropdown
                        inlinePopup
                        className={classes.dropdown}
                        disabled={saving}
                        value={intl.get(searchOptions[Number(searchType)])}
                        selectedOptions={[searchType]}
                        onOptionSelect={(_, data) =>
                            setSearchType(data.optionValue)
                        }>
                        {searchOptions.map((key, index) => (
                            <Option key={key} value={String(index)}>
                                {intl.get(key)}
                            </Option>
                        ))}
                    </Dropdown>
                </Field>
                <Field
                    className={classes.match}
                    label={intl.get("rules.matchCondition")}>
                    <Dropdown
                        inlinePopup
                        className={classes.dropdown}
                        disabled={saving}
                        value={intl.get(
                            match ? "rules.match" : "rules.notMatch"
                        )}
                        selectedOptions={[match ? "1" : "0"]}
                        onOptionSelect={(_, data) =>
                            setMatch(data.optionValue === "1")
                        }>
                        <Option value="1">{intl.get("rules.match")}</Option>
                        <Option value="0">{intl.get("rules.notMatch")}</Option>
                    </Dropdown>
                </Field>
                <Field
                    className={classes.grow}
                    label={intl.get("rules.regex")}
                    validationState={touched && regexError ? "error" : "none"}
                    validationMessage={touched ? regexError : undefined}>
                    <Input
                        value={regex}
                        placeholder={intl.get("rules.regex")}
                        onChange={(_, data) => {
                            setRegex(data.value)
                            setTouched(true)
                        }}
                        contentAfter={
                            <ToggleButton
                                appearance="transparent"
                                size="small"
                                checked={caseSensitive}
                                title={intl.get("context.caseSensitive")}
                                aria-label={intl.get("context.caseSensitive")}
                                onClick={() =>
                                    setCaseSensitive(value => !value)
                                }>
                                Aa
                            </ToggleButton>
                        }
                    />
                </Field>
            </div>
            <Field label={intl.get("rules.action")}>
                <Dropdown
                    inlinePopup
                    className={classes.dropdown}
                    multiselect
                    disabled={saving}
                    placeholder={intl.get("rules.selectAction")}
                    selectedOptions={actionKeys}
                    value={actionKeys
                        .map(key => intl.get(actionKeyMap[key]))
                        .join(", ")}
                    onOptionSelect={(_, data) => {
                        if (!data.optionValue) return
                        const key = data.optionValue
                        setActionKeys(keys =>
                            data.selectedOptions.includes(key)
                                ? [
                                      ...keys.filter(
                                          current =>
                                              !current.startsWith(
                                                  `${key.split("-")[0]}-`
                                              )
                                      ),
                                      key,
                                  ]
                                : keys.filter(current => current !== key)
                        )
                    }}>
                    {actionGroups.map(keys => (
                        <OptionGroup key={keys[0]}>
                            {keys.map(key => (
                                <Option key={key} value={key}>
                                    {intl.get(actionKeyMap[key])}
                                </Option>
                            ))}
                        </OptionGroup>
                    ))}
                </Dropdown>
            </Field>
            <div className={classes.row}>
                <Button
                    appearance="primary"
                    disabled={saving || !!regexError || actionKeys.length === 0}
                    onClick={saveRule}>
                    {intl.get("rules.save")}
                </Button>
                {onCancel && (
                    <Button disabled={saving} onClick={onCancel}>
                        {intl.get("cancel")}
                    </Button>
                )}
            </div>
        </fieldset>
    )
}
