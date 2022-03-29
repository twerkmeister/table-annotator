import {getDataDir} from "../path";
import {useStore} from "../store";
import React from "react";
import MultiSelect from "./MultiSelect";
import {DataTypesOptions} from "../dataModel";
import {height, width} from "../geometry";
import styled from "styled-components";
import {cyrb53} from "../util";

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
    if(table.cellGrid === undefined) return null
    if(table.cellContents === undefined) return null
    const columnTypes = table.columnTypes
    if(columnTypes === undefined) return null
    const tableHash = cyrb53(JSON.stringify(table))

    const handleInputOnBlur = (i: number, j: number ) => (e: React.FocusEvent<HTMLTextAreaElement>) => {
        updateCellText(i, j, e.target.value)
    }

    const onChangeType = (col: number) => (selectedTypes: string[]) => {
        setColumnTypes(col, selectedTypes)
    }

    return (
        <SplitTableDiv>
            {table.cellGrid.map((row, i) => {
                return (
                    <DataRow key={i}>
                        {
                            row.map((cell, j) => {
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
                                                <img src={`/${dataDir}/${imageName}/cell_image/${selectedTable}/${i}/${j}/${tableHash}`}
                                                     width={width(cell)}
                                                     height={height(cell)}
                                                     alt={`cell at ${i} ${j}`} />
                                            </div>
                                            <div>
                                                <DataInput
                                                          defaultValue={table.cellContents ?
                                                              table.cellContents[i][j].human_text ?
                                                                  table.cellContents[i][j].human_text :
                                                                  table.cellContents[i][j].ocr_text
                                                              : ""}
                                                          style={{width: `${width(cell)-6}px`,
                                                              height: `${Math.round(height(cell)*1.3-6)}px`}}
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