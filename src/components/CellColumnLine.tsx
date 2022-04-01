import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const CellColumnLineDiv = styled.div `
    border-left: 1px dashed rgba(0, 0, 0, 8);
    width: 4px;
    background: rgba(138, 43, 226, 0.3);
    position: absolute;
`

type CellColumnLineProps = {
    row: number
    column: number
    left: number
    top: number
    height: number
    parentTableSelected: boolean
    parentTableLocked: boolean
}

const CellColumnLine = ({row, column, left, top, height,
                            parentTableSelected, parentTableLocked}: CellColumnLineProps) => {
    const selectCellColumnLine = useStore(state => state.selectCellColumnLine)
    const selectedCellColumnLine = useStore(state => state.selectedCellColumnLine)
    const selectedColumn = useStore(state => state.selectedColumn)
    const setDragging = useStore(state => state.setDragging)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(parentTableSelected && !parentTableLocked) {
            selectCellColumnLine(row, column)
            e.stopPropagation()
        }
    }

    const handleMouseDown = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(parentTableSelected && !parentTableLocked) {
            selectCellColumnLine(row, column)
            setDragging(true)
            e.stopPropagation()
        }
    }

    const isDirectlySelected = parentTableSelected && selectedCellColumnLine !== undefined &&
        row === selectedCellColumnLine.row && column === selectedCellColumnLine.column
    const isIndirectlySelected = parentTableSelected && selectedColumn === column
    const isSelected = isDirectlySelected || isIndirectlySelected

    return (<CellColumnLineDiv
                 onClick={handleMouseClick}
                 onMouseDown={handleMouseDown}
                 style={{left: `${left}px`,
                     top: `${top}px`,
                     height: `${height}px`,
                     cursor: isDirectlySelected || parentTableLocked ? "default" : "pointer",
                     background: isSelected ? "blue" : ""}}/>)
}

export default CellColumnLine