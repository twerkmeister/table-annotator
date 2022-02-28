import {useStore} from "../store";
import React from "react";

const NewColumnLine = () => {
    const newColumnPosition = useStore(state => state.newColumnPosition)
    if (newColumnPosition !== undefined) {
        return (<div className="columnLine" style={{left: `${newColumnPosition}px`}}/>)
    } else {
        return null
    }
}

export default NewColumnLine