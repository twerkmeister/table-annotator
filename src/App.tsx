import React, {useEffect} from 'react';
import create from 'zustand'
import { GlobalHotKeys } from "react-hotkeys";
import axios from 'axios';
import {getDataDir} from './path';
import './App.css';
import {Point, Rectangle, Image, Table, CellIndex, UnfinishedTable, CellContent} from './types'
import {makeRectangle, height, width, getPageOffset, rotatePoint, subtractPoints, addPoints} from './geometry'
import {DataTypes, DataTypesOptions} from "./dataModel";
import MultiSelect from "./components/MultiSelect";



function flatten<T>(arr: T[][]): T[] {
    return ([] as T[]).concat(...arr);
}



const keyMap = {
    PREVIOUS_IMAGE: "b",
    NEXT_IMAGE: "n",
    INCREASE_ROTATION: "e",
    DECREASE_ROTATION: "q",
    ESC: "esc",
    ZERO: "0",
    BACKSPACE_OR_DELETE: ["Backspace", "Delete"],
    UP: "w",
    LEFT: "a",
    DOWN: "s",
    RIGHT: "d",
    ANNOTATE_ROWS_AUTOMATICALLY: "z",
    REFINE_COLUMNS: "v",
    OCR_START_AND_VIEW: "o",
    HELP_VIEW: "h",
    EXPORT: "x",
    HELP: "h",
};

function downloadCSV(dataDir?: string, imageName?: string, tableId?: number): void {
    if (typeof(dataDir) === "undefined" || typeof(imageName) === "undefined" ||
        typeof(tableId) === "undefined") return
    fetch(`/${dataDir}/${imageName}/export_data/${tableId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/csv',
        },
    })
        .then((response) => response.blob())
        .then((blob) => {
            // Create blob link to download
            const url = window.URL.createObjectURL(
                new Blob([blob]),
            );
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `${imageName}_${tableId}.csv`,
            );

            // Append to html link element page
            document.body.appendChild(link);

            // Start download
            link.click();

            // Clean up and remove the link
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
        });
}



function makeTable(p1: Point, p2: Point, rotationDegrees: number): Table {
    const outline = makeRectangle(p1, p2)
    return {
        outline, rotationDegrees, columns: [], rows: [],
    }
}

function withCellGrid(table: Table): Table {
    const rows = [0,  ...table.rows, table.outline.bottomRight.y - table.outline.topLeft.y]
    const columns = [0, ...table.columns, table.outline.bottomRight.x - table.outline.topLeft.x]
    const cellGrid = rows.slice(0, -1).map((_, r_i) => {
        return columns.slice(0, -1).map((_, c_i) => {
            const topLeft = {x: columns[c_i], y: rows[r_i]}
            const bottomRight = {x: columns[c_i+1], y:rows[r_i+1]}
            return {topLeft, bottomRight}
        })
    })
    return {...table, cellGrid}
}

type AnnotatorState = {
    images?: Image[],
    currentImageIndex: number,
    selectedTable?: number,
    selectedColumn?: number,
    selectedRow?: number,
    selectedCellColumnLine?: CellIndex,
    unfinishedTable?: UnfinishedTable,
    newColumnPosition?: number,
    newRowPosition?: number,
    newRowGuesses?: Array<number | undefined>,
    mousePosition: Point,
    documentPosition?: Point,
    rotationDegrees: number,
    tableDeletionMarkCount: number,
    tables: Table[],
    ocrView: boolean,
    helpView: boolean,
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
    segmentTable: () => void
    predictTableContent: () => void
    adjustRow: (change: number) => void
    addCellGrid: () => void
    selectCellColumnLine: (row: number, column: number) => void
    adjustColumn: (change: number) => void
    setOCRView: (ocrView: boolean) => void
    setHelpView: (helpView: boolean) => void
    updateCellText: (i: number, j: number, text: string) => void
    setColumnTypes: (column: number, types: string[]) => void
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
    selectedCellColumnLine: undefined,
    mousePosition: {x: 0, y: 0},
    documentPosition: undefined,
    rotationDegrees: 0,
    tableDeletionMarkCount: 0,
    tables: [],
    ocrView: false,
    helpView: false,
    fetchImages: async() => {
        const dataDir = getDataDir()
        const response = await fetch(`/${dataDir}/images`)
        const images = (await response.json())["images"]
        if (images.length > 0) {
            const table_response = await fetch(`/${dataDir}/tables/${images[0].name}`)
            const tables = (await table_response.json())["tables"]
            set({images, tables, currentImageIndex: 0})
        } else {
            set({images, currentImageIndex: 0})
        }

    },
    setImageIndex: async(idx: number) => {
        const dataMode = get().ocrView
        if (dataMode) return
        const images = get().images
        if(typeof(images) === "undefined") return
        const image = images[idx]
        if(typeof(image) === "undefined") return

        const dataDir = getDataDir()
        const table_response = await fetch(`/${dataDir}/tables/${image.name}`)
        const tables = (await table_response.json())["tables"]
        set({ currentImageIndex: idx, rotationDegrees: 0, documentPosition: undefined,
            tables, unfinishedTable: undefined, selectedTable: undefined, selectedRow: undefined,
            selectedColumn: undefined, newRowGuesses: undefined, selectedCellColumnLine: undefined})

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
            selectedColumn: undefined, selectedRow: undefined, selectedCellColumnLine: undefined})
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
    segmentTable: async () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const images = get().images
        const currentImageIndex = get().currentImageIndex
        if (typeof (selectedTable) === "undefined" ||
            typeof (images) === "undefined") return
        const image = images[currentImageIndex]
        const table = tables[selectedTable]
        if (typeof(image) === "undefined" ||
            typeof(table) === "undefined") return

        if (table.rows.length > 0) return
        const dataDir = getDataDir()

        const response =
            await fetch(`/${dataDir}/${image.name}/predict_table_structure/${selectedTable}`)
        const rows = (await response.json())["rows"]

        const newTables = [...tables.slice(0, selectedTable), {...table, rows}, ...tables.slice(selectedTable + 1)]
        set({tables: newTables})},
    predictTableContent: async () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const images = get().images
        const currentImageIndex = get().currentImageIndex
        if (typeof (selectedTable) === "undefined" ||
            typeof (images) === "undefined") return
        const image = images[currentImageIndex]
        const table = tables[selectedTable]
        if (typeof(image) === "undefined" ||
            typeof(table) === "undefined") return

        if (typeof(table.cellGrid) === "undefined" ||
            typeof(table.cellContents) !== "undefined") return

        const dataDir = getDataDir()

        const response =
            await fetch(`/${dataDir}/${image.name}/predict_table_contents/${selectedTable}`)
        const cellContents = (await response.json())["contents"]
        const columnTypes = table.cellGrid[0].map((cell, i) => [])

        const newTables = [...tables.slice(0, selectedTable), {...table, cellContents, columnTypes},
            ...tables.slice(selectedTable + 1)]
        set({tables: newTables})},
    adjustRow: (change: number) => {
        const newRowGuesses = get().newRowGuesses
        const selectedTable = get().selectedTable
        const selectedRow = get().selectedRow
        const tables = get().tables


        if (typeof(selectedTable) === "undefined") return

        if (typeof(selectedRow) !== "undefined") {
            const table = tables[selectedTable]
            if (typeof (table) !== "undefined") {
                const row = table.rows[selectedRow]
                if (typeof (row) !== "undefined") {
                    const newRows = [...table.rows.slice(0, selectedRow), row + change, ...table.rows.slice(selectedRow + 1)]
                    const newTable = {...table, rows: newRows}
                    const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
                    set({tables: newTables})
                }
            }
        }
    },
    addCellGrid: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        if (typeof (selectedTable) === "undefined" ) return

        const table = tables[selectedTable]
        if (typeof(table) === "undefined") return
        if (table.cellGrid !== undefined) return
        if (table.cellContents !== undefined) return

        const tableWithCellGrid = withCellGrid(table)
        const newTables = [...tables.slice(0, selectedTable), tableWithCellGrid, ...tables.slice(selectedTable+1)]
        set({tables: newTables, tableDeletionMarkCount: 0, selectedRow: undefined, selectedColumn: undefined})
    },
    selectCellColumnLine: (row: number, column: number) => {
        set({selectedCellColumnLine: {row, column}})
    },
    adjustColumn: (change: number) => {
        const selectedTable = get().selectedTable
        const selectedColumn = get().selectedColumn
        const tables = get().tables
        const selectedColumnLine = get().selectedCellColumnLine

        if (typeof (selectedTable) === "undefined" ) return
        const table = tables[selectedTable]
        if (typeof (table) === "undefined") return

        if (typeof(selectedColumn) !== "undefined") {
            const column = table.columns[selectedColumn]
            if (typeof (column) !== "undefined") {
                const newColumns = [...table.columns.slice(0, selectedColumn), column + change,
                    ...table.columns.slice(selectedColumn + 1)]
                const newTable = {...table, columns: newColumns}
                const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
                set({tables: newTables})
            }
        } else if (typeof(selectedColumnLine) !== "undefined" && typeof(table.cellGrid) !== "undefined") {
            const relevantRow = table.cellGrid[selectedColumnLine.row]
            if (typeof(relevantRow) === "undefined") return
            const leftCell = relevantRow[selectedColumnLine.column]
            const rightCell = relevantRow[selectedColumnLine.column + 1]
            if (typeof(leftCell) === "undefined" || typeof(rightCell) === "undefined") return
            const leftCellWidth = leftCell.bottomRight.x - leftCell.topLeft.x
            const rightCellWidth = rightCell.bottomRight.x - rightCell.topLeft.x
            if (leftCellWidth + change < 10 || rightCellWidth - change < 10) return
            const newLeftCell = {...leftCell, bottomRight: {x: leftCell.bottomRight.x + change, y: leftCell.bottomRight.y }}
            const newRightCell = {...rightCell, topLeft: {x: rightCell.topLeft.x + change, y: rightCell.topLeft.y}}
            const newCellRow = [...relevantRow.slice(0, selectedColumnLine.column), newLeftCell, newRightCell,
                                ...relevantRow.slice(selectedColumnLine.column + 2)]
            const newCellGrid = [...table.cellGrid.slice(0, selectedColumnLine.row), newCellRow,
                                 ...table.cellGrid.slice(selectedColumnLine.row + 1)]
            const newTable = {...table, cellGrid: newCellGrid}
            const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
            set({tables: newTables})
        }
    },
    setOCRView: async (ocrView: boolean) => {
        await get().predictTableContent()
        const selectedTable = get().selectedTable
        const tables = get().tables
        if(typeof(selectedTable) === "undefined") return
        const table = tables[selectedTable]
        if(typeof(table) === "undefined" || typeof(table.cellContents) === "undefined") return
        set({ocrView})
    },
    setHelpView: (helpView: boolean) => {
      set({helpView})
    },
    updateCellText: (i: number, j: number, text: string) => {
        const selectedTable = get().selectedTable
        const tables = get().tables
        if(typeof(selectedTable) === "undefined") return
        const table = tables[selectedTable]
        if(typeof(table) === "undefined" || typeof(table.cellContents) === "undefined") return
        const newCell = {...table.cellContents[i][j], human_text: text}
        const relevantRow = table.cellContents[i]
        const newCellRow = [...relevantRow.slice(0, j), newCell, ...relevantRow.slice(j + 1)]
        const newCellContents = [...table.cellContents.slice(0, i), newCellRow, ...table.cellContents.slice(i + 1)]
        const newTable = {...table, cellContents: newCellContents}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
        set({tables: newTables})
    },
    setColumnTypes: (column: number, types: string[]) => {
        const selectedTable = get().selectedTable
        const tables = get().tables
        if(typeof(selectedTable) === "undefined") return
        const table = tables[selectedTable]
        if(typeof(table) === "undefined" || typeof(table.columnTypes) === "undefined") return

        const newColumnTypes = [...table.columnTypes.slice(0, column), types, ...table.columnTypes.slice(column+1)]
        const newTable = {...table, columnTypes: newColumnTypes}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
        set({tables: newTables})
    }
}))

const pushTablesToApi = async(state: AnnotatorState, previousState: AnnotatorState) => {
    if(state.tables === previousState.tables) return
    const dataDir = getDataDir()

    const {currentImageIndex, images, tables} = state
    if(typeof(currentImageIndex) === "undefined" || typeof(images) === "undefined") return
    const image = images[currentImageIndex]
    if(typeof(image) === "undefined") return
    await axios.post(`/${dataDir}/tables/${image.name}`, tables)
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
    const adjustRow = useStore(state => state.adjustRow)
    const segmentTable = useStore(state => state.segmentTable)
    const addCellGrid = useStore(state => state.addCellGrid)
    const adjustColumn = useStore(state => state.adjustColumn)
    const setOCRView = useStore(state => state.setOCRView)
    const setHelpView = useStore(state => state.setHelpView)
    const ocrView = useStore(state => state.ocrView)
    const helpView = useStore(state => state.helpView)
    const dataDir = getDataDir()

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
        ANNOTATE_ROWS_AUTOMATICALLY: segmentTable,
        OCR_START_AND_VIEW: () => setOCRView(!ocrView),
        UP: () => adjustRow(-2),
        DOWN: () => adjustRow(2),
        LEFT: () => adjustColumn(-5),
        RIGHT: () => adjustColumn(5),
        REFINE_COLUMNS: addCellGrid,
        HELP: () => setHelpView(!helpView),
        EXPORT: () => {
            if(typeof(images) === "undefined") return
            const image = images[imageIdx]
            if(typeof(image) === "undefined") return
            downloadCSV(dataDir, image.name, selectedTable)}
    }

    if(typeof(images) != "undefined" && images.length > 0) {
        const image = images[imageIdx]
        return (
            <div className="App" onMouseMove={e => handleMouseMove(e)}>
                <GlobalHotKeys keyMap={keyMap} handlers={hotkeyHandlers} allowChanges={true}>
                    {!ocrView ?
                        <div>
                            <DocumentImage {...image} />
                            {
                                tables.map((t, i) => {
                                    return (
                                        <TableElement key={i} tableTopLeft={t.outline.topLeft}
                                                      tableBottomRight={t.outline.bottomRight}
                                                      imageCenter={image.center}
                                                      tableIdx={i}
                                                      tableRotation={t.rotationDegrees}
                                                      columns={t.columns}
                                                      rows={t.rows}
                                                      cellGrid={t.cellGrid}
                                                      cellContents={t.cellContents}/>
                                    )
                                })
                            }
                            {typeof(unfinishedTable) != "undefined" ? <StartedTable {...unfinishedTable}
                                imageCenter={image.center} /> : null}
                        </div> : <SplitTable image_name={image.name}/>
                    }
                    {helpView && <HelpScreen/>}
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

function SplitTable(props: {image_name: string}) {
    const dataDir = getDataDir()
    const tables = useStore(state => state.tables)
    const selectedTable = useStore(state => state.selectedTable)
    const updateCellText = useStore(state => state.updateCellText)
    const setColumnTypes = useStore(state => state.setColumnTypes)
    if(typeof(selectedTable) === "undefined") return null
    const table = tables[selectedTable]
    if(typeof(table) === "undefined" ) return null
    if(typeof(table.cellGrid) === "undefined") return null
    if(typeof(table.cellContents) === "undefined") return null
    const columnTypes = table.columnTypes
    if(typeof(columnTypes) === "undefined") return null

    const handleInputOnBlur = (i: number, j: number ) => (e: React.FocusEvent<HTMLTextAreaElement>) => {
        updateCellText(i, j, e.target.value)
    }

    const onChangeType = (col: number) => (selectedTypes: string[]) => {
        setColumnTypes(col, selectedTypes)
    }

    return (
        <div className="splitTable">
            {table.cellGrid.map((row, i) => {
                return (
                    <div key={i} className="dataRow">
                        {
                            row.map((cell, j) => {
                                return (
                                    <div>
                                        <div>
                                        {i !== 0 ? null :
                                            <MultiSelect
                                                title={columnTypes[j].length.toString() || "0"}
                                                items={DataTypesOptions}
                                                selectedItems={columnTypes[j]}
                                                onChange={onChangeType(j)}
                                            />}
                                        </div>
                                        <div key={j} className="dataCell">
                                            <div>
                                                <img src={`/${dataDir}/${props.image_name}/cell_image/${selectedTable}/${i}/${j}`}
                                                     width={width(cell)}
                                                     height={height(cell)}
                                                     alt={`cell at ${i} ${j}`} />
                                            </div>
                                            <div>
                                                <textarea className="dataInput"
                                                          defaultValue={table.cellContents ?
                                                              table.cellContents[i][j].human_text ?
                                                                  table.cellContents[i][j].human_text :
                                                                  table.cellContents[i][j].ocr_text
                                                              : ""}
                                                          style={{width: `${width(cell)-6}px`,
                                                              height: `${Math.round(height(cell)*1.3-6)}px`}}
                                                          onBlur={handleInputOnBlur(i, j)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        }
                </div>
                )
                })
            }
        </div>
    )
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
        const rectangle = makeRectangle(props.firstPoint, mouseOffsetPosition)
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
                              tableIdx: number, imageCenter: Point, columns: number[], rows: number[],
                              cellGrid?: Rectangle[][], cellContents?: CellContent[][]}) {
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

    const body = props.cellGrid === undefined ? (
        <div>
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
        </div>
    ) : (
        <div>
            {flatten(props.cellGrid.map((row, row_i) => {
                return row.slice(0, -1).map((rect, column_i) => {
                    return <CellColumnLine row={row_i} column={column_i} parentTableSelected={isSelected}
                                           height={rect.bottomRight.y - rect.topLeft.y} left={rect.bottomRight.x}
                                           top={rect.topLeft.y} hasContentAlready={props.cellContents !== undefined}/>
                })
            }))}
            {flatten(props.cellGrid.map((row, row_i) => {
                return row.map((rect, column_i) => {
                    return <CellRowLine width={rect.bottomRight.x - rect.topLeft.x} left={rect.topLeft.x}
                                           top={rect.bottomRight.y}/>
                })
            }))}
        </div>
    )


    return (
        <div className="table"
             style={{transform: `rotate(${rotationDegrees - props.tableRotation}deg) translate(${props.tableTopLeft.x}px, ${props.tableTopLeft.y}px)`,
                     width: `${props.tableBottomRight.x - props.tableTopLeft.x}px`,
                     height: `${props.tableBottomRight.y - props.tableTopLeft.y}px`,
                     transformOrigin: `${props.imageCenter.x}px ${props.imageCenter.y}px`,
                     borderColor: borderColor,
                     cursor: isSelected ? "default" : "pointer"}}
             onClick={e => handleClick(e)}>
            {body}
        </div>
    )
}

function CellColumnLine(props: {row: number, column: number, left: number, top: number, height: number,
                                parentTableSelected: boolean, hasContentAlready: boolean}) {
    const selectCellColumnLine = useStore(state => state.selectCellColumnLine)
    const selectedCellColumnLine = useStore(state => state.selectedCellColumnLine)

    const handleMouseClick = (e: React.MouseEvent<Element, MouseEvent>) => {
        if(props.parentTableSelected) {
            selectCellColumnLine(props.row, props.column)
            e.stopPropagation()
        }
    }

    const isSelected = props.parentTableSelected && typeof(selectedCellColumnLine) !== "undefined" && 
        props.row === selectedCellColumnLine.row && props.column === selectedCellColumnLine.column

    return (<div className="cellColumnLine"
                 onClick={(e) => !props.hasContentAlready && handleMouseClick(e)}
                 style={{left: `${props.left}px`,
                     top: `${props.top}px`,
                     height: `${props.height}px`,
                     cursor: isSelected || props.hasContentAlready ? "default" : "pointer",
                     background: isSelected ? "blue" : ""}}/>)
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


function CellRowLine(props: {left: number, top: number, width: number}) {
    return (<div className="cellRowLine"
                 style={{top: `${props.top}px`,
                     left: `${props.left}px`,
                     width: `${props.width}px`}}/>)
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
        <img ref={ref} className="documentImage" src={`/${image.src}`} width={image.width} height={image.height}
        style={{transform: `rotate(${rotationDegrees}deg)`}} alt="The document"
             onClick={e => handleClick(e)}/>
    )

}

const HelpScreen = () => {
    return (
        <div className="helpScreen">
            <h2>Hilfe</h2>
            <div>
                <h3>Dokument auswählen</h3>
                <ol>
                    <li>Über die Tasten "n" und "b" kann zwischen den Dokumenten eines Pakets gewechselt werden.</li>
                </ol>
            </div>
            <div>
                <h3>Tabellen Zeichnen</h3>
                <ol>
                    <li>Dokumente mittels Tasten "q" und "e" drehen, sodass der Tabellenkörper gerade steht</li>
                    <li>Oberen, linken Eckpunkt des Tabellenkörpers mit der linken Maustaste setzen</li>
                    <li>Unteren, rechten Eckpunkt des Tabellenkörpers mit der linken Maustaste setzen</li>
                </ol>
                Mit der Escapetaste kann das Zeichnen abgebrochen werden, mit der Rücktaste (3x) die fertige Tabelle
                gelöscht werden.
            </div>
            <div>
                <h3>Zeilen und Spalten einfügen</h3>
                Die Tabelle muss ausgewählt sein (sichtbar am grünen Rand)
                <ol>
                    <li>Zeilen automatisch einfügen lassen mittels Taste <b>z</b></li>
                    <li>Zeilen können zur Korrektur ausgewählt und über die Tasten "w" und "s"
                        nach oben oder unten verschoben oder mittels der Rücktaste gelöschen werden</li>
                    <li>fehlende Zeilen über den orangenen, linken Rand der Tabelle hinzugefügen</li>
                    <li>Spalten über den lilanen, oberen Rand der Tabelle hinzufügen</li>
                    <li>Spalten bei Bedarf auswählen und über die Tasten "a" und "d" nach links bzw. rechts verschieben,
                    oder über die Rücktaste löschen und neu setzen</li>
                </ol>
                Sollte sich beim Setzen der Zeilen und Spalten herausstellen, dass die Tabelle doch nicht richtig
                ausgerichtet wurde, kann sie mit der Rücktaste (3x) wieder gelöscht werden. Falls das Ergebnis der
                automatischen Zeilensetzung zu schlecht ist, kann es Sinn machen, die Tabelle zu löschen und die Zeilen
                komplett händisch zu setzen.
            </div>
            <div>
                <h3>Spalten verfeinern</h3>
                Sobald dieser Schritt begonnen wird können keine neuen Spalten und Zeilen gesetzt werden. <br/>
                Die Tabelle muss ausgewählt sein (sichtbar am grünen Rand)
                <ol>
                    <li>Verfeinerung der Spalten über die Taste "v" beginnen. Die farblichen Ränder links, und rechts
                    zum Setzen von Zeilen und Spalten verschwinden daraufhin.</li>
                    <li>Einzelne vertikale Zellwände können ausgewählt werden und mittels Tasten "a" und "d" nach
                        links und rechts verschoben werdern</li>
                </ol>
            </div>
            <div>
                <h3>OCR</h3>
                Sobald dieser Schritt begonnne wird, können die Spalten nicht weiter verfeinert werden. <br/>
                Die Tabelle muss ausgewählt sein (sichtbar am grünen Rand)
                <ol>
                    <li>OCR über die Taste "o" beginnen, nach einer kurzen Wartezeit steht das OCR Ergebnis
                        bereit und die Tabelle erscheint in einer aufgespaltenen Form. Diese Ansicht kann
                        ebensfalls über die Taste "o" wieder verlassen werden.</li>
                    <li>Auswahl der Datentypen im Kopf der Tabelle</li>
                    <li>Korrektur der OCR Ergebnisse. Änderungen werden automatisch gespeichert, sobald ein
                        Textfeld verlassen wird. Mittels der Tabulatortaste kann man zum nächsten Textfeld springen</li>
                </ol>
            </div>
            <div>
                <h3>Export</h3>
                <li>Bei ausgewählter Tabelle oder in der OCR-Ansicht durch die Taste "x"</li>
            </div>
        </div>
    )
}

export default App;
