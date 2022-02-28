import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const ColumnSetterSpaceDiv = styled.div`
  position: absolute;
  width: 100%;
  height: 30px;
  background: blueviolet;
  opacity: 0.3;
  top: -30px;
  left: 0;
`

const ColumnSetterSpace = () => {
    const setNewColumnPosition = useStore(state => state.setNewColumnPosition)
    const addColumn = useStore(state => state.addColumn)

    const handleMouseLeave = (e: React.MouseEvent<Element, MouseEvent>) => {
        setNewColumnPosition(undefined)
    }

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        addColumn()
    }

    const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>) => {
        setNewColumnPosition({x: e.pageX, y: e.pageY})
    }

    return (
        <ColumnSetterSpaceDiv onMouseMove={handleMouseMove} onClick={handleMouseClick}
             onMouseLeave={handleMouseLeave}/>
    )
}

export default ColumnSetterSpace