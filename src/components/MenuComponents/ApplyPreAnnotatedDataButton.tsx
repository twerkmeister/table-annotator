import Button from '@mui/material/Button';
import SimCardDownloadIcon from '@mui/icons-material/SimCardDownload';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";
import {doesTableHaveTypes} from "../../util";

const ApplyPreAnnotatedDataButton = () => {
    const tables = useStore(state => state.tables)
    const selectedTable = useStore(state => state.selectedTable)
    const ocrView = useStore(state => state.ocrView)
    const applyPreAnnotatedData = useStore(state => state.applyPreAnnotatedData)

    const disabled = selectedTable === undefined || tables[selectedTable] === undefined
        || !ocrView || !doesTableHaveTypes(tables[selectedTable])
    const handleClick = () => {
        if (disabled) return
        applyPreAnnotatedData()
    }

    const title = "Vorannotatierte Daten importieren"

    return <Tooltip title={title}>
        <span>
            <Button disabled={disabled} variant="contained" onClick={handleClick}><SimCardDownloadIcon/></Button>
        </span>
    </Tooltip>
}

export default ApplyPreAnnotatedDataButton
