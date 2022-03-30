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
import ColumnKnob from "./ColumnKnob";
import {calculateCellRectangle, height, width} from "../geometry"
import RowKnob from "./RowKnob";


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
            {table.cells.flatMap((row, i) => {
                return row.flatMap((cell, j) => {
                    const rect = calculateCellRectangle(cell, {row: i, column: j}, table)
                    const cellLines = [
                        <CellRowLine row={i} column={j} parentTableSelected={isSelected}
                                     width={width(rect)} left={rect.topLeft.x}
                                     top={rect.bottomRight.y}/>,
                        <CellColumnLine row={i} column={j} parentTableSelected={isSelected}
                                        height={height(rect)} left={rect.bottomRight.x}
                                        top={rect.topLeft.y} key={`col_${i}_${j}`}/>
                    ]
                    if (j === row.length - 1) cellLines.pop()
                    if (i === table.cells.length - 1) cellLines.shift()
                    return cellLines
                })
            })}
        </div>
    )


    return (
        <TableDiv
            style={{
                transform: `rotate(${rotationDegrees - table.rotationDegrees}deg) ` +
                    `translate(${table.outline.topLeft.x}px, ${table.outline.topLeft.y}px)`,
                width: `${table.outline.bottomRight.x - table.outline.topLeft.x}px`,
                height: `${table.outline.bottomRight.y - table.outline.topLeft.y}px`,
                transformOrigin: `${imageCenter.x}px ${imageCenter.y}px`,
                borderColor: borderColor,
                cursor: isSelected ? "default" : "pointer"
            }}
            onClick={e => handleClick(e)}>
            {body}
            {isSelected ? <ColumnSetterSpace/> : null}
            {isSelected && table.columns.map((pos, idx) =>
                <ColumnKnob position={pos} idx={idx} key={idx}/>
            )}
            {isSelected ? <RowSetterSpace/> : null}
            {isSelected && table.rows.map((pos, idx) =>
                <RowKnob position={pos} idx={idx} key={idx}/>
            )}
            {isSelected ? <NewColumnLine/> : null}
            {isSelected ? <NewRowLine/> : null}
        </TableDiv>
    )
}


export default TableElement