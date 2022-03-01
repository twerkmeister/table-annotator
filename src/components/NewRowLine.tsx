import {useStore} from "../store";
import React from "react";
import {RowLineDiv} from "./RowLine";

const NewRowLine = () => {
    const newRowPosition = useStore(state => state.newRowPosition)
    if (newRowPosition !== undefined) {
        return (<RowLineDiv style={{top: `${newRowPosition}px`}}/>)
    } else {
        return null
    }
}

export default NewRowLine