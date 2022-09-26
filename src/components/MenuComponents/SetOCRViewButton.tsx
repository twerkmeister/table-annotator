import Button from '@mui/material/Button';
import AbcIcon from '@mui/icons-material/Abc';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const SetOCRViewButton = () => {
    const tables = useStore(state => state.tables)
    const selectedTable = useStore(state => state.selectedTable)
    const ocrView = useStore(state => state.ocrView)
    const setOCRView = useStore(state => state.setOCRView)

    const disabled = selectedTable === undefined || tables[selectedTable] === undefined
    const handleClick = () => {
        if (disabled) return
        setOCRView(!ocrView)
    }

    const title = ocrView ? "OCR-Modus verlassen (o)" : "In den OCR-Modus wechseln (o)"

    return <Tooltip title={title}>
        <Button disabled={disabled} variant="contained" onClick={handleClick}><AbcIcon/></Button>
    </Tooltip>
}

export default SetOCRViewButton
