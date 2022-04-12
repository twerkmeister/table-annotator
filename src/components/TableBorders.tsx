import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const TableBorderColumnDiv = styled.div `
    width: 5px;
    height: 100%;
    position: absolute;
`
const TableBorderRowDiv = styled.div`
    height: 5px;
    width: 100%;
    position: absolute;
`

type BorderProps = {
    borderIdx: number
    parentTableSelected: boolean
}


const TableBorder = ({borderIdx, parentTableSelected} : BorderProps) => {
    const selectBorder = useStore((state) => state.selectBorder)
    const setDragging = useStore((state) => state.setDragging)
    const selectedBorder = useStore((state) => state.selectedBorder)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(parentTableSelected) {
            selectBorder(borderIdx)
            e.stopPropagation()
        }
    }

    const handleMouseDown = (e: React.MouseEvent<Element, MouseEvent>) => {
        selectBorder(borderIdx)
        setDragging(true)
        e.stopPropagation()
    }


    const isSelected = parentTableSelected && borderIdx === selectedBorder
    const cursorStyle = isSelected ? "default" : "pointer"
    const backgroundStyle = isSelected ? "blue" : ""

    if (borderIdx === 0) {
        return (<TableBorderRowDiv onClick={handleMouseClick} onMouseDown={handleMouseDown}
                                   style={{top: `-5px`,
                                       cursor: cursorStyle,
                                       background: backgroundStyle}}/>)
    } else if (borderIdx === 1) {
        return (<TableBorderColumnDiv onClick={handleMouseClick} onMouseDown={handleMouseDown}
                                   style={{right: `-5px`,
                                       cursor: cursorStyle,
                                       background: backgroundStyle}}/>)
    } else if (borderIdx === 2) {
        return (<TableBorderRowDiv onClick={handleMouseClick} onMouseDown={handleMouseDown}
                                   style={{bottom: `-5px`,
                                       cursor: cursorStyle,
                                       background: backgroundStyle}}/>)
    } else {
        return (<TableBorderColumnDiv onClick={handleMouseClick} onMouseDown={handleMouseDown}
                                   style={{left: `-5px`,
                                       cursor: cursorStyle,
                                       background: backgroundStyle}}/>)
    }
}


export default TableBorder