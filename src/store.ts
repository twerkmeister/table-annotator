import create from "zustand";
import {getDataDir, getDocId, getProject} from "./path";
import {CellIndex, Image, Point, Table, UnfinishedTable} from "./types";
import {
    addPoints,
    makeRectangle,
    rotatePoint,
    calculateCellRectangle,
    width,
    height,
    transposeCells
} from "./geometry";
import {doesTableNeedOcr} from "./util";
import {APIAddress} from "./api";


const makeTable = (p1: Point, p2: Point, rotationDegrees: number): Table => {
    const outline = makeRectangle(p1, p2)
    return {
        outline, rotationDegrees, columns: [], rows: [], cells: [[Object()]], columnTypes: [[]], structureLocked: false
    }
}

const validateCellHeight = (table: Table, rowNum: number, change: number): boolean => {
    const rowToCheck = table.cells[rowNum]
    const cellsThatWouldBecomeTooSmall = rowToCheck
        .map((cell, column_i) => calculateCellRectangle(
            {row: rowNum, column: column_i}, table))
        .map(height)
        .filter((h) => h - Math.abs(change) < 10)
    return cellsThatWouldBecomeTooSmall.length === 0
}

const validateCellWidth = (table: Table, columnNum: number, change: number): boolean => {
    const columnToCheck = transposeCells(table.cells)[columnNum]
    const cellsThatWouldBecomeTooSmall = columnToCheck
        .map((cell, row_i) => calculateCellRectangle(
            {row: row_i, column: columnNum}, table))
        .map(width)
        .filter((w) => w - Math.abs(change) < 10)
    return cellsThatWouldBecomeTooSmall.length === 0
}

export type AnnotatorState = {
    images?: Image[],
    currentImageIndex: number,
    selectedTable?: number,
    selectedColumn?: number,
    selectedRow?: number,
    selectedBorder?: number,
    selectedCellColumnLine?: CellIndex,
    selectedCellRowLine?: CellIndex,
    unfinishedTable?: UnfinishedTable,
    newColumnPosition?: number,
    newRowPosition?: number,
    mousePosition: Point,
    documentPosition?: Point,
    isDragging: boolean,
    dragStartTime: number,
    rotationDegrees: number,
    tableDeletionMarkCount: number,
    tables: Table[],
    ocrView: boolean,
    helpView: boolean,
    helpGridView: boolean,
    showHasSaved: boolean,
    isRunningOCR: boolean,
    isRunningSegmentation: boolean,
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
    addRow: (givenRowPosition?: number) => void,
    selectColumn: (idx?: number) => void,
    selectRow: (idx?: number) => void,
    selectBorder: (idx? :number) => void,
    deleteTable: () => void
    deleteColumn: () => void
    deleteRow: () => void
    segmentTable: () => void
    predictTableContent: () => void
    adjustRow: (change: number) => void
    selectCellColumnLine: (row: number, column: number) => void
    selectCellRowLine: (row: number, column: number) => void
    adjustColumn: (change: number) => void
    adjustBorder: (change: number) => void
    setOCRView: (ocrView: boolean) => void
    setHelpView: (helpView: boolean) => void
    setHelpGridView: (helpGridView: boolean) => void
    updateCellText: (i: number, j: number, text: string) => void
    setColumnTypes: (column: number, types: string[]) => void
    setDragging: (isDragging: boolean) => void
    handleDrag: () => void
    lockTable: (lock: boolean) => void
    resetSelection: () => void
    transitionHasSavedIndicator: () => void
}

export const useStore = create<AnnotatorState>((set, get) => ({
    images: undefined,
    currentImageIndex: 0,
    unfinishedTable: undefined,
    selectedTable: undefined,
    selectedColumn: undefined,
    selectedRow: undefined,
    selectedBorder: undefined,
    newColumnPosition: undefined,
    newRowPosition: undefined,
    selectedCellColumnLine: undefined,
    selectedCellRowLine: undefined,
    mousePosition: {x: 0, y: 0},
    documentPosition: undefined,
    isDragging: false,
    dragStartTime: -1,
    rotationDegrees: 0,
    tableDeletionMarkCount: 0,
    tables: [],
    ocrView: false,
    helpView: false,
    helpGridView: false,
    showHasSaved: false,
    isRunningOCR: false,
    isRunningSegmentation: false,
    fetchImages: async() => {
        const project = getProject()
        const dataDir = getDataDir()
        const docId = getDocId()
        const response = await fetch(`${APIAddress}/${project}/${dataDir}/images`)
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
        if (get().ocrView) return
        if (get().isRunningOCR) return
        if (get().isRunningSegmentation) return
        const images = get().images
        if(images === undefined) return
        const image = images[idx]
        if(image === undefined) return

        const project = getProject()
        const dataDir = getDataDir()
        if (project === undefined || dataDir === undefined) return
        const table_response = await fetch(`${APIAddress}/${project}/${dataDir}/tables/${image.name}`)
        const tables = (await table_response.json())["tables"]
        get().resetSelection()
        set({ currentImageIndex: idx, rotationDegrees: 0, documentPosition: undefined,
            tables, unfinishedTable: undefined, selectedTable: undefined})

        const new_location = getDocId() ?
            window.location.href.replace(/\/[^/]*$/, `/${image.docId}`)
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
        get().resetSelection()
        set({selectedTable: idx, newColumnPosition: undefined,
            newRowPosition: undefined})
    },
    selectColumn: (idx?: number) => {
        get().resetSelection()
        set({selectedColumn: idx})
    },
    selectRow: (idx?: number) => {
        get().resetSelection()
        set({selectedRow: idx})
    },
    selectBorder: (idx?: number) => {
        get().resetSelection()
        set({selectedBorder: idx})
    },
    setNewColumnPosition: (pagePoint?: Point) => {
        if(pagePoint === undefined){
            set({newColumnPosition: undefined})
            return
        }

        if(get().isDragging) return

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

        if(get().isDragging) return

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

        const newColumnTypes = [...table.columnTypes.slice(0, separatedColumn), [],
            ...table.columnTypes.slice(separatedColumn)]

        const newCells =
            table.cells.map((row, i) => {
                return row.flatMap((cell, j) => {
                    if (j === separatedColumn){
                        // split into left and right cell
                        const leftCell = {...cell, right: undefined, ocr_text: undefined, human_text: undefined}
                        const rightCell = {...cell, left: undefined, ocr_text: undefined, human_text: undefined}
                        return [leftCell, rightCell]
                    } else {
                        return [cell]
                    }
                })
            })
        const newTable = {...table, columns: newColumns, cells: newCells, columnTypes: newColumnTypes}
        const newTables = [...tables.slice(0, selectedTableIdx), newTable, ...tables.slice(selectedTableIdx+1)]
        set({tables: newTables, tableDeletionMarkCount: 0})
    },
    addRow: (givenRowPosition?: number) => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const newRowPosition = givenRowPosition || get().newRowPosition
        if (selectedTable === undefined || newRowPosition === undefined) return

        const table = tables[selectedTable]
        if (table === undefined) return
        const newRows = [...table.rows, newRowPosition].sort((a, b) => a - b)
        const separatedRow = newRows.indexOf(newRowPosition)

        const newCells =
            table.cells.flatMap((row, i) => {
                if (i === separatedRow) {
                    // split into upper and lower row
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
                } else {
                    return [row]
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
        if (selectedTable === undefined) return
        const table = tables[selectedTable]
        if (table === undefined) return
        if (table.structureLocked) return
        if (tableDeletionMarkCount >= 2) {
            const newTables = [...tables.slice(0, selectedTable), ...tables.slice(selectedTable + 1)]
            set({selectedTable: undefined, tableDeletionMarkCount: 0, tables: newTables})
        } else {
            set({tableDeletionMarkCount: tableDeletionMarkCount + 1})
        }
    },
    deleteColumn: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const selectedColumn = get().selectedColumn
        if (selectedTable === undefined || selectedColumn === undefined) return

        const table = tables[selectedTable]
        if (table === undefined) return

        const newCells =
            table.cells.map((row, i) => {
                return row.flatMap((cell, j) => {
                    if (j === selectedColumn) {
                        //join left and right cell
                        const leftCell = row[j]
                        const rightCell = row[j+1]
                        const fusedCell = {
                            left: leftCell.left,
                            right: rightCell.right,
                            human_text: undefined,
                            ocr_text: undefined,
                        }
                        return[fusedCell]
                    } else if (j === selectedColumn + 1){
                        // remove right cell
                        return []
                    } else {
                        return [cell]
                    }
                })
            })

        const newColumnTypes = [...table.columnTypes.slice(0, selectedColumn),
            ...table.columnTypes.slice(selectedColumn+1)]
        const newColumns = [...table.columns.slice(0, selectedColumn), ...table.columns.slice(selectedColumn+1)]
        const newTable = {...table, columns: newColumns, cells: newCells, columnTypes: newColumnTypes}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable+1)]
        set({tables: newTables, tableDeletionMarkCount: 0, selectedColumn: undefined})
    },
    deleteRow: () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const selectedRow = get().selectedRow
        if (selectedTable === undefined || selectedRow === undefined) return
        const table = tables[selectedTable]
        if (table === undefined) return

        const newCells =
            table.cells.flatMap((row, i) => {
                if (i === selectedRow) {
                    //join top and bottom row
                    const topRow = table.cells[i]
                    const bottomRow = table.cells[i+1]
                    const fusedRow = row.map((cell, j) => {
                        return {
                            top: topRow[j].top,
                            bottom: bottomRow[j].bottom
                        }
                    })
                    return [fusedRow]
                } else if (i === selectedRow + 1){
                    // remove lower row
                    return []
                } else {
                    return [row]
                }
            })

        const newRows = [...table.rows.slice(0, selectedRow), ...table.rows.slice(selectedRow+1)]
        const newTable = {...table, rows: newRows, cells: newCells}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable+1)]
        set({tables: newTables, tableDeletionMarkCount: 0, selectedRow: undefined})
    },
    segmentTable: async () => {
        const tables = get().tables
        const selectedTable = get().selectedTable
        const images = get().images
        const currentImageIndex = get().currentImageIndex
        const addRow = get().addRow
        if (selectedTable === undefined ||
            images === undefined) return
        const image = images[currentImageIndex]
        const table = tables[selectedTable]
        if (image === undefined ||
            table === undefined) return

        if (table.rows.length > 0) return
        const project = getProject()
        const dataDir = getDataDir()
        if (project === undefined || dataDir === undefined) return
        get().resetSelection()
        set({isRunningSegmentation: true})
        const response =
            await fetch(`${APIAddress}/${project}/${dataDir}/${image.name}/predict_table_structure/${selectedTable}`)
        if (response.status === 200) {
            const rows: number[] = (await response.json())["rows"]

            rows.forEach((row) => {
                addRow(row)
            })
        }
        set({isRunningSegmentation: false})
    },
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

        if (!doesTableNeedOcr(table)) return
        const project = getProject()
        const dataDir = getDataDir()
        if (project === undefined || dataDir === undefined) return
        get().resetSelection()
        set({isRunningOCR: true})
        const response =
            await fetch(`${APIAddress}/${project}/${dataDir}/${image.name}/predict_table_contents/${selectedTable}`)
        if (response.status === 200) {
            const updatedCells = (await response.json())["cells"]
            const newTables = [...tables.slice(0, selectedTable), {
                ...table,
                cells: updatedCells,
                structureLocked: true
            },
                ...tables.slice(selectedTable + 1)]
            set({tables: newTables})
        }
        set({isRunningOCR: false})
    },
    adjustRow: (change: number) => {
        const selectedTable = get().selectedTable
        const selectedRow = get().selectedRow
        const tables = get().tables
        const selectedCellRowLine = get().selectedCellRowLine


        if (selectedTable === undefined) return
        const table = tables[selectedTable]
        if (table === undefined) return

        if (selectedRow !== undefined) {
            const rowPos = table.rows[selectedRow]
            if (rowPos === undefined) return

            const rowNumToCheck = change >= 0 ? selectedRow+1 : selectedRow
            if (! validateCellHeight(table, rowNumToCheck, change)) return

            // make sure you cannot cross row positions
            const previousRowPosition = table.rows[selectedRow - 1] || 0
            const nextRowPosition = table.rows[selectedRow + 1] || height(table.outline)
            if ((((rowPos + change) - previousRowPosition) < 10) || ((nextRowPosition - (rowPos + change)) < 10)) return

            // invalidate existing ocr results for the given cells...
            const newCells = table.cells.map((row, i) => {
                if (i === selectedRow || i === selectedRow + 1) {
                    return row.map((cell, j) => {
                        return {...cell, ocr_text: undefined, human_text: undefined}
                    })
                } else return row
            })
            const newRows = [...table.rows.slice(0, selectedRow), rowPos + change, ...table.rows.slice(selectedRow + 1)]
            const newTable = {...table, rows: newRows, cells: newCells}
            const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
            set({tables: newTables})
        } else if (selectedCellRowLine !== undefined) {
            const upperRow = table.cells[selectedCellRowLine.row]
            const lowerRow = table.cells[selectedCellRowLine.row + 1]
            if (upperRow === undefined || lowerRow ===undefined) return
            const upperCell = upperRow[selectedCellRowLine.column]
            const lowerCell = lowerRow[selectedCellRowLine.column]
            if (upperCell === undefined || lowerCell === undefined) return
            //also stop if cell has already been changed in the other direction
            if (upperCell.right || upperCell.left || lowerCell.right || lowerCell.left) return
            const upperCellRectangle = calculateCellRectangle(selectedCellRowLine, table)
            const lowerCellRectangle = calculateCellRectangle(
                {...selectedCellRowLine, row: selectedCellRowLine.row + 1}, table)
            if (height(upperCellRectangle) + change < 10 || height(lowerCellRectangle) - change < 10) return
            const newUpperCell = {...upperCell, bottom: (upperCell.bottom || 0) + change, ocr_text: undefined, human_text: undefined}
            const newLowerCell = {...lowerCell, top: (lowerCell.top || 0) + change, ocr_text: undefined, human_text: undefined}
            const newUpperRow = [...upperRow.slice(0, selectedCellRowLine.column), newUpperCell,
                ...upperRow.slice(selectedCellRowLine.column + 1)]
            const newLowerRow = [...lowerRow.slice(0, selectedCellRowLine.column), newLowerCell,
                ...lowerRow.slice(selectedCellRowLine.column + 1)]
            const newCells = [...table.cells.slice(0, selectedCellRowLine.row), newUpperRow, newLowerRow,
                ...table.cells.slice(selectedCellRowLine.row + 2)]
            const newTable = {...table, cells: newCells}
            const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
            set({tables: newTables})
        }
    },
    selectCellColumnLine: (row: number, column: number) => {
        get().resetSelection()
        set({selectedCellColumnLine: {row, column}})
    },
    selectCellRowLine: (row: number, column: number) => {
        get().resetSelection()
        set({selectedCellRowLine: {row, column}})
    },
    adjustColumn: (change: number) => {
        const selectedTable = get().selectedTable
        const selectedColumn = get().selectedColumn
        const tables = get().tables
        const selectedCellColumnLine = get().selectedCellColumnLine

        if (selectedTable === undefined ) return
        const table = tables[selectedTable]
        if (table === undefined) return

        if (selectedColumn !== undefined) {
            const columnPos = table.columns[selectedColumn]
            if (columnPos === undefined) return

            const columnNumToCheck = change >= 0 ? selectedColumn+1 : selectedColumn
            if (!validateCellWidth(table, columnNumToCheck, change)) return

            // make sure you cannot cross row positions
            const previousColumnPosition = table.columns[selectedColumn - 1] || 0
            const nextColumnPosition = table.columns[selectedColumn + 1] || width(table.outline)
            if ((((columnPos + change) - previousColumnPosition) < 10) ||
                ((nextColumnPosition - (columnPos + change)) < 10)) return

            // invalidate existing ocr results for the given cells...
            const newCells = table.cells.map((row, i) => {
                return row.map((cell, j) => {
                    if (j === selectedColumn || j === selectedColumn + 1) {
                        return {...cell, ocr_text: undefined, human_text: undefined}
                    } else return cell
                })
            })

            const newColumns = [...table.columns.slice(0, selectedColumn), columnPos + change,
                ...table.columns.slice(selectedColumn + 1)]
            const newTable = {...table, columns: newColumns, cells: newCells}
            const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
            set({tables: newTables})
        } else if (selectedCellColumnLine !== undefined) {
            const relevantRow = table.cells[selectedCellColumnLine.row]
            if (relevantRow === undefined) return
            const leftCell = relevantRow[selectedCellColumnLine.column]
            const rightCell = relevantRow[selectedCellColumnLine.column + 1]
            if (leftCell === undefined || rightCell === undefined) return
            //also stop if cell has already been changed in the other direction
            if (leftCell.top || leftCell.bottom || rightCell.top || rightCell.bottom) return
            const leftCellRectangle = calculateCellRectangle(selectedCellColumnLine, table)
            const rightCellRectangle = calculateCellRectangle(
                {...selectedCellColumnLine, column: selectedCellColumnLine.column + 1}, table)

            if ((width(leftCellRectangle) + change < 10) || (width(rightCellRectangle) - change < 10)) return
            const newLeftCell = {...leftCell, right: (leftCell.right || 0) + change, ocr_text: undefined, human_text: undefined}
            const newRightCell = {...rightCell, left: (rightCell.left || 0) + change, ocr_text: undefined, human_text: undefined}
            const newCellRow = [...relevantRow.slice(0, selectedCellColumnLine.column), newLeftCell, newRightCell,
                ...relevantRow.slice(selectedCellColumnLine.column + 2)]
            const newCells = [...table.cells.slice(0, selectedCellColumnLine.row), newCellRow,
                ...table.cells.slice(selectedCellColumnLine.row + 1)]
            const newTable = {...table, cells: newCells}
            const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
            set({tables: newTables})
        }
    },
    adjustBorder: (change: number) => {
        const selectedTable = get().selectedTable
        const selectedBorder = get().selectedBorder
        const tables = get().tables
        const images = get().images
        if (images === undefined) return
        const currentImageIndex = get().currentImageIndex

        if (selectedTable === undefined || selectedBorder === undefined) return
        const image = images[currentImageIndex]
        const table = tables[selectedTable]
        if (table === undefined || image === undefined) return

        const adjustTable = (table: Table) => {
            if (selectedBorder === 0) {
                const newOutline = {...table.outline, topLeft: addPoints(table.outline.topLeft, {x:0, y: change})}
                const newRows = table.rows.map((r) => r - change)
                // invalidate existing ocr results for the affected cells...
                const newCells = table.cells.map((row, i) => {
                    return row.map((cell, j) => {
                        if (i === 0) {
                            return {...cell, ocr_text: undefined, human_text: undefined}
                        } else return cell
                    })
                })
                return {...table, outline: newOutline, rows: newRows, cells: newCells}
            } else if (selectedBorder === 1) {
                const newOutline = {...table.outline, bottomRight:
                        addPoints(table.outline.bottomRight, {y:0, x: change})}
                const newCells = table.cells.map((row, i) => {
                    return row.map((cell, j) => {
                        if (j === table.columns.length) {
                            return {...cell, ocr_text: undefined, human_text: undefined}
                        } else return cell
                    })
                })
                return {...table, outline: newOutline, cells: newCells}
            } else if (selectedBorder === 2) {
                const newOutline = {...table.outline, bottomRight:
                        addPoints(table.outline.bottomRight, {x:0, y: change})}
                const newCells = table.cells.map((row, i) => {
                    return row.map((cell, j) => {
                        if (i === table.rows.length) {
                            return {...cell, ocr_text: undefined, human_text: undefined}
                        } else return cell
                    })
                })
                return {...table, outline: newOutline, cells: newCells}
            } else if (selectedBorder === 3) {
                const newOutline = {...table.outline, topLeft: addPoints(table.outline.topLeft, {y:0, x: change})}
                const newColumns = table.columns.map((c) => c - change)
                const newCells = table.cells.map((row, i) => {
                    return row.map((cell, j) => {
                        if (j === 0) {
                            return {...cell, ocr_text: undefined, human_text: undefined}
                        } else return cell
                    })
                })
                return {...table, outline: newOutline, columns: newColumns, cells: newCells}
            } else return table
        }
        const newTable = adjustTable(table)

        if (newTable.rows.length > 0 && !validateCellHeight(newTable, 0, 0)) return
        if (newTable.columns.length > 0 && !validateCellWidth(newTable, newTable.columns.length, 0)) return
        if (newTable.rows.length > 0 && !validateCellHeight(newTable, newTable.rows.length, 0)) return
        if (newTable.columns.length > 0 && !validateCellWidth(newTable, 0, 0)) return
        if (newTable.rows.length > 0 && newTable.rows[0] < 10) return
        if (newTable.rows.length > 0 && height(newTable.outline) - newTable.rows[newTable.rows.length - 1] < 10) return
        if (newTable.columns.length > 0 && newTable.columns[0] < 10) return
        if (newTable.columns.length > 0 && width(newTable.outline) - newTable.columns[newTable.columns.length - 1] < 10)
            return
        if (newTable.outline.topLeft.x < 0 || newTable.outline.topLeft.y < 0
            || newTable.outline.topLeft.x >= image.width || newTable.outline.topLeft.y > image.height) return
        if (newTable.outline.bottomRight.x < 0 || newTable.outline.bottomRight.y < 0
            || newTable.outline.bottomRight.x >= image.width || newTable.outline.bottomRight.y > image.height) return
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
        set({tables: newTables})
    },
    setOCRView: async (ocrView: boolean) => {
        if (ocrView) {
            await get().predictTableContent()
        }
        const selectedTable = get().selectedTable
        const tables = get().tables
        if(selectedTable === undefined) return
        const table = tables[selectedTable]
        if(table === undefined) return
        // predict table content failed
        if(ocrView && doesTableNeedOcr(table)) return
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
    },
    setDragging: (isDragging: boolean) => {
        set({isDragging, dragStartTime: isDragging ? new Date().getTime() : -1})
    },
    handleDrag: () => {
        const selectedTable = get().selectedTable
        const tables = get().tables
        const adjustColumn = get().adjustColumn
        const adjustRow = get().adjustRow
        const adjustBorder = get().adjustBorder
        if(selectedTable === undefined) return

        const table = tables[selectedTable]
        if (table === undefined) return

        const selectedColumn = get().selectedColumn
        const selectedRow = get().selectedRow
        const selectedCellColumnLine = get().selectedCellColumnLine
        const selectedCellRowLine = get().selectedCellRowLine
        const selectedBorder = get().selectedBorder

        const mousePosition = get().mousePosition
        const documentPosition = get().documentPosition
        if(documentPosition === undefined) return

        if (selectedColumn !== undefined) {
            const columnPosition = table.columns[selectedColumn]
            if (columnPosition === undefined) return

            const currentXPositionDiff = mousePosition.x - documentPosition.x - table.outline.topLeft.x - columnPosition - 7
            adjustColumn(currentXPositionDiff)
        } else if (selectedRow !== undefined) {
            const rowPosition = table.rows[selectedRow]
            if (rowPosition === undefined) return
            const currentYPositionDiff = mousePosition.y - documentPosition.y - table.outline.topLeft.y - rowPosition - 7
            adjustRow(currentYPositionDiff)
        } else if (selectedCellColumnLine !== undefined) {
            const cellColumnLinePosition = calculateCellRectangle(selectedCellColumnLine, table).bottomRight.x
            const currentXPositionDiff = mousePosition.x - documentPosition.x - table.outline.topLeft.x - cellColumnLinePosition - 7
            adjustColumn(currentXPositionDiff)
        } else if (selectedCellRowLine !== undefined) {
            const cellRowLinePosition = calculateCellRectangle(selectedCellRowLine, table).bottomRight.y
            const currentYPositionDiff = mousePosition.y - documentPosition.y - table.outline.topLeft.y - cellRowLinePosition - 7
            adjustRow(currentYPositionDiff)
        } else if (selectedBorder !== undefined && selectedBorder === 0) {
            const currentYPositionDiff = mousePosition.y - documentPosition.y - table.outline.topLeft.y - 7
            adjustBorder(currentYPositionDiff)
        } else if (selectedBorder !== undefined && selectedBorder === 1) {
            const currentXPositionDiff = mousePosition.x - documentPosition.x - table.outline.bottomRight.x - 7
            adjustBorder(currentXPositionDiff)
        } else if (selectedBorder !== undefined && selectedBorder === 2) {
            const currentYPositionDiff = mousePosition.y - documentPosition.y - table.outline.bottomRight.y - 7
            adjustBorder(currentYPositionDiff)
        } else if (selectedBorder !== undefined && selectedBorder === 3) {
            const currentXPositionDiff = mousePosition.x - documentPosition.x - table.outline.topLeft.x - 7
            adjustBorder(currentXPositionDiff)
        }
    },
    lockTable: (lock: boolean) => {
        const selectedTable = get().selectedTable
        const tables = get().tables
        if(selectedTable === undefined) return

        const table = tables[selectedTable]
        if (table === undefined) return

        const newTable = {...table, structureLocked: lock}
        const newTables = [...tables.slice(0, selectedTable), newTable, ...tables.slice(selectedTable + 1)]
        get().resetSelection()
        set({tables: newTables, tableDeletionMarkCount: 0})
    },
    resetSelection: () => {
        set({tableDeletionMarkCount: 0, selectedRow: undefined,
            selectedColumn: undefined, selectedBorder: undefined,
            selectedCellColumnLine: undefined, selectedCellRowLine: undefined})
    },
    transitionHasSavedIndicator: async () => {
        if (get().showHasSaved) return
        set({showHasSaved: true})
        await new Promise(resolve => setTimeout(resolve, 2000));
        set({showHasSaved: false})
    }
}))