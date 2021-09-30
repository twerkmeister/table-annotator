import React, {useEffect} from 'react';
import create from 'zustand'
import { HotKeys } from "react-hotkeys";
import './App.css';

const keyMap = {
    PREVIOUS_IMAGE: "a",
    NEXT_IMAGE: "d",
    INCREASE_ROTATION: "w",
    DECREASE_ROTATION: "s",
    ESC: "esc"
};

type Point = {
    x: number,
    y: number
}

function subtractPoints(p: Point, p2: Point): Point {
    return {x: p.x - p2.x, y: p.y - p2.y}
}

function addPoints(p: Point, p2: Point): Point {
    return {x: p.x + p2.x, y: p.y + p2.y}
}

function rotatePoint(p: Point, angle: number, rotationCenter: Point = {x: 0, y: 0}): Point {
    const sinAngle = Math.sin(angle);
    const cosAngle = Math.cos(angle);

    const translated = subtractPoints(p, rotationCenter)
    const rotated = {
        x: translated.x * cosAngle - translated.y * sinAngle,
        y: translated.x * sinAngle + translated.y * cosAngle
    }
    return addPoints(rotated, rotationCenter)
}

type Rectangle = {
    topLeft: Point,
    bottomRight: Point
}

type Image = {
    src: string,
    width: number,
    height: number
}

type UnfinishedTable = {
    firstPoint: Point
    rotationDegrees: number,
}

function getPageOffset(el: Element): Point {
    const rect = el.getBoundingClientRect()
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    return { y: rect.top + scrollTop, x: rect.left + scrollLeft }
}

function calcRectangle(p1: Point, p2: Point): Rectangle {
    const [topLeftX, bottomRightX] = p1.x <= p2.x ? [p1.x, p2.x] : [p2.x, p1.x]
    const [topLeftY, bottomRightY] = p1.y <= p2.y ? [p1.y, p2.y] : [p2.y, p1.y]
    const topLeft = {x: topLeftX, y: topLeftY}
    const bottomRight = {x: bottomRightX, y: bottomRightY}
    return {topLeft, bottomRight}
}

function makeTable(p1: Point, p2: Point, rotationDegrees: number): Table {
    const outline = calcRectangle(p1, p2)
    return {
        outline, rotationDegrees
    }
}

type Table = {
    outline: Rectangle,
    rotationDegrees: number,
}


type AnnotatorState = {
    images?: Image[],
    currentImageIndex: number,
    unfinishedTable?: UnfinishedTable,
    mousePosition: Point,
    documentPosition?: Point,
    rotationDegrees: number,
    tables: Table[],
    fetchImages: () => void
    setImageIndex: (idx: number) => void
    outlineTable: (p: Point, rotationDegrees: number) => void,
    rotate: (degrees: number) => void,
    setMousePosition: (mousePosition: Point) => void,
    setDocumentPosition: (documentPosition: Point) => void,
    removeUnfinishedTable: () => void,
}

const useStore = create<AnnotatorState>((set, get) => ({
    images: undefined,
    currentImageIndex: 0,
    unfinishedTable: undefined,
    mousePosition: {x: 0, y: 0},
    documentPosition: undefined,
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
    setImageIndex: (idx: number) => {
        const images = get().images
        if(images && idx >= 0 && idx < images.length){
            set({ currentImageIndex: idx, rotationDegrees: 0, documentPosition: undefined})
        }
    },
    outlineTable: (p: Point, rotationDegrees: number) => {
        const currentTables = get().tables
        const unfinishedTable = get().unfinishedTable
        if (typeof(unfinishedTable) != "undefined") {
            const newTable = makeTable(unfinishedTable.firstPoint, p, rotationDegrees)
            set({unfinishedTable: undefined, tables: [...currentTables, newTable]})
        } else {
            set({unfinishedTable: {firstPoint: p, rotationDegrees}})
        }
    },
    rotate: (degrees: number) => {
        const rotationDegrees = get().rotationDegrees + degrees
        set({rotationDegrees})
    },
    setMousePosition: (mousePosition: Point) => {
        set({mousePosition})
    },
    setDocumentPosition: (documentPosition: Point) => {
        set({documentPosition})
    },
    removeUnfinishedTable: () => {
        set ({unfinishedTable: undefined})
    }
}))

function App() {
    const fetchImages = useStore(state => state.fetchImages)
    const setImageIndex = useStore(state => state.setImageIndex)
    const rotate = useStore(state => state.rotate)
    const tables = useStore(state => state.tables)
    const unfinishedTable = useStore(state => state.unfinishedTable)
    const imageIdx = useStore(state => state.currentImageIndex)
    const images = useStore(state => state.images)
    const setMousePosition = useStore(state => state.setMousePosition)
    const removeUnfinishedTable = useStore(state => state.removeUnfinishedTable)
    useEffect(() => fetchImages())

    const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>) => {
        setMousePosition({x: e.pageX, y: e.pageY})
    }

    const hotkeyHandlers = {
        PREVIOUS_IMAGE:  () => setImageIndex(imageIdx - 1),
        NEXT_IMAGE:  () => setImageIndex(imageIdx + 1),
        INCREASE_ROTATION: () => rotate(0.5),
        DECREASE_ROTATION: () => rotate(-0.5),
        ESC: () => {}
    }

    if (unfinishedTable) {
        hotkeyHandlers.ESC = removeUnfinishedTable
    }

    if(typeof(images) != "undefined" && images.length > 0) {
        const image = images[imageIdx]
        const imageCenter: Point = {x: image.width / 2, y: image.height / 2}
        return (
            <div className="App" onMouseMove={e => handleMouseMove(e)}>
                <HotKeys keyMap={keyMap} handlers={hotkeyHandlers} allowChanges={true}>
                    <DocumentImage {...image} />
                    {tables.map((t, i) => {
                        return (
                            <TableElement key={i} tableTopLeft={t.outline.topLeft}
                                          tableBottomRight={t.outline.bottomRight}
                                          imageCenter={imageCenter} tableRotation={t.rotationDegrees}/>
                        )
                    })}
                    {typeof(unfinishedTable) != "undefined" ? <StartedTable {...unfinishedTable}
                                                                            imageCenter={imageCenter} /> : null}
                </HotKeys>
            </div>
        );
    } else if(typeof(images) != "undefined" && images.length === 0) {
        return (
            <div>There are no images to annotate...</div>
        )
    } else {
        return (
            <div>Still loading...</div>
        )
    }
}

function StartedTable(props: { firstPoint: Point, rotationDegrees: number, imageCenter: Point } ) {
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
        const rectangle = calcRectangle(props.firstPoint, mouseOffsetPosition)
        return (
            <div className="table"
                 style={{
                     transform: `rotate(${rotationDegrees - props.rotationDegrees}deg) translate(${rectangle.topLeft.x}px, ${rectangle.topLeft.y}px)`,
                     width: `${rectangle.bottomRight.x - rectangle.topLeft.x}px`,
                     height: `${rectangle.bottomRight.y - rectangle.topLeft.y}px`,
                     transformOrigin: `${props.imageCenter.x}px ${props.imageCenter.y}px`
                 }}
                 onClick={e => handleCanvasClick(e)}/>
        )
    } else {
        return (<div/>)
    }
}

function TableElement(props: {tableTopLeft: Point, tableBottomRight: Point, tableRotation: number, imageCenter: Point}) {
    const rotationDegrees = useStore(state => state.rotationDegrees)
    return (
        <div className="table"
             style={{transform: `rotate(${rotationDegrees - props.tableRotation}deg) translate(${props.tableTopLeft.x}px, ${props.tableTopLeft.y}px)`,
                     width: `${props.tableBottomRight.x - props.tableTopLeft.x}px`,
                     height: `${props.tableBottomRight.y - props.tableTopLeft.y}px`,
                     transformOrigin: `${props.imageCenter.x}px ${props.imageCenter.y}px`}}/>
    )
}

function DocumentImage(image: Image) {
    const ref = React.useRef<HTMLImageElement>(null)
    const outlineTable = useStore(state => state.outlineTable)
    const rotationDegrees = useStore(state => state.rotationDegrees)
    const setDocumentPosition = useStore(state => state.setDocumentPosition)
    const documentPosition = useStore(state => state.documentPosition)

    useEffect(() => {
        const imageRef = ref.current
        if (imageRef && typeof(documentPosition) == "undefined") {
            const newDocumentPosition = getPageOffset(imageRef)
            setDocumentPosition(newDocumentPosition)
        }
    })
    const handleCanvasClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
        e.preventDefault()
        if (documentPosition) {
            outlineTable({x: e.pageX - documentPosition.x, y: e.pageY - documentPosition.y}, rotationDegrees)
        }
    }

    return (
        <img ref={ref} className="documentImage" src={image.src} width={image.width} height={image.height}
        style={{transform: `rotate(${rotationDegrees}deg)`}} alt="The document"
             onClick={e => handleCanvasClick(e)}/>
    )

}

export default App;
