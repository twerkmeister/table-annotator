import React from "react";
import styled from "styled-components";

const HelperGridContainer = styled.div`
    width: 100%;
    height: 100%;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 99;
    pointer-events: none;
`

const HelperGridRow = styled.div`
    width: 100%;
    height: 2px;
    background: #0000004a;
    position: absolute;
`

const HelperGridColumn = styled.div`
    height: 100%;
    width: 2px;
    background: #0000004a;
    position: absolute;
`

const HelperGrid = () => {
    const spacing = 100
    const numCols = Math.floor(window.screen.width / spacing)
    const colPositions = Array.from({length: numCols}, (x, i) => i*spacing)

    const numRows = Math.floor(window.screen.height / spacing)
    const rowPositions = Array.from({length: numRows}, (x, i) => i*spacing)
    return (
        <HelperGridContainer>
            {colPositions.map((pos, i) => {
                return <HelperGridColumn style={{left: `${pos}px`}}/>
            })}
            {rowPositions.map((pos, i) => {
                return <HelperGridRow style={{top: `${pos}px`}}/>
            })}
        </HelperGridContainer>
    )
}

export default HelperGrid