import React, {useEffect} from 'react';
import create from 'zustand'
import { GlobalHotKeys } from "react-hotkeys";
import axios from 'axios';
import {getPathParts} from './path';
import {OCRDataPoint, Image} from './types';
import './overviewApp.css';

type OverviewAppState = {
    images?: Image[]
    ocrDataPoints?: OCRDataPoint[]
    fetchOCRDataPoints: () => void
    fetchImages: () => void
}

const useStore = create<OverviewAppState>((set, get) => ({
    images: undefined,
    ocrDataPoints: undefined,
    fetchOCRDataPoints: async () => {
        const subdir = getPathParts().subdir
        const response = await fetch(`/${subdir}/data_points`)
        const ocrDataPoints: OCRDataPoint[] = (await response.json())["data_points"]
        set({ocrDataPoints})
    },
    fetchImages: async () => {
        const subdir = getPathParts().subdir
        const response = await fetch(`/${subdir}/images`)
        const images = (await response.json())["images"]
        set({images})
    }
}))

function OverviewApp() {
    const fetchOCRDataPoints = useStore(state => state.fetchOCRDataPoints)
    const fetchImages = useStore(state => state.fetchImages)
    const ocrDataPoints = useStore(state => state.ocrDataPoints)
    const images = useStore(state => state.images)

    useEffect(() => {
        if(typeof(ocrDataPoints) === "undefined") {
            fetchOCRDataPoints()
        }
        if(typeof(images) === "undefined"){
            fetchImages()
        }
    })
    const imagesHeader = (
        typeof(images) === "undefined" ?
            "Still loading image data..." : images.length === 0 ?
            "There are no images to annotate..." :
            `${images.filter(i => i.finished).length}/${images.length} documents annotated`
    )

    const ocrHeader = (
        typeof(ocrDataPoints) === "undefined" ?
            "Still loading image data..." : ocrDataPoints.length === 0 ?
                "There are no images to annotate..." :
                `${ocrDataPoints.filter(p => p.human_text !== null).length}/${ocrDataPoints.length} ocr data points corrected`
    )

    return (
        <div className="OverviewApp">
            <LinkHeader text={imagesHeader}/>
            <LinkBox background={"tables_preview.png"} dst={"tables"}/>
            <LinkHeader text={ocrHeader}/>
            <LinkBox background={"ocr_preview.png"} dst={"ocr"}/>

        </div>
    )
}

function LinkHeader(props: {text: string}) {
    return (
        <div className={"linkHeader"}> {props.text} </div>
    )
}

function LinkBox(props: {dst?: string, background: string}) {
    return (
        <a href={`${getPathParts().subdir}/${props.dst}`}>
            <div className={"linkBox"} style={{background: `center / contain no-repeat url(${props.background})`}}/>
        </a>
    )
}


export default OverviewApp;
