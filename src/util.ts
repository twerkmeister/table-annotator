import {Table} from "./types";

export function flatten<T>(arr: T[][]): T[] {
    return ([] as T[]).concat(...arr);
}

export function cyrb53(str: string, seed: number = 0): number {
    /*Hashing function taken from
    * https://stackoverflow.com/a/52171480
    * */
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
}

export function doesTableNeedOcr(table: Table): boolean {
    for(let i = 0; i < table.cells.length; i++) {
        for (let j =0; j < table.cells[i].length; j++) {
            if (table.cells[i][j].ocr_text === undefined || table.cells[i][j].ocr_text === null) return true
        }
    }
    return false
}

export function hashTable(table: Table): number {
    const cleanedCells = table.cells.map((row, i) => {
        return row.map((cell, j) => {
            return {...cell, ocr_text: undefined, human_text: undefined}
        })
    })
    const cleanedTable = {...table, cells: cleanedCells, structureLocked: false, columnTypes: []}
    return cyrb53(JSON.stringify(cleanedTable))
}