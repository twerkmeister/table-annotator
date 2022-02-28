import create from "zustand";
import {getDataDir} from "./path";
import {CellIndex, Image, Point, Table, UnfinishedTable} from "./types";
import {addPoints, makeRectangle, rotatePoint} from "./geometry";

const withCellGrid = (table: Table): Table => {
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

const makeTable = (p1: Point, p2: Point, rotationDegrees: number): Table => {
    const outline = makeRectangle(p1, p2)
    return {
        outline, rotationDegrees, columns: [], rows: [],
    }
}

export type AnnotatorState = {
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

export const useStore = create<AnnotatorState>((set, get) => ({
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