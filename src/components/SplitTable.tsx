import {getDataDir, getProject} from "../path";
import {useStore} from "../store";
import React from "react";
import MultiSelect from "./MultiSelect";
import {DataTypes, DataTypesOptions} from "../dataModel";
import {height, width} from "../geometry";
import styled from "styled-components";
import {doesTableNeedOcr, hashTable} from "../util";
import {calculateCellRectangle} from "../geometry";
import {APIAddress} from "../api";
import DataTypesDeleteButton from "./DataTypesDeleteButton";
import SplitTableHeader from "./SplitTableHeader";

const DataRow = styled.div`
    display: flex;
`

const SplitTableContainer = styled.div`
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
    const project = getProject()
    const dataDir = getDataDir()
    const tables = useStore(state => state.tables)
    const selectedTable = useStore(state => state.selectedTable)
    const updateCellText = useStore(state => state.updateCellText)
    const setColumnTypes = useStore(state => state.setColumnTypes)
    if (project === undefined || dataDir === undefined) return null
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
        <SplitTableContainer>
            <SplitTableHeader/>
            {table.cells.map((row, i) => {
                return (
                    <DataRow key={`${i}_row`}>
                        {
                            row.map((cell, j) => {
                                const cellRectangle = calculateCellRectangle({row: i, column: j}, table)
                                return (
                                    <div key={`${i}_${j}_cell_wrapper`} style={{position: "relative"}}>
                                        {i !== 0 ? null : <div key={`${j}_datatype_selector`}>
                                                <MultiSelect
                                                    title={columnTypes[j].map((t) => DataTypes[t as keyof typeof DataTypes]).join(", ")}
                                                    width={width(cellRectangle)}
                                                    items={DataTypesOptions}
                                                    selectedItems={columnTypes[j]}
                                                    onChange={onChangeType(j)}
                                                    key={`${j}_datatype_selector`}
                                                />
                                            {i === 0 && j === row.length - 1 ?
                                                <DataTypesDeleteButton leftOffset={width(cellRectangle)}/> : null}
                                        </div>}
                                        <div key={`${i}_${j}_cell`}>
                                            <div key={`${i}_${j}_cell_image_box`}>
                                                <img src={`${APIAddress}/${project}/${dataDir}/${imageName}/cell_image/${selectedTable}/${i}/${j}/${tableHash}`}
                                                     width={width(cellRectangle)}
                                                     height={height(cellRectangle)}
                                                     alt={`cell at ${i} ${j}`}
                                                     key={`${i}_${j}_cell_image`}/>
                                            </div>
                                            <div key={`${i}_${j}_cell_text_box`}>
                                                <DataInput
                                                          defaultValue={cell.human_text || cell.ocr_text}
                                                          style={{width: `${width(cellRectangle)-6}px`,
                                                              height: `${Math.round(Math.max(height(cellRectangle)*1.3-6, 20))}px`}}
                                                          onBlur={handleInputOnBlur(i, j)}
                                                          // little hack to update default cell text when ocr text changes
                                                          key={`${i}_${j}_cell_text_${cell.ocr_text}`}
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
        </SplitTableContainer>
    )
}

export default SplitTable
