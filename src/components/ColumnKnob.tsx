import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const ColumnKnobDiv = styled.div `
    border: 1px solid rgba(0, 0, 0, 8);
    width: 22px;
    height: 23px;
    background: silver;
    position: absolute;
`

type ColumnKnobProps = {
    position: number
    idx: number
}

const ColumnKnob = ({position, idx} : ColumnKnobProps) =>{
    const selectColumn = useStore(state => state.selectColumn)
    const selectedColumn = useStore(state => state.selectedColumn)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        selectColumn(idx)
        e.stopPropagation()
    }


    const isSelected = idx === selectedColumn

    return (<ColumnKnobDiv onClick={handleMouseClick}
                           style={{left: `${position - 12}px`, top: "-30px",
                               cursor: isSelected ? "default" : "pointer"}}/>)
}

export default ColumnKnob