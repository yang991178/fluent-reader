import * as React from "react"
import { useEffect, useState } from "react"
import intl from "react-intl-universal"
import { makeStyles, Text, tokens } from "@fluentui/react-components"
import { ArrowLeft16Regular, Delete16Regular } from "@fluentui/react-icons"
import { SourceGroup } from "../../../schema-types"
import { SourceState } from "../../../scripts/models/source"
import { FlatButton } from "../../utils/FlatButton"
import { FlatButtonGroup } from "../../utils/FlatButtonGroup"
import { FlatButtonSeparator } from "../../utils/FlatButtonSeparator"
import { GroupSourceList } from "./group-source-list"
import { useGroupStyles } from "./styles"

const useStyles = makeStyles({
    delete: { color: tokens.colorPaletteRedForeground1 },
})

type GroupEditorProps = {
    group: SourceGroup
    sources: SourceState
    disabled: boolean
    onBack: () => void
    onRemove: (sids: number[]) => void
    onReorder: (sids: number[]) => void
}

export function GroupEditor({
    group,
    sources,
    disabled,
    onBack,
    onRemove,
    onReorder,
}: GroupEditorProps) {
    const classes = useGroupStyles()
    const styles = useStyles()
    const [selected, setSelected] = useState(new Set<number>())
    const members = group.sids.map(sid => sources[sid]).filter(Boolean)
    useEffect(() => {
        setSelected(
            current =>
                new Set([...current].filter(sid => group.sids.includes(sid)))
        )
    }, [group.sids])

    return (
        <>
            <FlatButtonGroup styleClass={classes.toolbar}>
                <FlatButton
                    title={intl.get("groups.exitGroup")}
                    disabled={disabled}
                    styleClass={classes.toolbarButton}
                    onClick={onBack}>
                    <ArrowLeft16Regular />
                    {intl.get("groups.exitGroup")}
                </FlatButton>
                {selected.size > 0 && (
                    <>
                        <FlatButtonSeparator
                            styleClass={classes.toolbarSeparator}
                        />
                        <FlatButton
                            title={intl.get("groups.deleteSource")}
                            disabled={disabled}
                            styleClass={classes.toolbarButton}
                            onClick={() => onRemove([...selected])}>
                            <Delete16Regular className={styles.delete} />
                            {intl.get("groups.deleteSource")}
                        </FlatButton>
                    </>
                )}
            </FlatButtonGroup>
            <Text weight="semibold">{group.name}</Text>
            <GroupSourceList
                sources={members}
                selected={selected}
                disabled={disabled}
                onSelect={setSelected}
                onReorder={onReorder}
            />
            <Text className={classes.hint}>
                {intl.get("groups.sourceHint")}
            </Text>
        </>
    )
}
