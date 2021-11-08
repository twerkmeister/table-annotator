

export type OCRDataPoint = {
    image_name: string
    table_idx: string
    cell_id: string
    ocr_text: string
    human_text: string | null
    image_path: string
    image_width: number
    image_height: number
}

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
    name: string,
    finished: boolean
}