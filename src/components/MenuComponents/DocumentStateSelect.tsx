import Select, {SingleValue} from 'react-select'
import {DocumentStateSelectType, DocumentStatesOptions, DocumentStatesValues} from "../documentStates";
import React from "react";
import {useStore} from "../../store";


export default function DocumentStateSelect()  {
    const documentState = useStore(state => state.documentState)
    const setDocumentState = useStore(state => state.setDocumentState)

    const handleChange = async (newValue: SingleValue<DocumentStateSelectType>) => {
        if (newValue === null) return
        setDocumentState(newValue.value)
    }

    return (<div>{documentState &&
        <div style={{minWidth: "200px"}}>
            <Select isSearchable={false} blurInputOnSelect={true}
                    options={DocumentStatesOptions}
                    value={DocumentStatesValues[documentState]}
                    onChange={handleChange}/>
        </div>}
    </div>)
}