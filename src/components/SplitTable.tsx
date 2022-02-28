import {getDataDir} from "../path";
import {useStore} from "../store";
import React from "react";
import MultiSelect from "./MultiSelect";
import {DataTypesOptions} from "../dataModel";
import {height, width} from "../geometry";

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

    const handleInputOnBlur = (i: number, j: number ) => (e: React.FocusEvent<HTMLTextAreaElement>) => {
        updateCellText(i, j, e.target.value)
    }

    const onChangeType = (col: number) => (selectedTypes: string[]) => {
        setColumnTypes(col, selectedTypes)
    }

    return (
        <div className="splitTable">
            {table.cellGrid.map((row, i) => {
                return (
                    <div key={i} className="dataRow">
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
                                        <div key={j} className="dataCell">
                                            <div>
                                                <img src={`/${dataDir}/${imageName}/cell_image/${selectedTable}/${i}/${j}`}
                                                     width={width(cell)}
                                                     height={height(cell)}
                                                     alt={`cell at ${i} ${j}`} />
                                            </div>
                                            <div>
                                                <textarea className="dataInput"
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
                    </div>
                )
            })
            }
        </div>
    )
}

export default SplitTable