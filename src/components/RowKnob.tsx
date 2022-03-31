import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const RowKnobDiv = styled.div `
    border: 1px solid rgba(0, 0, 0, 8);
    width: 23px;
    height: 22px;
    background: silver;
    position: absolute;
`

type RowKnobProps = {
    position: number
    idx: number
}

const ColumnKnob = ({position, idx} : RowKnobProps) =>{
    const selectRow = useStore(state => state.selectRow)
    const selectedRow = useStore(state => state.selectedRow)
    const setDragging = useStore(state => state.setDragging)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        selectRow(idx)
        e.stopPropagation()
    }

    const handleMouseDown = (e: React.MouseEvent<Element, MouseEvent>) => {
        selectRow(idx)
        setDragging(true)
        e.stopPropagation()
    }


    const isSelected = idx === selectedRow

    return (<RowKnobDiv onClick={handleMouseClick} onMouseDown={handleMouseDown}
                           style={{top: `${position - 12}px`, left: "-30px",
                               cursor: isSelected ? "default" : "pointer"}}/>)
}

export default ColumnKnob