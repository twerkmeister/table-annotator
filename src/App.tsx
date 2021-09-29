import React, {useEffect, useRef} from 'react';
import create from 'zustand'
import { HotKeys } from "react-hotkeys";
import './App.css';

const keyMap = {
    PREVIOUS_IMAGE: "a",
    NEXT_IMAGE: "d",
    INCREASE_ROTATION: "w",
    DECREASE_ROTATION: "s"
};

type Image = {
    src: string,
    width: number,
    height: number
}

type UnfinishedTable = {
    x: number,
    y: number
}

function makeTable(x1: number, y1: number,x2: number, y2: number, rotationDegrees: number): Table {
    const [topLeftX, bottomRightX] = x1 <= x2 ? [x1, x2] : [x2, x1]
    const [topLeftY, bottomRightY] = y1 <= y2 ? [y1, y2] : [y2, y1]
    return {
        topLeftX, topLeftY, bottomRightX, bottomRightY, rotationDegrees
    }
}

type Table = {
    topLeftX: number,
    topLeftY: number,
    bottomRightX: number,
    bottomRightY: number,
    rotationDegrees: number,
}


type AnnotatorState = {
    images?: Image[],
    current_image_index?: number,
    unfinishedTable?: UnfinishedTable,
    rotationDegrees: number,
    tables: Table[],
    fetch_images: () => void
    next_image: () => void
    previous_image: () => void
    outlineTable: (x: number, y: number, rotationDegrees: number) => void,
    rotate: (degrees: number) => void,
}

const useStore = create<AnnotatorState>((set, get) => ({
    images: undefined,
    current_image_index: undefined,
    unfinishedTable: undefined,
    rotationDegrees: 0,
    tables: [],
    fetch_images: async() => {
        const response = await fetch("/images")
        const images = (await response.json())["images"]
        set({ images, current_image_index: 0 })
    },
    next_image: () => {
        const images = get().images
        const current_image_index = get().current_image_index
        if (typeof(current_image_index) != "undefined" &&
            typeof(images) != "undefined" &&
            (current_image_index < images.length - 1)) {
            set({ current_image_index: current_image_index + 1 })
        }
    },
    previous_image: () => {
        const current_image_index = get().current_image_index
        if (typeof(current_image_index) != "undefined" && (current_image_index > 0)) {
            set({ current_image_index: current_image_index - 1 })
        }
    },
    outlineTable: (x: number, y: number, rotationDegrees: number) => {
        const currentTables = get().tables
        const unfinishedTable = get().unfinishedTable
        if (typeof(unfinishedTable) != "undefined") {
            const newTable = makeTable(unfinishedTable.x, unfinishedTable.y, x, y, rotationDegrees)
            set({unfinishedTable: undefined, tables: [...currentTables, newTable]})
        } else {
            set({unfinishedTable: {x, y}})
        }
    },
    rotate: (degrees: number) => {
        const rotationDegrees = get().rotationDegrees + degrees
        console.log(rotationDegrees)
        set({rotationDegrees})
    }
}))

function App() {
    const fetch_images = useStore(state => state.fetch_images)
    const next_image = useStore(state => state.next_image)
    const previous_image = useStore(state => state.previous_image)
    const rotate = useStore(state => state.rotate)
    useEffect(() => fetch_images())

    const hotkeyHandlers = {
        PREVIOUS_IMAGE: previous_image,
        NEXT_IMAGE: next_image,
        INCREASE_ROTATION: () => rotate(0.5),
        DECREASE_ROTATION: () => rotate(-0.5)
    };

    return (
        <div className="App">
            <HotKeys keyMap={keyMap} handlers={hotkeyHandlers}>
                <Canvas/>
            </HotKeys>
        </div>
    );
}

function Canvas() {
    const image_idx = useStore(state => state.current_image_index)
    const images = useStore(state => state.images)
    const outlineTable = useStore(state => state.outlineTable)
    const tables = useStore(state => state.tables)
    const rotationDegrees = useStore(state => state.rotationDegrees)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas && typeof(image_idx) != "undefined" && typeof(images) != "undefined") {
            const ctx = canvas.getContext('2d')
            if (ctx) {
                const image = images[image_idx]
                const documentImage = new Image(image.width, image.height)
                documentImage.src = images[image_idx].src
                documentImage.onload = function () {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.save()
                    ctx.translate(image.width / 2, image.height / 2)
                    ctx.rotate((Math.PI / 180) * rotationDegrees)
                    ctx.translate(- image.width / 2, - image.height / 2)
                    ctx.drawImage(documentImage, 0, 0)
                    ctx.restore()

                    tables.forEach(t => {
                        const tableWidth = t.bottomRightX - t.topLeftX
                        const tableHeight = t.bottomRightY - t.topLeftY
                        const tableCenterX = t.topLeftX + tableWidth / 2
                        const tableCenterY = t.topLeftY + tableHeight / 2
                        ctx.save()
                        ctx.translate(image.width / 2, image.height / 2)
                        ctx.rotate((Math.PI / 180) * (rotationDegrees - t.rotationDegrees))
                        ctx.translate(- image.width / 2, - image.height / 2)
                        ctx.beginPath()
                        ctx.lineWidth = 6
                        ctx.strokeStyle = "red"
                        ctx.rect(t.topLeftX, t.topLeftY, tableWidth, tableHeight)
                        ctx.stroke()
                        ctx.restore()
                    })
                }
            }
        }
    })

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        e.preventDefault()
        outlineTable(e.pageX, e.pageY, rotationDegrees)
    }


    if(images && typeof(image_idx) != "undefined") {
        return (
            <canvas ref={canvasRef} onClick={e => handleCanvasClick(e)} width="2000" height="3000">
                Your browser does not support the canvas element.
            </canvas>
        )
    }
    else {
        return (
            <div>Still loading...</div>
        )
    }
}

export default App;
