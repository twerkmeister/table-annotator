import React from "react";
import styled from "styled-components";

const ColumnSetterBlockerDiv = styled.div `
    height: 30px;
    background: repeating-linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.2),
            rgba(0, 0, 0, 0.2) 10px,
            rgba(0, 0, 0, 0.3) 10px,
            rgba(0, 0, 0, 0.3) 20px
    );
    position: absolute;
`

type ColumnSetterBlockerProps = {
    position: number
    width: number
}

const ColumnSetterBlocker = ({position, width} : ColumnSetterBlockerProps) =>{
    return (<ColumnSetterBlockerDiv
                           style={{left: `${position-11}px`, top: "-30px", width: `${width+22}px`}}/>)
}

export default ColumnSetterBlocker