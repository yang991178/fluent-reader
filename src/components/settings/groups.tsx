import * as React from "react"
import { useEffect, useState } from "react"
import intl from "react-intl-universal"
import {
    Button,
    makeStyles,
    MessageBar,
    MessageBarActions,
    MessageBarBody,
    Text,
} from "@fluentui/react-components"
import { SyncService } from "../../schema-types"
import {
    addSourceToGroup,
    createSourceGroup,
    deleteSourceGroup,
    removeSourceFromGroup,
    reorderSourceGroups,
    updateSourceGroup,
} from "../../scripts/models/group"
import { importGroups } from "../../scripts/models/service"
import { useAppDispatch, useAppSelector } from "../../scripts/reducer"
import { GroupCreateForm } from "./groups/group-create-form"
import { GroupEditor } from "./groups/group-editor"
import { GroupList } from "./groups/group-list"
import { GroupNameForm, SourceGroupPicker } from "./groups/group-actions"
import { useGroupStyles } from "./groups/styles"

const useStyles = makeStyles({
    root: { display: "flex", flexDirection: "column", gap: "16px" },
})

const GroupsTab: React.FC = () => {
    const dispatch = useAppDispatch()
    const classes = useStyles()
    const shared = useGroupStyles()
    const groups = useAppSelector(state => state.groups)
    const sources = useAppSelector(state => state.sources)
    const serviceOn = useAppSelector(
        state => state.service.type !== SyncService.None
    )
    const disabled = useAppSelector(
        state => state.app.settings.saving || state.app.syncing
    )
    const [selectedGid, setSelectedGid] = useState<number>(null)
    const [managing, setManaging] = useState(false)
    const selectedGroup = groups.find(group => group.gid === selectedGid)

    useEffect(() => {
        if (selectedGid !== null && !selectedGroup) {
            setSelectedGid(null)
            setManaging(false)
        }
    }, [selectedGid, selectedGroup])

    const editGroup = (gid: number) => {
        if (disabled) return
        setSelectedGid(gid)
        setManaging(true)
    }

    return (
        <div className={`tab-body ${classes.root}`}>
            {managing && selectedGroup?.isMultiple ? (
                <GroupEditor
                    key={selectedGroup.gid}
                    group={selectedGroup}
                    sources={sources}
                    disabled={disabled}
                    onBack={() => setManaging(false)}
                    onReorder={sids =>
                        dispatch(updateSourceGroup({ ...selectedGroup, sids }))
                    }
                    onRemove={sids => {
                        dispatch(removeSourceFromGroup(selectedGroup.gid, sids))
                        setSelectedGid(null)
                        setManaging(false)
                    }}
                />
            ) : (
                <>
                    {serviceOn && (
                        <MessageBar intent="info">
                            <MessageBarBody>
                                {intl.get("service.groupsWarning")}
                            </MessageBarBody>
                            <MessageBarActions>
                                <Button
                                    appearance="transparent"
                                    disabled={disabled}
                                    onClick={() =>
                                        void dispatch(importGroups())
                                    }>
                                    {intl.get("service.importGroups")}
                                </Button>
                            </MessageBarActions>
                        </MessageBar>
                    )}
                    <GroupCreateForm
                        groups={groups}
                        disabled={disabled}
                        onCreate={name => {
                            dispatch(createSourceGroup(name))
                            setSelectedGid(null)
                        }}
                    />
                    <GroupList
                        groups={groups}
                        sources={sources}
                        selectedGid={selectedGid}
                        disabled={disabled}
                        onSelect={setSelectedGid}
                        onEdit={editGroup}
                        onReorder={next => dispatch(reorderSourceGroups(next))}
                    />
                    {selectedGroup ? (
                        selectedGroup.isMultiple ? (
                            <GroupNameForm
                                key={selectedGroup.gid}
                                group={selectedGroup}
                                disabled={disabled}
                                onRename={name =>
                                    dispatch(
                                        updateSourceGroup({
                                            ...selectedGroup,
                                            name,
                                        })
                                    )
                                }
                                onEdit={() => editGroup(selectedGroup.gid)}
                                onDelete={() =>
                                    void dispatch(
                                        deleteSourceGroup(selectedGroup.gid)
                                    )
                                }
                            />
                        ) : (
                            <SourceGroupPicker
                                key={selectedGroup.gid}
                                groups={groups}
                                disabled={disabled}
                                onAdd={gid =>
                                    dispatch(
                                        addSourceToGroup(
                                            gid,
                                            selectedGroup.sids[0]
                                        )
                                    )
                                }
                            />
                        )
                    ) : (
                        <Text className={shared.hint}>
                            {intl.get("groups.groupHint")}
                        </Text>
                    )}
                </>
            )}
        </div>
    )
}

export default GroupsTab
