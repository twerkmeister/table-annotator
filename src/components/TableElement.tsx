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
import {calculateCellRectangle, getMaximalRevisions, height, width} from "../geometry"
import RowKnob from "./RowKnob";
import ColumnSetterBlocker from "./ColumnSetterBlocker";
import RowSetterBlocker from "./RowSetterBlocker";


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

    const cellLines =
        table.cells.flatMap((row, i) => {
                return row.flatMap((cell, j) => {
                    const rect = calculateCellRectangle( {row: i, column: j}, table)
                    const cellLines = [
                        <CellRowLine row={i} column={j} parentTableSelected={isSelected}
                                     width={width(rect)} left={rect.topLeft.x}
                                     top={rect.bottomRight.y} key={`row_${i}_${j}`}/>,
                        <CellColumnLine row={i} column={j} parentTableSelected={isSelected}
                                        height={height(rect)} left={rect.bottomRight.x}
                                        top={rect.topLeft.y} key={`col_${i}_${j}`}/>
                    ]
                    if (j === row.length - 1) cellLines.pop()
                    if (i === table.cells.length - 1) cellLines.shift()
                    return cellLines
                })
            })

    const [maxRowRevisions, maxColumnRevisions] = getMaximalRevisions(table.cells)
    const columnSetterBlocks = table.columns.flatMap((columnPos, i) => {
        return [<ColumnSetterBlocker position={columnPos - maxColumnRevisions[i][0]} width={maxColumnRevisions[i][0]}/>,
        <ColumnSetterBlocker position={columnPos} width={maxColumnRevisions[i][1]}/>]
    })

    const rowSetterBlocks = table.rows.flatMap((rowPos, i) => {
        return [<RowSetterBlocker position={rowPos - maxRowRevisions[i][0]} height={maxRowRevisions[i][0]}/>,
            <RowSetterBlocker position={rowPos} height={maxRowRevisions[i][1]}/>]
    })

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
            {cellLines}
            {isSelected ? <ColumnSetterSpace/> : null}
            {isSelected ? columnSetterBlocks: null}
            {isSelected && table.columns.map((pos, idx) =>
                <ColumnKnob position={pos} idx={idx} key={idx}/>
            )}
            {isSelected ? <RowSetterSpace/> : null}
            {isSelected ? rowSetterBlocks: null}
            {isSelected && table.rows.map((pos, idx) =>
                <RowKnob position={pos} idx={idx} key={idx}/>
            )}
            {isSelected ? <NewColumnLine/> : null}
            {isSelected ? <NewRowLine/> : null}
        </TableDiv>
    )
}


export default TableElement