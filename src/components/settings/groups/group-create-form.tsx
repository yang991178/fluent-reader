import * as React from "react"
import { useState } from "react"
import intl from "react-intl-universal"
import { Button, Field, Input } from "@fluentui/react-components"
import { SourceGroup } from "../../../schema-types"
import { useGroupStyles } from "./styles"

type GroupCreateFormProps = {
    groups: SourceGroup[]
    disabled: boolean
    onCreate: (name: string) => void
}

export function GroupCreateForm({
    groups,
    disabled,
    onCreate,
}: GroupCreateFormProps) {
    const classes = useGroupStyles()
    const [name, setName] = useState("")
    const [touched, setTouched] = useState(false)
    const trimmed = name.trim()
    const error = !trimmed
        ? intl.get("emptyName")
        : groups.some(group => group.isMultiple && group.name === trimmed)
        ? intl.get("groups.exist")
        : ""

    function create(event: React.FormEvent) {
        event.preventDefault()
        if (disabled || error) return
        onCreate(trimmed)
        setName("")
        setTouched(false)
    }

    return (
        <form onSubmit={create}>
            <Field
                label={{
                    children: intl.get("groups.create"),
                    htmlFor: "newGroupName",
                }}
                validationState={touched && error ? "error" : "none"}
                validationMessage={touched ? error : undefined}>
                <div className={classes.row}>
                    <Input
                        className={classes.grow}
                        id="newGroupName"
                        name="newGroupName"
                        placeholder={intl.get("groups.enterName")}
                        value={name}
                        disabled={disabled}
                        onChange={(_, data) => {
                            setName(data.value)
                            setTouched(true)
                        }}
                    />
                    <Button
                        appearance="primary"
                        type="submit"
                        disabled={disabled || !!error}>
                        {intl.get("create")}
                    </Button>
                </div>
            </Field>
        </form>
    )
}
