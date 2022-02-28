import {Image} from "../types";
import React, {useEffect} from "react";
import {getPageOffset} from "../geometry";
import {useStore} from "../store";

type DocumentImageProps = {
    image: Image
}

const DocumentImage = ({image}: DocumentImageProps) => {
    const ref = React.useRef<HTMLImageElement>(null)
    const outlineTable = useStore(state => state.outlineTable)
    const rotationDegrees = useStore(state => state.rotationDegrees)
    const setDocumentPosition = useStore(state => state.setDocumentPosition)
    const documentPosition = useStore(state => state.documentPosition)
    const selectedTable = useStore(state => state.selectedTable)
    const selectTable = useStore(state => state.selectTable)

    useEffect(() => {
        const imageRef = ref.current
        if (imageRef && documentPosition === undefined) {
            const newDocumentPosition = getPageOffset(imageRef)
            setDocumentPosition(newDocumentPosition)
        }
    })
    const handleClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
        e.preventDefault()
        if (selectedTable === undefined) {
            if (documentPosition) {
                outlineTable({x: e.pageX - documentPosition.x, y: e.pageY - documentPosition.y}, rotationDegrees)
            }
        } else {
            selectTable(undefined)
        }
    }

    return (
        <img ref={ref} src={`/${image.src}`} width={image.width} height={image.height}
             style={{transform: `rotate(${rotationDegrees}deg)`, position: "absolute"}} alt="The document"
             onClick={e => handleClick(e)}/>
    )

}

export default DocumentImage