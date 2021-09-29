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

type Point = {
    x: number,
    y: number
}

type Image = {
    src: string,
    width: number,
    height: number
}

type UnfinishedTable = {
    firstPoint: Point
}

function makeTable(p1: Point, p2: Point, rotationDegrees: number): Table {
    const [topLeftX, bottomRightX] = p1.x <= p2.x ? [p1.x, p2.x] : [p2.x, p1.x]
    const [topLeftY, bottomRightY] = p1.y <= p2.y ? [p1.y, p2.y] : [p2.y, p1.y]
    const topLeft = {x: topLeftX, y: topLeftY}
    const bottomRight = {x: bottomRightX, y: bottomRightY}
    return {
        topLeft, bottomRight, rotationDegrees
    }
}

type Table = {
    topLeft: Point,
    bottomRight: Point,
    rotationDegrees: number,
}


type AnnotatorState = {
    images?: Image[],
    currentImageIndex?: number,
    unfinishedTable?: UnfinishedTable,
    rotationDegrees: number,
    tables: Table[],
    fetchImages: () => void
    nextImage: () => void
    previousImage: () => void
    outlineTable: (p: Point, rotationDegrees: number) => void,
    rotate: (degrees: number) => void,
}

const useStore = create<AnnotatorState>((set, get) => ({
    images: undefined,
    currentImageIndex: undefined,
    unfinishedTable: undefined,
    rotationDegrees: 0,
    tables: [],
    fetchImages: async() => {
        const images = get().images
        if(typeof(images) == "undefined") {
            const response = await fetch("/images")
            const images = (await response.json())["images"]
            set({images, currentImageIndex: 0})
        }
    },
    nextImage: () => {
        const images = get().images
        const currentImageIndex = get().currentImageIndex
        if (typeof(currentImageIndex) != "undefined" &&
            typeof(images) != "undefined" &&
            (currentImageIndex < images.length - 1)) {
            set({ currentImageIndex: currentImageIndex + 1 })
        }
    },
    previousImage: () => {
        const currentImageIndex = get().currentImageIndex
        if (typeof(currentImageIndex) != "undefined" && (currentImageIndex > 0)) {
            set({ currentImageIndex: currentImageIndex - 1 })
        }
    },
    outlineTable: (p: Point, rotationDegrees: number) => {
        const currentTables = get().tables
        const unfinishedTable = get().unfinishedTable
        if (typeof(unfinishedTable) != "undefined") {
            const newTable = makeTable(unfinishedTable.firstPoint, p, rotationDegrees)
            set({unfinishedTable: undefined, tables: [...currentTables, newTable]})
        } else {
            set({unfinishedTable: {firstPoint: p}})
        }
    },
    rotate: (degrees: number) => {
        const rotationDegrees = get().rotationDegrees + degrees
        console.log(rotationDegrees)
        set({rotationDegrees})
    }
}))

function App() {
    const fetchImages = useStore(state => state.fetchImages)
    const nextImage = useStore(state => state.nextImage)
    const previousImage = useStore(state => state.previousImage)
    const rotate = useStore(state => state.rotate)
    const tables = useStore(state => state.tables)
    const imageIdx = useStore(state => state.currentImageIndex)
    const images = useStore(state => state.images)
    console.log("App")
    useEffect(() => fetchImages())

    const hotkeyHandlers = {
        PREVIOUS_IMAGE: previousImage,
        NEXT_IMAGE: nextImage,
        INCREASE_ROTATION: () => rotate(0.5),
        DECREASE_ROTATION: () => rotate(-0.5)
    };
    if(images && typeof(imageIdx) != "undefined") {
        const image = images[imageIdx]
        const imageCenter: Point = {x: image.width/2, y: image.height/2}
        return (
            <div className="App">
                <HotKeys keyMap={keyMap} handlers={hotkeyHandlers}>
                    <DocumentImage {...image}/>
                    {tables.map((t, i) => {
                        return (
                            <TableElement key={i} tableTopLeft={t.topLeft} tableBottomRight={t.bottomRight}
                            imageCenter={imageCenter} tableRotation={t.rotationDegrees}/>
                        )
                    })}
                </HotKeys>
            </div>
        );
    } else {
        return (
            <div>Still loading...</div>
        )
    }
}

function TableElement(props: {tableTopLeft: Point, tableBottomRight: Point, tableRotation: number, imageCenter: Point}) {
    console.log(props)
    const rotationDegrees = useStore(state => state.rotationDegrees)
    return (
        <div className="table" style={{transform: `rotate(${rotationDegrees - props.tableRotation}deg) translate(${props.tableTopLeft.x}px, ${props.tableTopLeft.y}px)`,
        width: `${props.tableBottomRight.x - props.tableTopLeft.x}px`, height: `${props.tableBottomRight.y - props.tableTopLeft.y}px`,
        transformOrigin: `${props.imageCenter.x}px ${props.imageCenter.y}px`}}/>
    )
}

function DocumentImage(image: Image) {
    const outlineTable = useStore(state => state.outlineTable)
    const rotationDegrees = useStore(state => state.rotationDegrees)

    const handleCanvasClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
        e.preventDefault()
        console.log("ding")
        outlineTable({x: e.pageX, y: e.pageY}, rotationDegrees)
    }

    return (
        <img className="documentImage" src={image.src} width={image.width} height={image.height}
        style={{transform: `rotate(${rotationDegrees}deg)`}} onClick={e => handleCanvasClick(e)}/>
    )

}

export default App;
