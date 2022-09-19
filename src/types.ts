
export type Point = {
    x: number,
    y: number
}

export type Rectangle = {
    topLeft: Point,
    bottomRight: Point
}

export type TempImageParameters = {
    inverted: boolean
    rotationSteps: number
}

export type Image = {
    src: string,
    width: number,
    height: number,
    center: Point,
    name: string
    docId: string
    temporaryParameters?: TempImageParameters
}

export type CellContent = {
    ocr_text: string,
    human_text?: string
}

export type UnfinishedTable = {
    firstPoint: Point
}

export type CellIndex = {
    row: number,
    column: number
}

export type Cell = {
    top?: number,
    right?: number,
    bottom?: number,
    left?: number
    ocr_text?: string
    human_text?: string
}

export type Table = {
    outline: Rectangle,
    rotationDegrees: number,
    columns: number[],
    rows: number[],
    cells: Cell[][],
    structureLocked: boolean,
    columnTypes: string[][],
}