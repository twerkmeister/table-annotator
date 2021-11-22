import React, {useEffect} from 'react';
import create from 'zustand'
import { GlobalHotKeys } from "react-hotkeys";
import axios from 'axios';
import {getPathParts} from './path';
import './App.css';
import {Point, Rectangle, Image} from './types'

const keyMap = {
    PREVIOUS_IMAGE: "a",
    NEXT_IMAGE: "d",
    INCREASE_ROTATION: "w",
    DECREASE_ROTATION: "s",
    ESC: "esc",
    ZERO: "0",
    BACKSPACE_OR_DELETE: ["Backspace", "Delete"],
    R: "r",
    F: "f",
    UP: "shift+w",
    DOWN: "shift+s"
};

function subtractPoints(p: Point, p2: Point): Point {
    return {x: p.x - p2.x, y: p.y - p2.y}
}

function addPoints(p: Point, p2: Point): Point {
    return {x: p.x + p2.x, y: p.y + p2.y}
}

function rotatePoint(p: Point, degrees: number, rotationCenter: Point = {x: 0, y: 0}): Point {
    const radians = degrees * Math.PI / 180
    const sinAngle = Math.sin(radians);
    const cosAngle = Math.cos(radians);

    const translated = subtractPoints(p, rotationCenter)
    const rotated = {
        x: translated.x * cosAngle - translated.y * sinAngle,
        y: translated.x * sinAngle + translated.y * cosAngle
    }
    return addPoints(rotated, rotationCenter)
}

type UnfinishedTable = {
    firstPoint: Point
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
        outline, rotationDegrees, columns: [], rows: []
    }
}

type Table = {
    outline: Rectangle,
    rotationDegrees: number,
    columns: number[],
    rows: number[],
}

type AnnotatorState = {
    images?: Image[],
    currentImageIndex: number,
    selectedTable?: number,
    selectedColumn?: number,
    selectedRow?: number,
    unfinishedTable?: UnfinishedTable,
    newColumnPosition?: number,
    newRowPosition?: number,
    newRowGuesses?: Array<number | undefined>,
    mousePosition: Point,
    documentPosition?: Point,
    rotationDegrees: number,
    tableDeletionMarkCount: number,
    tables: Table[],
    fetchImages: () => void
    setImageIndex: (idx: number) => void
    outlineTable: (p: Point, rotationDegrees: number) => void,
    increaseRotationDegrees: (degrees: number) => void,
    setRotationDegrees: (rotationDegrees: number) => void,
    setMousePosition: (mousePosition: Point) => void,
    setDocumentPosition: (documentPosition: Point) => void,
    cancelActions: () => void,
    selectTable: (idx?: number) => void,
    setNewColumnPosition: (pagePoint?: Point) => void,
    setNewRowPosition: (pagePoint?: Point) => void,
    addColumn: () => void,
    addRow: () => void,
    selectColumn: (idx?: number) => void,
    selectRow: (idx?: number) => void,
    deleteTable: () => void
    deleteColumn: () => void
    deleteRow: () => void
    acceptRowGuess: () => void
    toggleImageStatus: () => void
    adjustRowGuess: (change: number) => void
}


const useStore = create<AnnotatorState>((set, get) => ({
    images: undefined,
    currentImageIndex: 0,
    unfinishedTable: undefined,
    selectedTable: undefined,
    selectedColumn: undefined,
    selectedRow: undefined,
    newColumnPosition: undefined,
    newRowPosition: undefined,
    newRowGuesses: undefined,
    mousePosition: {x: 0, y: 0},
    documentPosition: undefined,
    rotationDegrees: 0,
    tableDeletionMarkCount: 0,
    tables: [],
    fetchImages: async() => {
        const subdir = getPathParts().subdir
        const response = await fetch(`/${subdir}/images`)
        const images = (await response.json())["images"]
        set({images, currentImageIndex: 0})
    },
    setImageIndex: async(idx: number) => {
        const images = get().images
        if(typeof(images) === "undefined") return
        const image = images[idx]
        if(typeof(image) === "undefined") return

        const subdir = getPathParts().subdir
        const table_response = await fetch(`/${subdir}/tables/${image.name}`)
        const tables = (await table_response.json())["tables"]
        set({ currentImageIndex: idx, rotationDegrees: 0, documentPosition: undefined,
            tables, unfinishedTable: undefined, selectedTable: undefined, selectedRow: undefined,
            selectedColumn: undefined, newRowGuesses: undefined})

    },
    toggleImageStatus: async() => {
        console.log("uip")
        const images = get().images
        if(typeof(images) === "undefined") return
        const currentImageIndex = get().currentImageIndex
        const image = images[currentImageIndex]
        if(typeof(image) === "undefined") return

        const newImage = {...image, finished: !image.finished}
        const newImages = [...images.slice(0,currentImageIndex), newImage, ...images.slice(currentImageIndex+1)]

        const subdir = getPathParts().subdir
        await axios.put(`/${subdir}/image/${newImage.name}/status`, {finished: newImage.finished})
        if(newImage.finished) {
            axios.post(`/${subdir}/image/${newImage.name}/segment`, {})
        }

        set({images: newImages})

    },
    outlineTable: (p: Point, rotationDegrees: number) => {
        const currentTables = get().tables
        const unfinishedTable = get().unfinishedTable
        if (typeof(unfinishedTable) !== "undefined") {
            const newTable = makeTable(unfinishedTable.firstPoint, p, rotationDegrees)
            set({unfinishedTable: undefined, tables: [...currentTables, newTable], selectedTable: currentTables.length})
        } else {
            set({unfinishedTable: {firstPoint: p}})
        }
    },
    increaseRotationDegrees: (degrees: number) => {
        const rotationDegrees = get().rotationDegrees + degrees
        set({rotationDegrees})
    },
    setRotationDegrees: (rotationDegrees: number) => {
        set({rotationDegrees})
    },
    setMousePosition: (mousePosition: Point) => {
        set({mousePosition})
    },
    setDocumentPosition: (documentPosition: Point) => {
        set({documentPosition})
    },
    cancelActions: () => {
        set({unfinishedTable: undefined, tableDeletionMarkCount: 0})
    },
    selectTable: (idx?: number) => {
        set({selectedTable: idx, newColumnPosition: undefined,
            newRowPosition: undefined, tableDeletionMarkCount: 0,
            selectedColumn: undefined, selectedRow: undefined})
    },
    selectColumn: (idx?: number) => {
        set({selectedColumn: idx, selectedRow: undefined, tableDeletionMarkCount: 0})
    },
    selectRow: (idx?: number) => {
      set({selectedRow: idx, selectedColumn: undefined, tableDeletionMarkCount: 0})
    },
    setNewColumnPosition: (pagePoint?: Point) => {
        if(typeof(pagePoint) === "undefined"){
            set({newColumnPosition: undefined})
            return
        }

        const tables = get().tables
        const selectedTableIdx = get().selectedTable
        const documentPosition = get().documentPosition
        const images = get().images
        const currentImageIndex = get().currentImageIndex
        const rotationDegrees = get().rotationDegrees
        if (typeof (selectedTableIdx) !== "undefined" &&
            typeof (documentPosition) !== "undefined" && typeof(images) !== "undefined") {
            const table = tables[selectedTableIdx]
            if (typeof (table) !== "undefined") {
                const rotatedPagePoint = rotatePoint(pagePoint, table.rotationDegrees - rotationDegrees, addPoints(images[currentImageIndex].center, documentPosition))
                const columnPositionInsideTable = rotatedPagePoint.x - documentPosition.x - table.outline.topLeft.x
                set({newColumnPosition: Math.round(columnPositionInsideTable - 7)})
            }
        }
    },
    setNewRowPosition: (pagePoint?: Point) => {
        if(typeof(pagePoint) === "undefined"){
            set({newRowPosition: undefined})
            return
        }

        const tables = get().tables
        const selectedTableIdx = get().selectedTable
        const documentPosition = get().documentPosition
        const images = get().images
        const currentImageIndex = get().currentImageIndex
        const rotationDegrees = get().rotationDegrees
        if (typeof (selectedTableIdx) !== "undefined" &&
            typeof (documentPosition) !== "undefined" && typeof(images) !== "undefined") {
            const table = tables[selectedTableIdx]
            if (typeof (table) !== "undefined") {
                const rotatedPagePoint = rotatePoint(pagePoint, table.rotationDegrees - rotationDegrees, addPoints(images[currentImageIndex].center, documentPosition))
                const rowPositionInsideTable = rotatedPagePoint.y - documentPosition.y - table.outline.topLeft.y
                set({newRowPosition: Math.round(rowPositionInsideTable - 7)})
            }
        }
    },
    addColumn: () => {
        const tables = get().tables
        const selectedTableIdx = get().selectedTable
        const newColumnPosition = get().newColumnPosition
        if (typeof (selectedTableIdx) !== "undefined" && typeof(newColumnPosition) !== "undefined") {
            const table = tables[selectedTableIdx]
            if (typeof (table) !== "undefined") {
                const newColumns = [...table.columns, newColumnPosition].sort((a, b) => a - b)
                const newTable = {...table, columns: newColumns}
                const newTables = [...tables.slice(0, selectedTableIdx), newTable, ...tables.slice(selectedTableIdx+1)]
                set({tables: newTables, tableDeletionMarkCount: 0})
            }
        }
    },
    addRow: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const newRowPosition = get().newRowPosition
        if (typeof (selectedTable) !== "undefined" && typeof(newRowPosition) !== "undefined") {
            const table = tables[selectedTable]
            if (typeof (table) !== "undefined") {
                const newRows = [...table.rows, newRowPosition].sort((a, b) => a - b)
                const newTable = {...table, rows: newRows}
                const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable+1)]
                set({tables: newTables, tableDeletionMarkCount: 0})
            }
        }
    },
    deleteTable: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const tableDeletionMarkCount = get().tableDeletionMarkCount
        if (typeof (selectedTable) !== "undefined") {
            if (tableDeletionMarkCount >= 2) {
                const newTables = [...tables.slice(0, selectedTable), ...tables.slice(selectedTable + 1)]
                set({selectedTable: undefined, tableDeletionMarkCount: 0, tables: newTables})
            } else {
                set({tableDeletionMarkCount: tableDeletionMarkCount + 1})
            }
        }
    },
    deleteColumn: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const selectedColumn = get().selectedColumn
        if (typeof (selectedTable) !== "undefined" && typeof(selectedColumn) !== "undefined") {
            const table = tables[selectedTable]
            if (typeof (table) !== "undefined") {
                const newColumns = [...table.columns.slice(0, selectedColumn), ...table.columns.slice(selectedColumn+1)]
                const newTable = {...table, columns: newColumns}
                const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable+1)]
                set({tables: newTables, tableDeletionMarkCount: 0, selectedColumn: undefined})
            }
        }
    },
    deleteRow: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const selectedRow = get().selectedRow
        if (typeof (selectedTable) !== "undefined" && typeof(selectedRow) !== "undefined") {
            const table = tables[selectedTable]
            if (typeof (table) !== "undefined") {
                const newRows = [...table.rows.slice(0, selectedRow), ...table.rows.slice(selectedRow+1)]
                const newTable = {...table, rows: newRows}
                const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable+1)]
                set({tables: newTables, tableDeletionMarkCount: 0, selectedRow: undefined})
            }
        }
    },
    acceptRowGuess: () => {
        const newRowGuesses = get().newRowGuesses
        const selectedTable = get().selectedTable
        if(typeof(newRowGuesses) === "undefined" ||
            typeof(selectedTable) === "undefined" ||
            typeof(newRowGuesses[selectedTable]) === "undefined" ||
            newRowGuesses[selectedTable] === null) return

        const tables = get().tables
        const newRowPosition = newRowGuesses[selectedTable]
        const table = tables[selectedTable]
        if (typeof(table) === "undefined" ||
            typeof(newRowPosition) === "undefined") return

        const newRows = [...table.rows, newRowPosition].sort((a, b) => a - b)
        const newTable = {...table, rows: newRows}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable+1)]
        set({tables: newTables, tableDeletionMarkCount: 0})
    },
    adjustRowGuess: (change: number) => {
        const newRowGuesses = get().newRowGuesses
        const selectedTable = get().selectedTable
        if(typeof(newRowGuesses) === "undefined" ||
            typeof(selectedTable) === "undefined") return
        const currentRowGuess = newRowGuesses[selectedTable]
        if (typeof(currentRowGuess) === "undefined" ||
            currentRowGuess=== null) return

        const adjustedRowGuesses = [...newRowGuesses.slice(0, selectedTable),
            currentRowGuess + change, ...newRowGuesses.slice(selectedTable+1)]
        set({newRowGuesses: adjustedRowGuesses})
    }
}))

const pushTablesToApi = async(state: AnnotatorState, previousState: AnnotatorState) => {
    if(state.tables === previousState.tables) return
    const subdir = getPathParts().subdir

    const {currentImageIndex, images, tables} = state
    if(typeof(currentImageIndex) === "undefined" || typeof(images) === "undefined") return
    const image = images[currentImageIndex]
    if(typeof(image) === "undefined") return
    await axios.post(`/${subdir}/tables/${image.name}`, tables)

    const response = await fetch(`/${subdir}/tables/${image.name}/next_rows`)
    const newRowGuesses = (await response.json())["next_rows"]
    if(response.status === 200){
        useStore.setState({newRowGuesses})
    }
}

const unsubTables = useStore.subscribe(pushTablesToApi)

function App() {
    const fetchImages = useStore(state => state.fetchImages)
    const setImageIndex = useStore(state => state.setImageIndex)
    const increaseRotationDegrees = useStore(state => state.increaseRotationDegrees)
    const setRotationDegrees = useStore(state => state.setRotationDegrees)
    const tables = useStore(state => state.tables)
    const unfinishedTable = useStore(state => state.unfinishedTable)
    const imageIdx = useStore(state => state.currentImageIndex)
    const images = useStore(state => state.images)
    const setMousePosition = useStore(state => state.setMousePosition)
    const deleteTable = useStore(state => state.deleteTable)
    const deleteRow = useStore(state => state.deleteRow)
    const deleteColumn = useStore(state => state.deleteColumn)
    const selectedTable = useStore(state => state.selectedTable)
    const selectedColumn = useStore(state => state.selectedColumn)
    const selectedRow = useStore(state => state.selectedRow)
    const cancelActions = useStore(state => state.cancelActions)
    const acceptRowGuess = useStore(state => state.acceptRowGuess)
    const adjustRowGuess = useStore(state => state.adjustRowGuess)
    const toggleImageStatus = useStore(state => state.toggleImageStatus)

    useEffect(() => {
        if(typeof(images) === "undefined") {
            fetchImages()
        }
    })

    const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>) => {
        setMousePosition({x: e.pageX, y: e.pageY})
    }

    const deleteFunc = () => {
        if(typeof(selectedTable) !== "undefined") {
            if(typeof(selectedColumn) !== "undefined") {
                deleteColumn()
            } else if (typeof(selectedRow) !== "undefined") {
                deleteRow()
            } else {
                deleteTable()
            }
        }
    }

    const hotkeyHandlers = {
        PREVIOUS_IMAGE:  () => setImageIndex(imageIdx - 1),
        NEXT_IMAGE:  () => setImageIndex(imageIdx + 1),
        INCREASE_ROTATION: () => increaseRotationDegrees(0.3),
        DECREASE_ROTATION: () => increaseRotationDegrees(-0.3),
        ZERO: () => setRotationDegrees(0),
        ESC: cancelActions,
        BACKSPACE_OR_DELETE: deleteFunc,
        R: acceptRowGuess,
        F: toggleImageStatus,
        UP: () => adjustRowGuess(-1),
        DOWN: () => adjustRowGuess(1)
    }

    if(typeof(images) != "undefined" && images.length > 0) {
        const image = images[imageIdx]
        return (
            <div className="App" onMouseMove={e => handleMouseMove(e)}>
                <GlobalHotKeys keyMap={keyMap} handlers={hotkeyHandlers} allowChanges={true}>
                    <div>{image.finished ? "done" : "work in progress"}</div>
                    <DocumentImage {...image} />
                    {tables.map((t, i) => {
                        return (
                            <TableElement key={i} tableTopLeft={t.outline.topLeft}
                                          tableBottomRight={t.outline.bottomRight}
                                          imageCenter={image.center}
                                          tableIdx={i}
                                          tableRotation={t.rotationDegrees}
                                          columns={t.columns}
                                          rows={t.rows}/>
                        )
                    })}
                    {typeof(unfinishedTable) != "undefined" ? <StartedTable {...unfinishedTable}
                                                                            imageCenter={image.center} /> : null}
                </GlobalHotKeys>
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

function StartedTable(props: { firstPoint: Point, imageCenter: Point } ) {
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
                     transform: `translate(${rectangle.topLeft.x}px, ${rectangle.topLeft.y}px)`,
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

function TableElement(props: {tableTopLeft: Point, tableBottomRight: Point, tableRotation: number,
                              tableIdx: number, imageCenter: Point, columns: number[], rows: number[]}) {
    const rotationDegrees = useStore(state => state.rotationDegrees)
    const selectTable = useStore(state => state.selectTable)
    const selectedTable = useStore(state => state.selectedTable)
    const tableDeletionMarkCount = useStore(state => state.tableDeletionMarkCount)
    const isSelected = typeof(selectedTable) !== "undefined" && selectedTable === props.tableIdx
    const deletionMarkColors = ["green", "yellow", "red"]
    const borderColor = !isSelected ? "black" : deletionMarkColors[tableDeletionMarkCount] || "red"
    const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault()
        selectTable(props.tableIdx)
    }

    return (
        <div className="table"
             style={{transform: `rotate(${rotationDegrees - props.tableRotation}deg) translate(${props.tableTopLeft.x}px, ${props.tableTopLeft.y}px)`,
                     width: `${props.tableBottomRight.x - props.tableTopLeft.x}px`,
                     height: `${props.tableBottomRight.y - props.tableTopLeft.y}px`,
                     transformOrigin: `${props.imageCenter.x}px ${props.imageCenter.y}px`,
                     borderColor: borderColor,
                     cursor: isSelected ? "default" : "pointer"}}
             onClick={e => handleClick(e)}>
            {props.columns.map((c, i) => {
                return (
                    <ColumnLine key={i} idx={i} position={c} parentTableSelected={isSelected}/>
                )
            })}
            {props.rows.map((r, i) => {
                return (
                    <RowLine key={i} idx={i} position={r} parentTableSelected={isSelected}/>
                )
            })}
            {isSelected ? <ColumnSetterSpace/> : null}
            {isSelected ? <RowSetterSpace/> : null}
            {isSelected ? <NewColumnLine/> : null}
            {isSelected ? <NewRowLine/> : null}
            {isSelected ? <GuessedRowLine tableIdx={props.tableIdx}/> : null}
        </div>
    )
}

function ColumnLine(props: {position: number, idx: number, parentTableSelected: boolean}) {
    const selectColumn = useStore(state => state.selectColumn)
    const selectedColumn = useStore(state => state.selectedColumn)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(props.parentTableSelected) {
            selectColumn(props.idx)
            e.stopPropagation()
        }
    }

    const isSelected = props.parentTableSelected && props.idx === selectedColumn

    return (<div className="columnLine" onClick={handleMouseClick}
                 style={{left: `${props.position}px`,
                     cursor: isSelected ? "default" : "pointer",
                     background: isSelected ? "blue" : ""}}/>)
}

function RowLine(props: {position: number, idx: number, parentTableSelected: boolean}) {
    const selectRow = useStore(state => state.selectRow)
    const selectedRow = useStore(state => state.selectedRow)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(props.parentTableSelected) {
            selectRow(props.idx)
            e.stopPropagation()
        }
    }

    const isSelected = props.parentTableSelected && props.idx === selectedRow

    return (<div className="rowLine"  onClick={handleMouseClick}
                 style={{top: `${props.position}px`,
                     cursor: isSelected ? "default": "pointer",
                     background: isSelected ? "brown" : ""}}/>)
}

function NewColumnLine() {
    const newColumnPosition = useStore(state => state.newColumnPosition)
    if (typeof(newColumnPosition) !== "undefined") {
        return (<div className="columnLine" style={{left: `${newColumnPosition}px`}}/>)
    } else {
        return null
    }
}

function NewRowLine() {
    const newRowPosition = useStore(state => state.newRowPosition)
    if (typeof(newRowPosition) !== "undefined") {
        return (<div className="rowLine" style={{top: `${newRowPosition}px`}}/>)
    } else {
        return null
    }
}

function GuessedRowLine(props: {tableIdx: number}) {
    const newRowGuesses = useStore(state => state.newRowGuesses)
    if(typeof(newRowGuesses) === "undefined" ||
        newRowGuesses === null ||
        newRowGuesses.length <= props.tableIdx ||
        typeof(newRowGuesses[props.tableIdx]) === "undefined" ||
        newRowGuesses[props.tableIdx] === null) return null

    return (<div className="rowLine"
                 style={{top: `${newRowGuesses[props.tableIdx]}px`,
                         background: "rgba(0, 128, 0, 0.3)"}}/>)
}

function ColumnSetterSpace(){
    const setNewColumnPosition = useStore(state => state.setNewColumnPosition)
    const addColumn = useStore(state => state.addColumn)

    const handleMouseLeave = (e: React.MouseEvent<Element, MouseEvent>) => {
        setNewColumnPosition(undefined)
    }

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        addColumn()
    }

    const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>) => {
        setNewColumnPosition({x: e.pageX, y: e.pageY})
    }

    return (
        <div className="columnSetterSpace" onMouseMove={handleMouseMove} onClick={handleMouseClick}
             onMouseLeave={handleMouseLeave}/>
    )
}

function RowSetterSpace(){
    const setNewRowPosition = useStore(state => state.setNewRowPosition)
    const addRow = useStore(state => state.addRow)

    const handleMouseLeave = (e: React.MouseEvent<Element, MouseEvent>) => {
        setNewRowPosition(undefined)
    }

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        addRow()
    }

    const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>) => {
        setNewRowPosition({x: e.pageX, y: e.pageY})
    }

    return (
        <div className="rowSetterSpace" onMouseMove={handleMouseMove} onClick={handleMouseClick}
             onMouseLeave={handleMouseLeave}/>
    )
}

function DocumentImage(image: Image) {
    const ref = React.useRef<HTMLImageElement>(null)
    const outlineTable = useStore(state => state.outlineTable)
    const rotationDegrees = useStore(state => state.rotationDegrees)
    const setDocumentPosition = useStore(state => state.setDocumentPosition)
    const documentPosition = useStore(state => state.documentPosition)
    const selectedTable = useStore(state => state.selectedTable)
    const selectTable = useStore(state => state.selectTable)

    useEffect(() => {
        const imageRef = ref.current
        if (imageRef && typeof(documentPosition) == "undefined") {
            const newDocumentPosition = getPageOffset(imageRef)
            setDocumentPosition(newDocumentPosition)
        }
    })
    const handleClick = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
        e.preventDefault()
        if (typeof(selectedTable) === "undefined") {
            if (documentPosition) {
                outlineTable({x: e.pageX - documentPosition.x, y: e.pageY - documentPosition.y}, rotationDegrees)
            }
        } else {
            selectTable(undefined)
        }
    }

    return (
        <img ref={ref} className="documentImage" src={image.src} width={image.width} height={image.height}
        style={{transform: `rotate(${rotationDegrees}deg)`}} alt="The document"
             onClick={e => handleClick(e)}/>
    )

}

export default App;
