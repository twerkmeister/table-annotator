import React from "react";
import styled from "styled-components";
import {useStore} from "../store";

const CellRowLineDiv = styled.div`
  border-top: 1px dashed rgba(0, 0, 0, 8);
  height: 3px;
  background: rgba(255, 69, 0, 0.3);
  position: absolute;
`

type CellRowLineProps = {
    row: number
    column: number
    left: number
    top: number
    width: number
    parentTableSelected: boolean
    parentTableLocked: boolean
}

const CellRowLine = ({row, column, left, top, width,
                         parentTableSelected, parentTableLocked}: CellRowLineProps) => {
    const selectCellRowLine = useStore(state => state.selectCellRowLine)
    const selectedCellRowLine = useStore(state => state.selectedCellRowLine)
    const selectedRow = useStore(state => state.selectedRow)
    const setDragging = useStore(state => state.setDragging)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(parentTableSelected && !parentTableLocked) {
            selectCellRowLine(row, column)
            e.stopPropagation()
        }
    }


    const handleMouseDown = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(parentTableSelected && !parentTableLocked) {
            selectCellRowLine(row, column)
            setDragging(true)
            e.stopPropagation()
        }
    }

    const isDirectlySelected = parentTableSelected && selectedCellRowLine !== undefined &&
        row === selectedCellRowLine.row && column === selectedCellRowLine.column
    const isIndirectlySelected = parentTableSelected && selectedRow === row
    const isSelected = isDirectlySelected || isIndirectlySelected

    return (<CellRowLineDiv
        onClick={handleMouseClick}
        onMouseDown={handleMouseDown}
        style={{left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            cursor: isDirectlySelected || parentTableLocked ? "default" : "pointer",
            background: isSelected ? "brown" : ""}}/>)
}


export default CellRowLine