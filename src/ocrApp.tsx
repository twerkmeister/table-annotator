import React, {useEffect} from 'react';
import create from 'zustand'
import { GlobalHotKeys } from "react-hotkeys";
import axios from 'axios';
import './ocrApp.css';

const num_per_session = 100
const only_new = true
const DO_ANNOTATE = false

type OCRDataPoint = {
    image_name: string
    table_idx: string
    cell_id: string
    ocr_text: string
    human_text: string | null
    image_path: string
    image_width: number
    image_height: number
}

type OCRFixerState = {
    ocrDataPoints?: OCRDataPoint[]
    fetchOCRDataPoints: () => void
    updateOCRDataPoint: (idx: number, human_text: string) => void
}

const useStore = create<OCRFixerState>((set, get) => ({
    ocrDataPoints: undefined,
    fetchOCRDataPoints: async () => {
        const response = await fetch("/ocr/data_points")
        const ocrDataPoints: OCRDataPoint[] = (await response.json())["data_points"]
        const relevantOCRDataPoints = only_new ? ocrDataPoints.filter(dp => dp.human_text === null) : ocrDataPoints
        set({ocrDataPoints: relevantOCRDataPoints.slice(0, num_per_session)})
    },
    updateOCRDataPoint: async (idx: number, human_text: string) => {
        const ocrDataPoints = get().ocrDataPoints
        if(typeof(ocrDataPoints) === "undefined") return
        const updatedOCRDataPoint = {...ocrDataPoints[idx], human_text}
        const updatedOCRDataPoints = [...ocrDataPoints.slice(0, idx), updatedOCRDataPoint,
                                      ...ocrDataPoints.slice(idx + 1)]
        axios.post("/ocr/data_points", updatedOCRDataPoint)
        set({ocrDataPoints: updatedOCRDataPoints})
    }
}))

function OCRApp() {
    const fetchOCRDataPoints = useStore(state => state.fetchOCRDataPoints)
    const ocrDataPoints = useStore(state => state.ocrDataPoints)

    useEffect(() => {
        if(typeof(ocrDataPoints) === "undefined") {
            fetchOCRDataPoints()
        }
    })
    if(typeof(ocrDataPoints) != "undefined" && ocrDataPoints.length > 0) {
        return (
            <div className="App">
                {
                    ocrDataPoints.map((dataPoint, i) => {
                        return (<OCRFixItem key={i} idx={i} dataPoint={dataPoint}/>)
                    })
                }
            </div>
        )
    } else if (typeof(ocrDataPoints) != "undefined" && ocrDataPoints.length === 0) {
        return (
            <div>There are no ocr data points to annotate...</div>
        )
    } else {
        return (
            <div>Still loading...</div>
        )
    }
}

function OCRFixItem(props: {idx: number, dataPoint: OCRDataPoint}) {
    const updateOCRDataPoint = useStore(state => state.updateOCRDataPoint)

    const handleInputOnBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (DO_ANNOTATE) {
            updateOCRDataPoint(props.idx, e.target.value)
        }
    }

    const handleInputOnFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        e.stopPropagation()
        const elementRect = e.target.getBoundingClientRect()
        if(elementRect.top > window.screen.height - 100){
            window.scrollBy({top: elementRect.top - (window.screen.height / 2)})
        }
    }

    return (
        <div className="OCRFixItem">
            <div className="CellImageContainer">
                <img className="CellImage" src={props.dataPoint.image_path} width={props.dataPoint.image_width}
                     height={props.dataPoint.image_height} alt={`cell at ${props.dataPoint.image_path}`}/>
            </div>
            <div className="OCRInputContainer">
                <textarea className="OCRInput" cols={100}
                 defaultValue={props.dataPoint.human_text === null ?
                               props.dataPoint.ocr_text : props.dataPoint.human_text}
                 onBlur={handleInputOnBlur} onFocus={handleInputOnFocus}
                 style={{height:props.dataPoint.image_height}}/>
            </div>
            <div className="OCRStatusIndicatorContainer">
                <div className="OCRStatusIndicator"
                     style={{background: props.dataPoint.human_text === null ? "yellow" : "green"}}/>
            </div>
        </div>
    )
}

export default OCRApp;
