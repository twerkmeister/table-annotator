import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const ColumnLineDiv = styled.div `
    border-left: 1px dashed rgba(0, 0, 0, 8);
    width: 4px;
    background: rgba(138, 43, 226, 0.3);
    height: 100%;
    position: absolute;
`

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

    return (<ColumnLineDiv onClick={handleMouseClick}
                 style={{left: `${position}px`,
                     cursor: isSelected ? "default" : "pointer",
                     background: isSelected ? "blue" : ""}}/>)
}

export default ColumnLine