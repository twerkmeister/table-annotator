import {useStore} from "../store";
import React from "react";


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
        <div className="columnSetterSpace" onMouseMove={handleMouseMove} onClick={handleMouseClick}
             onMouseLeave={handleMouseLeave}/>
    )
}

export default ColumnSetterSpace