import React from "react";
import styled from "styled-components";

const CellRowLineDiv = styled.div`
  border-top: 1px dashed rgba(0, 0, 0, 8);
  height: 3px;
  background: rgba(255, 69, 0, 0.3);
  position: absolute;
`

type CellRowLineProps = {
    left: number
    top: number
    width: number
}

const CellRowLine = ({left, top, width}: CellRowLineProps) => {
    return (<CellRowLineDiv
                 style={{top: `${top}px`,
                     left: `${left}px`,
                     width: `${width}px`}}/>)
}

export default CellRowLine