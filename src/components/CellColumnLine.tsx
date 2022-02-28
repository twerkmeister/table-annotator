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
    hasContentAlready: boolean
}

const CellColumnLine = ({row, column, left, top, height,
                            parentTableSelected, hasContentAlready}: CellColumnLineProps) => {
    const selectCellColumnLine = useStore(state => state.selectCellColumnLine)
    const selectedCellColumnLine = useStore(state => state.selectedCellColumnLine)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(parentTableSelected) {
            selectCellColumnLine(row, column)
            e.stopPropagation()
        }
    }

    const isSelected = parentTableSelected && selectedCellColumnLine !== undefined &&
        row === selectedCellColumnLine.row && column === selectedCellColumnLine.column

    return (<CellColumnLineDiv
                 onClick={(e) => !hasContentAlready && handleMouseClick(e)}
                 style={{left: `${left}px`,
                     top: `${top}px`,
                     height: `${height}px`,
                     cursor: isSelected || hasContentAlready ? "default" : "pointer",
                     background: isSelected ? "blue" : ""}}/>)
}

export default CellColumnLine