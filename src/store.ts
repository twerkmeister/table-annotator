import create from "zustand";
import {getDataDir, getDocId} from "./path";
import {CellIndex, Image, Point, Table, UnfinishedTable} from "./types";
import {addPoints, makeRectangle, rotatePoint, calculateCellRectangle, width} from "./geometry";


const makeTable = (p1: Point, p2: Point, rotationDegrees: number): Table => {
    const outline = makeRectangle(p1, p2)
    return {
        outline, rotationDegrees, columns: [], rows: [], cells: [[Object()]], needsOCR: true
    }
}

export type AnnotatorState = {
    images?: Image[],
    currentImageIndex: number,
    selectedTable?: number,
    selectedColumn?: number,
    selectedRow?: number,
    selectedCellColumnLine?: CellIndex,
    selectedCellRowLine?: CellIndex,
    unfinishedTable?: UnfinishedTable,
    newColumnPosition?: number,
    newRowPosition?: number,
    mousePosition: Point,
    documentPosition?: Point,
    rotationDegrees: number,
    tableDeletionMarkCount: number,
    tables: Table[],
    ocrView: boolean,
    helpView: boolean,
    helpGridView: boolean,
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
    selectCellColumnLine: (row: number, column: number) => void
    selectCellRowLine: (row: number, column: number) => void
    adjustColumn: (change: number) => void
    setOCRView: (ocrView: boolean) => void
    setHelpView: (helpView: boolean) => void
    setHelpGridView: (helpGridView: boolean) => void
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
    selectedCellRowLine: undefined,
    mousePosition: {x: 0, y: 0},
    documentPosition: undefined,
    rotationDegrees: 0,
    tableDeletionMarkCount: 0,
    tables: [],
    ocrView: false,
    helpView: false,
    helpGridView: false,
    fetchImages: async() => {

        const dataDir = getDataDir()
        const docId = getDocId()
        const response = await fetch(`/${dataDir}/images`)
        const images: Image[] = (await response.json())["images"]
        set({images})
        if(docId && images.length > 0){
            const idx = images.findIndex((i: Image) => i.docId === docId)
            if(idx !== -1){
                get().setImageIndex(idx)
                return
            }
        }
        get().setImageIndex(0)
    },
    setImageIndex: async(idx: number) => {
        const dataMode = get().ocrView
        if (dataMode) return
        const images = get().images
        if(images === undefined) return
        const image = images[idx]
        if(image === undefined) return

        const dataDir = getDataDir()
        const table_response = await fetch(`/${dataDir}/tables/${image.name}`)
        const tables = (await table_response.json())["tables"]
        set({ currentImageIndex: idx, rotationDegrees: 0, documentPosition: undefined,
            tables, unfinishedTable: undefined, selectedTable: undefined, selectedRow: undefined,
            selectedColumn: undefined, selectedCellColumnLine: undefined, selectedCellRowLine: undefined })

        const new_location = getDocId() ?
            window.location.href.replace(/\/[0-9_]*$/, `/${image.docId}`)
            : window.location.href.replace(/\/$/, "") + `/${image.docId}`
        window.history.pushState({pageTitle: `${dataDir} ${image.docId}`}, "", new_location)

    },
    outlineTable: (p: Point, rotationDegrees: number) => {
        const currentTables = get().tables
        const unfinishedTable = get().unfinishedTable
        if (unfinishedTable !== undefined) {
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
            selectedColumn: undefined, selectedRow: undefined, selectedCellColumnLine: undefined,
            selectedCellRowLine: undefined})
    },
    selectColumn: (idx?: number) => {
        set({selectedColumn: idx, selectedRow: undefined,
            selectedCellColumnLine: undefined, selectedCellRowLine: undefined,
            tableDeletionMarkCount: 0})
    },
    selectRow: (idx?: number) => {
        set({selectedRow: idx, selectedColumn: undefined,
            selectedCellColumnLine: undefined, selectedCellRowLine: undefined,
            tableDeletionMarkCount: 0})
    },
    setNewColumnPosition: (pagePoint?: Point) => {
        if(pagePoint === undefined){
            set({newColumnPosition: undefined})
            return
        }
        const tables = get().tables
        const selectedTableIdx = get().selectedTable
        const documentPosition = get().documentPosition
        const images = get().images
        if (selectedTableIdx === undefined || documentPosition === undefined || images === undefined) return

        const table = tables[selectedTableIdx]
        if (table === undefined) return
        const currentImageIndex = get().currentImageIndex
        const rotationDegrees = get().rotationDegrees

        const rotatedPagePoint = rotatePoint(pagePoint,
            table.rotationDegrees - rotationDegrees,
            addPoints(images[currentImageIndex].center, documentPosition))
        const columnPositionInsideTable = rotatedPagePoint.x - documentPosition.x - table.outline.topLeft.x
        set({newColumnPosition: Math.round(columnPositionInsideTable - 7)})

    },
    setNewRowPosition: (pagePoint?: Point) => {
        if(pagePoint === undefined){
            set({newRowPosition: undefined})
            return
        }

        const tables = get().tables
        const selectedTableIdx = get().selectedTable
        const documentPosition = get().documentPosition
        const images = get().images
        if (selectedTableIdx === undefined || documentPosition === undefined || images === undefined) return

        const table = tables[selectedTableIdx]
        if (table === undefined) return

        const currentImageIndex = get().currentImageIndex
        const rotationDegrees = get().rotationDegrees
        const rotatedPagePoint = rotatePoint(pagePoint,
            table.rotationDegrees - rotationDegrees,
            addPoints(images[currentImageIndex].center, documentPosition))
        const rowPositionInsideTable = rotatedPagePoint.y - documentPosition.y - table.outline.topLeft.y
        set({newRowPosition: Math.round(rowPositionInsideTable - 7)})

    },
    addColumn: () => {
        const tables = get().tables
        const selectedTableIdx = get().selectedTable
        const newColumnPosition = get().newColumnPosition
        if (selectedTableIdx === undefined || newColumnPosition === undefined) return

        const table = tables[selectedTableIdx]
        if (table === undefined) return

        const newColumns = [...table.columns, newColumnPosition].sort((a, b) => a - b)

        const separatedColumn = newColumns.indexOf(newColumnPosition)

        const newCells =
            table.cells.map((row, i) => {
                return row.flatMap((cell, j) => {
                    if (j !== separatedColumn){
                        return [cell]
                    } else {
                        const leftCell = {...cell}
                        delete(leftCell.right)
                        delete(leftCell.ocr_text)
                        delete(leftCell.human_text)
                        const rightCell = {...cell}
                        delete(rightCell.left)
                        delete(rightCell.ocr_text)
                        delete(rightCell.human_text)
                        return [leftCell, rightCell]
                    }
                })
            })
        const newTable = {...table, columns: newColumns, cells: newCells}
        const newTables = [...tables.slice(0, selectedTableIdx), newTable, ...tables.slice(selectedTableIdx+1)]
        set({tables: newTables, tableDeletionMarkCount: 0})
    },
    addRow: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const newRowPosition = get().newRowPosition
        if (selectedTable === undefined || newRowPosition === undefined) return

        const table = tables[selectedTable]
        if (table === undefined) return
        const newRows = [...table.rows, newRowPosition].sort((a, b) => a - b)
        const separatedRow = newRows.indexOf(newRowPosition)

        const newCells =
            table.cells.flatMap((row, i) => {
                if (i !== separatedRow) {
                    return [row]
                } else {
                    const upperRow = row.map((cell, j) => {
                        const newCell = {...cell}
                        delete(newCell.bottom)
                        delete(newCell.ocr_text)
                        delete(newCell.human_text)
                        return newCell
                    })
                    const lowerRow = row.map((cell, j) => {
                        const newCell = {...cell}
                        delete(newCell.top)
                        delete(newCell.ocr_text)
                        delete(newCell.human_text)
                        return newCell
                    })
                    return [upperRow, lowerRow]
                }
            })

        const newTable = {...table, rows: newRows, cells: newCells}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable+1)]
        set({tables: newTables, tableDeletionMarkCount: 0})
    },
    deleteTable: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const tableDeletionMarkCount = get().tableDeletionMarkCount
        if (selectedTable !== undefined) {
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
        if (selectedTable !== undefined && selectedColumn !== undefined) {
            const table = tables[selectedTable]
            if (table !== undefined) {
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
        if (selectedTable !== undefined && selectedRow !== undefined) {
            const table = tables[selectedTable]
            if (table !== undefined) {
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
        if (selectedTable === undefined ||
            images === undefined) return
        const image = images[currentImageIndex]
        const table = tables[selectedTable]
        if (image === undefined ||
            table === undefined) return

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
        if (selectedTable === undefined ||
            images === undefined) return
        const image = images[currentImageIndex]
        const table = tables[selectedTable]
        if (image === undefined ||
            table === undefined) return

        const dataDir = getDataDir()

        const response =
            await fetch(`/${dataDir}/${image.name}/predict_table_contents/${selectedTable}`)
        const cellContents = (await response.json())["contents"]
        const columnTypes = table.cells[0].map((cell, i) => [])

        const newTables = [...tables.slice(0, selectedTable), {...table, cellContents, columnTypes},
            ...tables.slice(selectedTable + 1)]
        set({tables: newTables})},
    adjustRow: (change: number) => {
        const selectedTable = get().selectedTable
        const selectedRow = get().selectedRow
        const tables = get().tables


        if (selectedTable === undefined) return

        if (selectedRow !== undefined) {
            const table = tables[selectedTable]
            if (table !== undefined) {
                const row = table.rows[selectedRow]
                if (row !== undefined) {
                    const newRows = [...table.rows.slice(0, selectedRow), row + change, ...table.rows.slice(selectedRow + 1)]
                    const newTable = {...table, rows: newRows}
                    const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
                    set({tables: newTables})
                }
            }
        }
    },
    selectCellColumnLine: (row: number, column: number) => {
        set({selectedCellColumnLine: {row, column}, selectedColumn: undefined, selectedRow: undefined,
        selectedCellRowLine: undefined})
    },
    selectCellRowLine: (row: number, column: number) => {
        set({selectedCellRowLine: {row, column}, selectedColumn: undefined, selectedRow: undefined,
            selectedCellColumnLine: undefined})
    },
    adjustColumn: (change: number) => {
        const selectedTable = get().selectedTable
        const selectedColumn = get().selectedColumn
        const tables = get().tables
        const selectedColumnLine = get().selectedCellColumnLine

        if (selectedTable === undefined ) return
        const table = tables[selectedTable]
        if (table === undefined) return

        if (selectedColumn !== undefined) {
            const column = table.columns[selectedColumn]
            if (column !== undefined) {
                const newColumns = [...table.columns.slice(0, selectedColumn), column + change,
                    ...table.columns.slice(selectedColumn + 1)]
                const newTable = {...table, columns: newColumns}
                const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
                set({tables: newTables})
            }
        } else if (selectedColumnLine !== undefined) {
            const relevantRow = table.cells[selectedColumnLine.row]
            if (relevantRow === undefined) return
            const leftCell = relevantRow[selectedColumnLine.column]
            const rightCell = relevantRow[selectedColumnLine.column + 1]
            if (leftCell === undefined || rightCell === undefined) return
            const leftCellRectangle = calculateCellRectangle(leftCell, selectedColumnLine, table)
            const rightCellRectangle = calculateCellRectangle(rightCell, selectedColumnLine, table)
            if (width(leftCellRectangle) + change < 10 || width(rightCellRectangle) - change < 10) return
            const newLeftCell = {...leftCell, right: (leftCell.right || 0) + change}
            const newRightCell = {...rightCell, left: (rightCell.left || 0) + change}
            const newCellRow = [...relevantRow.slice(0, selectedColumnLine.column), newLeftCell, newRightCell,
                ...relevantRow.slice(selectedColumnLine.column + 2)]
            const newCells = [...table.cells.slice(0, selectedColumnLine.row), newCellRow,
                ...table.cells.slice(selectedColumnLine.row + 1)]
            const newTable = {...table, cells: newCells}
            const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
            set({tables: newTables})
        }
    },
    setOCRView: async (ocrView: boolean) => {
        await get().predictTableContent()
        const selectedTable = get().selectedTable
        const tables = get().tables
        if(selectedTable === undefined) return
        const table = tables[selectedTable]
        if(table === undefined || table.needsOCR) return
        set({ocrView})
    },
    setHelpView: (helpView: boolean) => {
        set({helpView})
    },
    setHelpGridView: (helpGridView: boolean) => {
        set({helpGridView})
    },
    updateCellText: (i: number, j: number, text: string) => {
        const selectedTable = get().selectedTable
        const tables = get().tables
        if(selectedTable === undefined) return
        const table = tables[selectedTable]
        if(table === undefined) return
        const relevantRow = table.cells[i]
        if(relevantRow === undefined) return
        const relevantCell = relevantRow[j]
        if(relevantCell === undefined) return
        const newCell = {...relevantCell, human_text: text}
        const newCellRow = [...relevantRow.slice(0, j), newCell, ...relevantRow.slice(j + 1)]
        const newCells = [...table.cells.slice(0, i), newCellRow, ...table.cells.slice(i + 1)]
        const newTable = {...table, cells: newCells}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
        set({tables: newTables})
    },
    setColumnTypes: (column: number, types: string[]) => {
        const selectedTable = get().selectedTable
        const tables = get().tables
        if(selectedTable === undefined) return
        const table = tables[selectedTable]
        if(table === undefined || table.columnTypes === undefined) return

        const newColumnTypes = [...table.columnTypes.slice(0, column), types, ...table.columnTypes.slice(column+1)]
        const newTable = {...table, columnTypes: newColumnTypes}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
        set({tables: newTables})
    }
}))