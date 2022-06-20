import {getDataDir} from "../path";
import {useStore} from "../store";
import React from "react";
import MultiSelect from "./MultiSelect";
import {DataTypesOptions} from "../dataModel";
import {height, width} from "../geometry";
import styled from "styled-components";
import {doesTableNeedOcr, hashTable} from "../util";
import {calculateCellRectangle} from "../geometry";
import {APIAddress} from "../api";

const DataRow = styled.div`
    display: flex;
`

const SplitTableDiv = styled.div`
    margin: 0 auto;
    width: min-content;
`

const DataInput = styled.textarea`
    resize: none;
    background: lightgray;
    font-size: 18px;
`

type SplitTableProps = {
    imageName: string
}

const SplitTable = ({imageName}: SplitTableProps) => {
    const dataDir = getDataDir()
    const tables = useStore(state => state.tables)
    const selectedTable = useStore(state => state.selectedTable)
    const updateCellText = useStore(state => state.updateCellText)
    const setColumnTypes = useStore(state => state.setColumnTypes)
    if(selectedTable === undefined) return null
    const table = tables[selectedTable]
    if(table === undefined ) return null
    if(doesTableNeedOcr(table)) return null
    const columnTypes = table.columnTypes
    if(columnTypes === undefined) return null
    const tableHash = hashTable(table)

    const handleInputOnBlur = (i: number, j: number ) => (e: React.FocusEvent<HTMLTextAreaElement>) => {
        updateCellText(i, j, e.target.value)
    }

    const onChangeType = (col: number) => (selectedTypes: string[]) => {
        setColumnTypes(col, selectedTypes)
    }

    return (
        <SplitTableDiv>
            {table.cells.map((row, i) => {
                return (
                    <DataRow key={i}>
                        {
                            row.map((cell, j) => {
                                const cellRectangle = calculateCellRectangle({row: i, column: j}, table)
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
                                        <div key={j}>
                                            <div>
                                                <img src={`${APIAddress}/${dataDir}/${imageName}/cell_image/${selectedTable}/${i}/${j}/${tableHash}`}
                                                     width={width(cellRectangle)}
                                                     height={height(cellRectangle)}
                                                     alt={`cell at ${i} ${j}`} />
                                            </div>
                                            <div>
                                                <DataInput
                                                          defaultValue={cell.human_text || cell.ocr_text}
                                                          style={{width: `${width(cellRectangle)-6}px`,
                                                              height: `${Math.round(Math.max(height(cellRectangle)*1.3-6, 20))}px`}}
                                                          onBlur={handleInputOnBlur(i, j)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </DataRow>
                )
            })
            }
        </SplitTableDiv>
    )
}

export default SplitTable