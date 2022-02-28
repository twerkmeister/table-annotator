import {Point} from "../types";
import {useStore} from "../store";
import React from "react";
import {makeRectangle} from "../geometry";

type StartedTableProps = {
    firstPoint: Point,
    imageCenter: Point
}

const StartedTable = ({firstPoint, imageCenter}: StartedTableProps ) => {
    const rotationDegrees = useStore(state => state.rotationDegrees)
    const mousePosition = useStore(state => state.mousePosition)
    const documentPosition = useStore(state => state.documentPosition)
    const outlineTable = useStore(state => state.outlineTable)

    if(documentPosition) {
        const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            e.preventDefault()
            if (documentPosition) {
                outlineTable({x: e.pageX - documentPosition.x, y: e.pageY - documentPosition.y}, rotationDegrees)
            }
        }
        const mouseOffsetPosition = {x: mousePosition.x - documentPosition.x, y: mousePosition.y - documentPosition.y}
        const rectangle = makeRectangle(firstPoint, mouseOffsetPosition)
        return (
            <div className="table"
                 style={{
                     transform: `translate(${rectangle.topLeft.x}px, ${rectangle.topLeft.y}px)`,
                     width: `${rectangle.bottomRight.x - rectangle.topLeft.x}px`,
                     height: `${rectangle.bottomRight.y - rectangle.topLeft.y}px`,
                     transformOrigin: `${imageCenter.x}px ${imageCenter.y}px`
                 }}
                 onClick={e => handleCanvasClick(e)}/>
        )
    } else {
        return (<div/>)
    }
}

export default StartedTable