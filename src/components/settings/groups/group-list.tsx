import * as React from "react"
import { useMemo, useRef } from "react"
import intl from "react-intl-universal"
import {
    createTableColumn,
    DataGrid,
    DataGridBody,
    DataGridCell,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridRow,
    makeStyles,
} from "@fluentui/react-components"
import { SourceGroup } from "../../../schema-types"
import { SourceState } from "../../../scripts/models/source"
import { useGroupStyles } from "./styles"

const useStyles = makeStyles({
    narrow: { flex: "0 0 80px" },
})

type GroupListProps = {
    groups: SourceGroup[]
    sources: SourceState
    selectedGid: number
    disabled: boolean
    onSelect: (gid: number) => void
    onEdit: (gid: number) => void
    onReorder: (groups: SourceGroup[]) => void
}

export function GroupList({
    groups,
    sources,
    selectedGid,
    disabled,
    onSelect,
    onEdit,
    onReorder,
}: GroupListProps) {
    const classes = useGroupStyles()
    const styles = useStyles()
    const dragged = useRef<number>(null)
    const name = (group: SourceGroup) =>
        group.isMultiple ? group.name : sources[group.sids[0]]?.name || ""
    const columns = useMemo(
        () => [
            createTableColumn<SourceGroup>({
                columnId: "type",
                renderHeaderCell: () => intl.get("groups.type"),
                renderCell: group =>
                    intl.get(
                        group.isMultiple ? "groups.group" : "groups.source"
                    ),
            }),
            createTableColumn<SourceGroup>({
                columnId: "capacity",
                renderHeaderCell: () => intl.get("groups.capacity"),
                renderCell: group =>
                    group.isMultiple ? group.sids.length : "",
            }),
            createTableColumn<SourceGroup>({
                columnId: "name",
                renderHeaderCell: () => intl.get("name"),
                renderCell: name,
            }),
        ],
        [sources]
    )

    function reorder(index: number) {
        const gid = dragged.current
        dragged.current = null
        const group = groups.find(group => group.gid === gid)
        if (disabled || !group || groups[index]?.gid === gid) return
        const next = groups.filter(group => group.gid !== gid)
        next.splice(index, 0, group)
        onReorder(next)
        onSelect(null)
    }

    return (
        <div
            className={classes.grid}
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
                event.preventDefault()
                reorder(groups.length)
            }}>
            <DataGrid
                size="small"
                items={groups}
                columns={columns}
                getRowId={group => group.gid}
                selectionMode="single"
                selectedItems={
                    new Set(selectedGid === null ? [] : [selectedGid])
                }
                onSelectionChange={(_, data) => {
                    if (disabled) return
                    const gid = data.selectedItems.values().next().value
                    onSelect(gid === undefined ? null : Number(gid))
                }}>
                <DataGridHeader>
                    <DataGridRow>
                        {({ columnId, renderHeaderCell }) => (
                            <DataGridHeaderCell
                                className={
                                    columnId !== "name"
                                        ? styles.narrow
                                        : undefined
                                }>
                                {renderHeaderCell()}
                            </DataGridHeaderCell>
                        )}
                    </DataGridRow>
                </DataGridHeader>
                <DataGridBody<SourceGroup>>
                    {({ item }) => (
                        <DataGridRow<SourceGroup>
                            key={item.gid}
                            className={classes.draggable}
                            draggable={!disabled}
                            selectionCell={{
                                radioIndicator: {
                                    "aria-label": name(item),
                                },
                            }}
                            onDoubleClick={() => {
                                if (!disabled && item.isMultiple)
                                    onEdit(item.gid)
                            }}
                            onKeyDown={event => {
                                if (
                                    event.key === "Enter" &&
                                    !disabled &&
                                    item.isMultiple
                                ) {
                                    event.preventDefault()
                                    onEdit(item.gid)
                                }
                            }}
                            onDragStart={event => {
                                dragged.current = item.gid
                                event.dataTransfer.effectAllowed = "move"
                                event.dataTransfer.setData(
                                    "text/plain",
                                    String(item.gid)
                                )
                            }}
                            onDragEnd={() => {
                                dragged.current = null
                            }}
                            onDragOver={event => event.preventDefault()}
                            onDrop={event => {
                                event.preventDefault()
                                event.stopPropagation()
                                reorder(
                                    groups.findIndex(
                                        group => group.gid === item.gid
                                    )
                                )
                            }}>
                            {({ columnId, renderCell }) => (
                                <DataGridCell
                                    className={
                                        columnId !== "name"
                                            ? styles.narrow
                                            : undefined
                                    }
                                    role={
                                        columnId === "name"
                                            ? "rowheader"
                                            : "gridcell"
                                    }>
                                    {renderCell(item)}
                                </DataGridCell>
                            )}
                        </DataGridRow>
                    )}
                </DataGridBody>
            </DataGrid>
        </div>
    )
}
