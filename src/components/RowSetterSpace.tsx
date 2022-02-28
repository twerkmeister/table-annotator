import {useStore} from "../store";
import React from "react";

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
        <div className="rowSetterSpace" onMouseMove={handleMouseMove} onClick={handleMouseClick}
             onMouseLeave={handleMouseLeave}/>
    )
}

export default RowSetterSpace