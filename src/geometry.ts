import {Point, Rectangle} from "./types";

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