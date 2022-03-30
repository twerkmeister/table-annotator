import {Point, Table} from "../types";
import {useStore} from "../store";
import React from "react";
import styled from 'styled-components'
import CellColumnLine from "./CellColumnLine";
import ColumnSetterSpace from "./ColumnSetterSpace";
import RowSetterSpace from "./RowSetterSpace";
import NewColumnLine from "./NewColumnLine";
import NewRowLine from "./NewRowLine";
import CellRowLine from "./CellRowLine";
import {calculateCellRectangle} from "../geometry"


export const TableDiv = styled.div`
  position: absolute;
  border-style: solid;
  border-width: 5px;
`


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


    const body = (
        <div>
            {table.cells.flatMap((row, row_i) => {
                return row.slice(0, -1).map((cell, column_i) => {
                    const rect = calculateCellRectangle(cell, {row: row_i, column: column_i}, table)
                    return <CellColumnLine row={row_i} column={column_i} parentTableSelected={isSelected}
                                           height={rect.bottomRight.y - rect.topLeft.y} left={rect.bottomRight.x}
                                           top={rect.topLeft.y} hasContentAlready={false}/>
                })
            })}
            {table.cells.slice(0, -1).flatMap((row, row_i) => {
                return row.map((cell, column_i) => {
                    const rect = calculateCellRectangle(cell, {row: row_i, column: column_i}, table)
                    return <CellRowLine width={rect.bottomRight.x - rect.topLeft.x} left={rect.topLeft.x}
                                        top={rect.bottomRight.y}/>
                })
            })}
        </div>
    )


    return (
        <TableDiv
             style={{transform: `rotate(${rotationDegrees - table.rotationDegrees}deg) ` +
                                `translate(${table.outline.topLeft.x}px, ${table.outline.topLeft.y}px)`,
                 width: `${table.outline.bottomRight.x - table.outline.topLeft.x}px`,
                 height: `${table.outline.bottomRight.y - table.outline.topLeft.y}px`,
                 transformOrigin: `${imageCenter.x}px ${imageCenter.y}px`,
                 borderColor: borderColor,
                 cursor: isSelected ? "default" : "pointer"}}
             onClick={e => handleClick(e)}>
            {body}
            {isSelected ? <ColumnSetterSpace/> : null}
            {isSelected ? <RowSetterSpace/> : null}
            {isSelected ? <NewColumnLine/> : null}
            {isSelected ? <NewRowLine/> : null}
        </TableDiv>
    )
}


export default TableElement