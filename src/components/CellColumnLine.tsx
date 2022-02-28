import {useStore} from "../store";
import React from "react";

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

    const isSelected = parentTableSelected && typeof(selectedCellColumnLine) !== "undefined" &&
        row === selectedCellColumnLine.row && column === selectedCellColumnLine.column

    return (<div className="cellColumnLine"
                 onClick={(e) => !hasContentAlready && handleMouseClick(e)}
                 style={{left: `${left}px`,
                     top: `${top}px`,
                     height: `${height}px`,
                     cursor: isSelected || hasContentAlready ? "default" : "pointer",
                     background: isSelected ? "blue" : ""}}/>)
}

export default CellColumnLine