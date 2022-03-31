import React from "react";
import styled from "styled-components";

const RowSetterBlockerDiv = styled.div `
    width: 30px;
    background: repeating-linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.2),
            rgba(0, 0, 0, 0.2) 10px,
            rgba(0, 0, 0, 0.3) 10px,
            rgba(0, 0, 0, 0.3) 20px
    );
    position: absolute;
`

type RowSetterBlockerProps = {
    position: number
    height: number
}

const RowSetterBlocker = ({position, height} : RowSetterBlockerProps) =>{
    return (<RowSetterBlockerDiv
                           style={{top: `${position-11}px`, left: "-30px", height: `${height+22}px`}}/>)
}

export default RowSetterBlocker