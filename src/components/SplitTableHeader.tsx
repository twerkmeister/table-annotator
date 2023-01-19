import {getDataDir, getProject} from "../path";
import {useStore} from "../store";
import React from "react";
import MultiSelect from "./MultiSelect";
import {DataTypes, DataTypesOptions} from "../dataModel";
import {height, width} from "../geometry";
import styled from "styled-components";
import VirtualValueAddButton from "./VirtualValueAddButton";
import VirtualValueDeleteButton from "./VirtualValueDeleteButton";

const SplitTableHeaderContainer = styled.div`
    margin: 20px auto;
    width: min-content;
`

const VirtualValueInput = styled.input`
    background-color: lightgray;
    min-width: 192px;
    font-size: 18px;
`

const VirtualValueContainer = styled.div`
    display: flex;
`

const SplitTableHeader = () => {
    const project = getProject()
    const dataDir = getDataDir()
    const tables = useStore(state => state.tables)
    const selectedTable = useStore(state => state.selectedTable)
    const setVirtualValueType = useStore(state => state.setVirtualValueType)
    const setVirtualValue = useStore(state => state.setVirtualValue)
    if (selectedTable === undefined) return null
    const table = tables[selectedTable]
    if (table === undefined) return null

    const onChangeType = (valueIndex: number) => (selectedTypes: string[]) => {
        setVirtualValueType(valueIndex, selectedTypes.length > 0 ? selectedTypes[0] : undefined)
    }

    const onChangeValue = (valueIndex: number) => (e: React.FocusEvent<HTMLInputElement>) => {
        setVirtualValue(valueIndex, e.target.value)
    }

    return (
       <SplitTableHeaderContainer>
           {table.virtualValues?.map((v, i) => {
               return <VirtualValueContainer>
                   <MultiSelect
                       title={v.label ? DataTypes[v.label as keyof typeof DataTypes] : ""}
                       width={250}
                       items={DataTypesOptions}
                       selectedItems={v.label ? [v.label] : []}
                       onChange={onChangeType(i)}
                       max_num_selection={1}
                       key={`${i}_virtual_value_selector`}
                   />
                   <VirtualValueInput
                       defaultValue={v.value}
                       onBlur={onChangeValue(i)}
                   />
                   <VirtualValueDeleteButton valueIndex={i}/>
               </VirtualValueContainer>
           })}
           <VirtualValueAddButton/>
       </SplitTableHeaderContainer>
    )
}

export default SplitTableHeader
