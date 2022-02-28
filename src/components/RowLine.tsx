import {useStore} from "../store";
import React from "react";

type RowLineProps = {
    position: number
    idx: number
    parentTableSelected: boolean
}

const RowLine = ({position, idx, parentTableSelected}: RowLineProps) => {
    const selectRow = useStore(state => state.selectRow)
    const selectedRow = useStore(state => state.selectedRow)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(parentTableSelected) {
            selectRow(idx)
            e.stopPropagation()
        }
    }

    const isSelected = parentTableSelected && idx === selectedRow

    return (<div className="rowLine"  onClick={handleMouseClick}
                 style={{top: `${position}px`,
                     cursor: isSelected ? "default": "pointer",
                     background: isSelected ? "brown" : ""}}/>)
}

export default RowLine