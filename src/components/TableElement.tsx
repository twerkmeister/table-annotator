import {Point, Table} from "../types";
import {useStore} from "../store";
import React from "react";
import {flatten} from "../util";
import ColumnLine from "./ColumnLine";
import CellColumnLine from "./CellColumnLine";
import RowLine from "./RowLine";
import ColumnSetterSpace from "./ColumnSetterSpace";
import RowSetterSpace from "./RowSetterSpace";
import NewColumnLine from "./NewColumnLine";
import NewRowLine from "./NewRowLine";
import CellRowLine from "./CellRowLine";


type TableProps = {
    table: Table
    imageCenter: Point
    tableIdx: number
}

const TableElement = ({table, imageCenter, tableIdx}: TableProps) => {
    const rotationDegrees = useStore(state => state.rotationDegrees)
    const selectTable = useStore(state => state.selectTable)
    const selectedTable = useStore(state => state.selectedTable)
    const tableDeletionMarkCount = useStore(state => state.tableDeletionMarkCount)
    const isSelected = selectedTable !== undefined && selectedTable === tableIdx
    const deletionMarkColors = ["green", "yellow", "red"]
    const borderColor = !isSelected ? "black" : deletionMarkColors[tableDeletionMarkCount] || "red"

    const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault()
        selectTable(tableIdx)
    }

    const body = table.cellGrid === undefined ? (
        <div>
            {table.columns.map((c, i) => {
                return (
                    <ColumnLine key={i} idx={i} position={c} parentTableSelected={isSelected}/>
                )
            })}
            {table.rows.map((r, i) => {
                return (
                    <RowLine key={i} idx={i} position={r} parentTableSelected={isSelected}/>
                )
            })}
            {isSelected ? <ColumnSetterSpace/> : null}
            {isSelected ? <RowSetterSpace/> : null}
            {isSelected ? <NewColumnLine/> : null}
            {isSelected ? <NewRowLine/> : null}
        </div>
    ) : (
        <div>
            {flatten(table.cellGrid.map((row, row_i) => {
                return row.slice(0, -1).map((rect, column_i) => {
                    return <CellColumnLine row={row_i} column={column_i} parentTableSelected={isSelected}
                                           height={rect.bottomRight.y - rect.topLeft.y} left={rect.bottomRight.x}
                                           top={rect.topLeft.y} hasContentAlready={table.cellContents !== undefined}/>
                })
            }))}
            {flatten(table.cellGrid.map((row, row_i) => {
                return row.map((rect, column_i) => {
                    return <CellRowLine width={rect.bottomRight.x - rect.topLeft.x} left={rect.topLeft.x}
                                        top={rect.bottomRight.y}/>
                })
            }))}
        </div>
    )


    return (
        <div className="table"
             style={{transform: `rotate(${rotationDegrees - table.rotationDegrees}deg) ` +
                                `translate(${table.outline.topLeft.x}px, ${table.outline.topLeft.y}px)`,
                 width: `${table.outline.bottomRight.x - table.outline.topLeft.x}px`,
                 height: `${table.outline.bottomRight.y - table.outline.topLeft.y}px`,
                 transformOrigin: `${imageCenter.x}px ${imageCenter.y}px`,
                 borderColor: borderColor,
                 cursor: isSelected ? "default" : "pointer"}}
             onClick={e => handleClick(e)}>
            {body}
        </div>
    )
}


export default TableElement