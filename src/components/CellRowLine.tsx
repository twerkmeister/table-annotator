import React from "react";

type CellRowLineProps = {
    left: number
    top: number
    width: number
}

const CellRowLine = ({left, top, width}: CellRowLineProps) => {
    return (<div className="cellRowLine"
                 style={{top: `${top}px`,
                     left: `${left}px`,
                     width: `${width}px`}}/>)
}

export default CellRowLine