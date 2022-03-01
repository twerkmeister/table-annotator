import {useStore} from "../store";
import React from "react";
import {ColumnLineDiv} from "./ColumnLine";


const NewColumnLine = () => {
    const newColumnPosition = useStore(state => state.newColumnPosition)
    if (newColumnPosition !== undefined) {
        return (<ColumnLineDiv style={{left: `${newColumnPosition}px`}}/>)
    } else {
        return null
    }
}

export default NewColumnLine