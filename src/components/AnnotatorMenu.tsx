import React from "react";
import Select, {SingleValue} from 'react-select'
import {

    DocumentStatesOptions,
    DocumentStateSelectType, DocumentStatesValues,
} from "./documentStates";
import {useStore} from "../store";

const AnnotatorMenu = () => {
    const documentState = useStore(state => state.documentState)
    const setDocumentState = useStore(state => state.setDocumentState)

    const handleChange = async (newValue: SingleValue<DocumentStateSelectType>) => {
        if (newValue === null) return
        setDocumentState(newValue.value)
    }

    return (<div>
        {documentState &&
        <div style={{position: "fixed", top: 0, left: 0, zIndex: 99, minWidth: "200px"}}>
            <Select isSearchable={false} blurInputOnSelect={true} options={DocumentStatesOptions} value={DocumentStatesValues[documentState]} onChange={handleChange}/>
        </div>}
    </div>)
}

export default AnnotatorMenu