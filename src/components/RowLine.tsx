import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const RowLineDiv = styled.div`
  border-top: 1px dashed rgba(0, 0, 0, 8);
  height: 3px;
  background: rgba(255, 69, 0, 0.3);
  width: 100%;
  position: absolute;
`

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

    return (<RowLineDiv  onClick={handleMouseClick}
                 style={{top: `${position}px`,
                     cursor: isSelected ? "default": "pointer",
                     background: isSelected ? "brown" : ""}}/>)
}

export default RowLine