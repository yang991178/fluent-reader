import * as React from "react"
import { useEffect, useState } from "react"
import intl from "react-intl-universal"
import {
    Button,
    Dropdown,
    Field,
    Input,
    Option,
} from "@fluentui/react-components"
import { SourceGroup } from "../../../schema-types"
import { DangerButton } from "../../utils/DangerButton"
import { useGroupStyles } from "./styles"

type GroupNameFormProps = {
    group: SourceGroup
    disabled: boolean
    onRename: (name: string) => void
    onEdit: () => void
    onDelete: () => void
}

export function GroupNameForm({
    group,
    disabled,
    onRename,
    onEdit,
    onDelete,
}: GroupNameFormProps) {
    const classes = useGroupStyles()
    const [name, setName] = useState(group.name)
    useEffect(() => setName(group.name), [group.name])
    const error = name.trim() ? "" : intl.get("emptyName")

    return (
        <form
            onSubmit={event => {
                event.preventDefault()
                if (!disabled && !error) onRename(name.trim())
            }}>
            <Field
                label={intl.get("groups.selectedGroup")}
                validationState={error ? "error" : "none"}
                validationMessage={error || undefined}>
                <div className={classes.row}>
                    <Input
                        className={classes.grow}
                        name="editGroupName"
                        placeholder={intl.get("groups.enterName")}
                        disabled={disabled}
                        value={name}
                        onChange={(_, data) => setName(data.value)}
                    />
                    <Button type="submit" disabled={disabled || !!error}>
                        {intl.get("groups.editName")}
                    </Button>
                    <Button
                        appearance="primary"
                        type="button"
                        disabled={disabled}
                        onClick={onEdit}>
                        {intl.get("groups.editGroup")}
                    </Button>
                    <DangerButton
                        text={intl.get("delete")}
                        disabled={disabled}
                        onClick={onDelete}
                    />
                </div>
            </Field>
        </form>
    )
}

type SourceGroupPickerProps = {
    groups: SourceGroup[]
    disabled: boolean
    onAdd: (gid: number) => void
}

export function SourceGroupPicker({
    groups,
    disabled,
    onAdd,
}: SourceGroupPickerProps) {
    const classes = useGroupStyles()
    const [gid, setGid] = useState<number>(null)
    const destinations = groups.filter(group => group.isMultiple)
    const destination = destinations.find(group => group.gid === gid)

    return (
        <Field label={intl.get("groups.selectedSource")}>
            <div className={classes.row}>
                <Dropdown
                    inlinePopup
                    className={classes.grow}
                    disabled={disabled || destinations.length === 0}
                    placeholder={intl.get("groups.chooseGroup")}
                    value={destination?.name || ""}
                    selectedOptions={destination ? [String(gid)] : []}
                    onOptionSelect={(_, data) =>
                        setGid(Number(data.optionValue))
                    }>
                    {destinations.map(group => (
                        <Option key={group.gid} value={String(group.gid)}>
                            {group.name}
                        </Option>
                    ))}
                </Dropdown>
                <Button
                    disabled={disabled || !destination}
                    onClick={() => onAdd(destination.gid)}>
                    {intl.get("groups.addToGroup")}
                </Button>
            </div>
        </Field>
    )
}
