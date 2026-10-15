import * as React from "react"
import intl from "react-intl-universal"
import {
    Dropdown,
    Field,
    Option,
    OptionGroup,
} from "@fluentui/react-components"
import {
    getRuleTargetKey,
    RuleTarget,
    SourceGroup,
} from "../../../schema-types"
import { SourceState } from "../../../scripts/models/source"
import { useStyles } from "./styles"

type RuleTargetPickerProps = {
    target: RuleTarget
    sources: SourceState
    groups: SourceGroup[]
    saving: boolean
    onChange: (target: RuleTarget) => void
}

export function RuleTargetPicker({
    target,
    sources,
    groups,
    saving,
    onChange,
}: RuleTargetPickerProps) {
    const classes = useStyles()
    const namedGroups = groups.filter(group => group.isMultiple)
    const targetName = !target
        ? ""
        : target.type === "all"
        ? intl.get("allArticles")
        : target.type === "source"
        ? sources[target.sid]?.name || ""
        : namedGroups.find(group => group.gid === target.gid)?.name || ""
    const targetIcon =
        target?.type === "source" ? sources[target.sid]?.iconurl : undefined

    return (
        <Field label={intl.get("rules.target")}>
            <Dropdown
                inlinePopup
                className={classes.dropdown}
                disabled={saving}
                placeholder={intl.get("rules.selectTarget")}
                selectedOptions={target ? [getRuleTargetKey(target)] : []}
                value={targetName}
                button={
                    targetIcon
                        ? {
                              children: (
                                  <span className={classes.targetValue}>
                                      <img
                                          src={targetIcon}
                                          className={classes.icon}
                                          alt=""
                                      />
                                      <span className={classes.targetLabel}>
                                          {targetName}
                                      </span>
                                  </span>
                              ),
                          }
                        : undefined
                }
                onOptionSelect={(_, data) => {
                    const [type, id] = data.optionValue.split(":")
                    onChange(
                        type === "all"
                            ? { type: "all" }
                            : type === "group"
                            ? { type: "group", gid: Number(id) }
                            : { type: "source", sid: Number(id) }
                    )
                }}>
                <OptionGroup>
                    <Option value="all">{intl.get("allArticles")}</Option>
                </OptionGroup>
                {namedGroups.length > 0 && (
                    <OptionGroup label={intl.get("groups.group")}>
                        {namedGroups.map(group => (
                            <Option
                                key={group.gid}
                                value={`group:${group.gid}`}>
                                {group.name}
                            </Option>
                        ))}
                    </OptionGroup>
                )}
                {Object.keys(sources).length > 0 && (
                    <OptionGroup label={intl.get("groups.source")}>
                        {Object.values(sources).map(source => (
                            <Option
                                key={source.sid}
                                value={`source:${source.sid}`}
                                text={source.name}>
                                {source.iconurl && (
                                    <img
                                        src={source.iconurl}
                                        className={classes.icon}
                                        alt=""
                                    />
                                )}
                                {source.name}
                            </Option>
                        ))}
                    </OptionGroup>
                )}
            </Dropdown>
        </Field>
    )
}
