import {useStore} from "../store";
import React from "react";

const NewRowLine = () => {
    const newRowPosition = useStore(state => state.newRowPosition)
    if (typeof(newRowPosition) !== "undefined") {
        return (<div className="rowLine" style={{top: `${newRowPosition}px`}}/>)
    } else {
        return null
    }
}

export default NewRowLine