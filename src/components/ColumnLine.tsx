import {useStore} from "../store";
import React from "react";

type ColumnLineProps = {
    position: number
    idx: number
    parentTableSelected: boolean
}

const ColumnLine = ({position, idx, parentTableSelected} : ColumnLineProps) =>{
    const selectColumn = useStore(state => state.selectColumn)
    const selectedColumn = useStore(state => state.selectedColumn)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(parentTableSelected) {
            selectColumn(idx)
            e.stopPropagation()
        }
    }

    const isSelected = parentTableSelected && idx === selectedColumn

    return (<div className="columnLine" onClick={handleMouseClick}
                 style={{left: `${position}px`,
                     cursor: isSelected ? "default" : "pointer",
                     background: isSelected ? "blue" : ""}}/>)
}

export default ColumnLine