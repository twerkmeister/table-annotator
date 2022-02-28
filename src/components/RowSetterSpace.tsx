import {useStore} from "../store";
import React from "react";
import styled from "styled-components";

const RowSetterSpaceDiv = styled.div`
  position: absolute;
  height: 100%;
  width: 30px;
  background: orangered;
  opacity: 0.3;
  top: 0;
  left: -30px;
`

const RowSetterSpace = () => {
    const setNewRowPosition = useStore(state => state.setNewRowPosition)
    const addRow = useStore(state => state.addRow)

    const handleMouseLeave = (e: React.MouseEvent<Element, MouseEvent>) => {
        setNewRowPosition(undefined)
    }

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        addRow()
    }

    const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>) => {
        setNewRowPosition({x: e.pageX, y: e.pageY})
    }

    return (
        <RowSetterSpaceDiv onMouseMove={handleMouseMove} onClick={handleMouseClick}
             onMouseLeave={handleMouseLeave}/>
    )
}

export default RowSetterSpace