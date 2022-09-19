import {Image, TempImageParameters} from "../types";
import React, {useEffect} from "react";
import {getPageOffset} from "../geometry";
import {useStore} from "../store";
import styled from "styled-components";
import {APIAddress} from "../api";

const DocumentImageImg = styled.img `
  position: absolute;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
`

const temporaryImageParametersToQueryString = (tip?: TempImageParameters): string => {
    if (tip === undefined) return ""
    return `?inverted=${tip.inverted}&rotationSteps=${tip.rotationSteps}`
}

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
    const queryString = temporaryImageParametersToQueryString(image.temporaryParameters)

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
        <DocumentImageImg ref={ref} src={`${APIAddress}/${image.src}${queryString}`}
                          width={image.width} height={image.height}
                          style={{transform: `rotate(${rotationDegrees}deg)`}} alt="The document"
                          onClick={e => handleClick(e)}/>
    )

}

export default DocumentImage