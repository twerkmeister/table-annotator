import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const DeleteObjectButton = () => {
    const tables = useStore(state => state.tables)
    const ocrView = useStore(state => state.ocrView)
    const deleteTable = useStore(state => state.deleteTable)
    const deleteRow = useStore(state => state.deleteRow)
    const deleteColumn = useStore(state => state.deleteColumn)
    const selectedTable = useStore(state => state.selectedTable)
    const selectedColumn = useStore(state => state.selectedColumn)
    const selectedCellColumnLine = useStore(state => state.selectedCellColumnLine)
    const selectedRow = useStore(state => state.selectedRow)
    const selectedCellRowLine = useStore(state => state.selectedCellRowLine)
    const selectedBorder = useStore(state => state.selectedBorder)

    const disabled = selectedTable === undefined || tables[selectedTable] === undefined ||
        tables[selectedTable].structureLocked || ocrView
    const handleClick = () => {
        if (disabled) return
        if(selectedTable !== undefined) {
            if(selectedColumn !== undefined) {
                deleteColumn()
            } else if (selectedRow !== undefined) {
                deleteRow()
            } else if (selectedCellColumnLine !== undefined) {
                // do nothing
            } else if (selectedCellRowLine !== undefined) {
                // do nothing
            } else if (selectedBorder !== undefined) {
                // do nothing
            } else {
                deleteTable()
            }
        }
    }

    return <Tooltip title="Ausgewähltes Objekt löschen (Rücktaste)">
        <Button disabled={disabled} variant="contained" onClick={handleClick}><DeleteIcon/></Button>
    </Tooltip>
}

export default DeleteObjectButton
