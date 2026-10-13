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
import { Image16Regular } from "@fluentui/react-icons"
import { RSSSource } from "../../../scripts/models/source"
import { useGroupStyles } from "./styles"

const useStyles = makeStyles({
    iconColumn: { flex: "0 0 32px" },
    nameColumn: { flex: "0 0 180px" },
    icon: { width: "16px", height: "16px" },
})

type GroupSourceListProps = {
    sources: RSSSource[]
    selected: Set<number>
    disabled: boolean
    onSelect: (sids: Set<number>) => void
    onReorder: (sids: number[]) => void
}

export function GroupSourceList({
    sources,
    selected,
    disabled,
    onSelect,
    onReorder,
}: GroupSourceListProps) {
    const classes = useGroupStyles()
    const styles = useStyles()
    const dragged = useRef<number[]>([])
    const selectionAnchor = useRef<number>(null)
    const columns = useMemo(
        () => [
            createTableColumn<RSSSource>({
                columnId: "icon",
                renderHeaderCell: () => (
                    <Image16Regular aria-label={intl.get("icon")} />
                ),
                renderCell: source =>
                    source.iconurl && (
                        <img
                            src={source.iconurl}
                            className={styles.icon}
                            alt=""
                        />
                    ),
            }),
            createTableColumn<RSSSource>({
                columnId: "name",
                renderHeaderCell: () => intl.get("name"),
                renderCell: source => source.name,
            }),
            createTableColumn<RSSSource>({
                columnId: "url",
                renderHeaderCell: () => "URL",
                renderCell: source => source.url,
            }),
        ],
        [styles.icon]
    )
    const columnClass = (id: string | number) =>
        id === "icon"
            ? styles.iconColumn
            : id === "name"
            ? styles.nameColumn
            : undefined

    function selectSource(
        event: React.MouseEvent,
        sid: number,
        additive = false
    ) {
        if (disabled) return
        const anchorIndex = sources.findIndex(
            source => source.sid === selectionAnchor.current
        )
        const index = sources.findIndex(source => source.sid === sid)
        let next = new Set<number>()
        if (event.shiftKey && anchorIndex >= 0) {
            if (event.ctrlKey || event.metaKey) next = new Set(selected)
            sources
                .slice(
                    Math.min(anchorIndex, index),
                    Math.max(anchorIndex, index) + 1
                )
                .forEach(source => next.add(source.sid))
        } else {
            if (additive || event.ctrlKey || event.metaKey) {
                next = new Set(selected)
                if (next.has(sid)) next.delete(sid)
                else next.add(sid)
            } else next.add(sid)
            selectionAnchor.current = sid
        }
        onSelect(next)
    }

    function reorder(index: number) {
        const sids = dragged.current
        dragged.current = []
        if (disabled || !sids.length || sids.includes(sources[index]?.sid))
            return
        const next = sources
            .map(source => source.sid)
            .filter(sid => !sids.includes(sid))
        next.splice(index, 0, ...sids)
        onReorder(next)
    }

    return (
        <div
            className={classes.grid}
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
                event.preventDefault()
                reorder(sources.length)
            }}>
            <DataGrid
                size="small"
                items={sources}
                columns={columns}
                getRowId={source => source.sid}
                selectionMode="multiselect"
                selectedItems={selected}
                onSelectionChange={(_, data) => {
                    if (!disabled) onSelect(data.selectedItems as Set<number>)
                }}>
                <DataGridHeader>
                    <DataGridRow
                        selectionCell={{
                            checkboxIndicator: {
                                "aria-label": intl.get(
                                    "groups.selectAllSources"
                                ),
                            },
                        }}>
                        {({ columnId, renderHeaderCell }) => (
                            <DataGridHeaderCell
                                className={columnClass(columnId)}>
                                {renderHeaderCell()}
                            </DataGridHeaderCell>
                        )}
                    </DataGridRow>
                </DataGridHeader>
                <DataGridBody<RSSSource>>
                    {({ item }) => (
                        <DataGridRow<RSSSource>
                            key={item.sid}
                            className={classes.draggable}
                            draggable={!disabled}
                            selectionCell={{
                                checkboxIndicator: { "aria-label": item.name },
                                onClick: event => {
                                    event.stopPropagation()
                                    selectSource(event, item.sid, true)
                                },
                            }}
                            onClick={event => selectSource(event, item.sid)}
                            onDragStart={event => {
                                dragged.current = selected.has(item.sid)
                                    ? sources
                                          .filter(source =>
                                              selected.has(source.sid)
                                          )
                                          .map(source => source.sid)
                                    : [item.sid]
                                event.dataTransfer.effectAllowed = "move"
                                event.dataTransfer.setData(
                                    "text/plain",
                                    String(item.sid)
                                )
                            }}
                            onDragEnd={() => {
                                dragged.current = []
                            }}
                            onDragOver={event => event.preventDefault()}
                            onDrop={event => {
                                event.preventDefault()
                                event.stopPropagation()
                                reorder(
                                    sources.findIndex(
                                        source => source.sid === item.sid
                                    )
                                )
                            }}>
                            {({ columnId, renderCell }) => (
                                <DataGridCell
                                    className={columnClass(columnId)}
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
