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
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import {Close} from '@mui/icons-material';
import {Done} from "@mui/icons-material";
import {DataMatch} from "../types";


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
    padding: 1px;
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
`

type SplitTableProps = {
    imageName: string
}

const stringify_match = (match: DataMatch | null): string => {
    if (!match)
        return ""
    return `Gematcht mit #${match.data.lNumber}, ${match.data.strGName} ${match.data.strLName}, ${match.data.strDoBDay}.${match.data.strDoBMonth}.${match.data.strDoBYear}`
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
                        (table.matches? table.matches[i] ?
                            <Tooltip title={stringify_match(table.matches[i])}>
                                <IconButton>
                                    <Done/>
                                </IconButton>
                            </Tooltip> :
                            <Tooltip title="Kein match">
                                <IconButton>
                                    <Close/>
                                </IconButton>
                            </Tooltip>: null)
                            }
                            {
                            row.map((cell, j) => {
                                const cellRectangle = calculateCellRectangle({row: i, column: j}, table)
                                return (
                                    <div key={`${i}_${j}_cell_wrapper`} style={{position: "relative"}}>
                                        {i !== 0 ? null : <div key={`${j}_datatype_selector`}>
                                                <MultiSelect
                                                    title={columnTypes[j].map((t) => DataTypes[t as keyof typeof DataTypes]).join(", ")}
                                                    width={Math.max(width(cellRectangle), 25)}
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
                                                          defaultValue={cell.human_text !== undefined ? cell.human_text : cell.ocr_text}
                                                          style={{width: `${Math.max(width(cellRectangle)-4, 25)}px`,
                                                              height: `${Math.round(Math.max(height(cellRectangle)*1.3-4, 20))}px`,
                                                              background: table.matches && table.matches[i] ? "#8AAD64" : "lightgrey" }}
                                                          onBlur={handleInputOnBlur(i, j)}
                                                          // little hack to update default cell text when ocr text changes
                                                          key={`${i}_${j}_cell_text_${cell.ocr_text}_${cell.human_text}`}
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
