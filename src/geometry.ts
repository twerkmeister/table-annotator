import {Cell, CellIndex, Point, Rectangle, Table} from "./types";

export function subtractPoints(p: Point, p2: Point): Point {
    return {x: p.x - p2.x, y: p.y - p2.y}
}

export function addPoints(p: Point, p2: Point): Point {
    return {x: p.x + p2.x, y: p.y + p2.y}
}

export function rotatePoint(p: Point, degrees: number, rotationCenter: Point = {x: 0, y: 0}): Point {
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


export function getPageOffset(el: Element): Point {
    const rect = el.getBoundingClientRect()
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    return { y: rect.top + scrollTop, x: rect.left + scrollLeft }
}

export function makeRectangle(p1: Point, p2: Point): Rectangle {
    const [topLeftX, bottomRightX] = p1.x <= p2.x ? [p1.x, p2.x] : [p2.x, p1.x]
    const [topLeftY, bottomRightY] = p1.y <= p2.y ? [p1.y, p2.y] : [p2.y, p1.y]
    const topLeft = {x: topLeftX, y: topLeftY}
    const bottomRight = {x: bottomRightX, y: bottomRightY}
    return {topLeft, bottomRight}
}

export function width(rect: Rectangle): number {
    return rect.bottomRight.x - rect.topLeft.x
}

export function height(rect: Rectangle): number {
    return rect.bottomRight.y - rect.topLeft.y
}

export const calculateCellRectangle = (cellIndex: CellIndex, table: Table): Rectangle => {
    const cell = table.cells[cellIndex.row]?.[cellIndex.column]
    if (cell === undefined) throw new Error(`Invalid cell index ${JSON.stringify(cellIndex)}`)
    const top_base = table.rows[cellIndex.row - 1] || 0
    const bottom_base = table.rows[cellIndex.row] || height(table.outline)
    const left_base = table.columns[cellIndex.column - 1] || 0
    const right_base = table.columns[cellIndex.column] || width(table.outline)

    const top = top_base + (cell.top || 0)
    const bottom = bottom_base + (cell.bottom || 0)
    const left = left_base + (cell.left || 0)
    const right = right_base + (cell.right || 0)

    return {topLeft:{y: top, x: left}, bottomRight: {y: bottom, x: right}}
}

export const transposeCells = (cells: Cell[][]) => cells[0].map((x,i) => cells.map(x => x[i]))

export const getMaximalRevisions = (cells: Cell[][]): [number[][], number[][]] => {
    const maxRowRevisions = cells.slice(0, -1).map((row, i) => {
        return row.reduce((previousValue, currentValue) => {
            return [Math.max(previousValue[0] || 0, -(currentValue.bottom || 0)),
                Math.max(previousValue[1] || 0, currentValue.bottom || 0)]
        }, [0, 0])
    })
    const maxColumnRevisions = transposeCells(cells).slice(0, -1).map((column, i) => {
        return column.reduce((previousValue, currentValue) => {
            return [Math.max(previousValue[0] || 0, -(currentValue.right || 0)),
                Math.max(previousValue[1] || 0, currentValue.right || 0)]
        }, [0, 0])
    })

    return [maxRowRevisions, maxColumnRevisions]
}