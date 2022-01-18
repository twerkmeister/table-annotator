
export type Point = {
    x: number,
    y: number
}

export type Rectangle = {
    topLeft: Point,
    bottomRight: Point
}

export type Image = {
    src: string,
    width: number,
    height: number,
    center: Point,
    name: string
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

export type Table = {
    outline: Rectangle,
    rotationDegrees: number,
    columns: number[],
    rows: number[],
    cellGrid?: Rectangle[][],
    cellContents?: CellContent[][],
}