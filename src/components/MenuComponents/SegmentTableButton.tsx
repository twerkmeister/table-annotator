import Button from '@mui/material/Button';
import SubjectIcon from '@mui/icons-material/Subject';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const SegmentTableButton = () => {
    const tables = useStore(state => state.tables)
    const selectedTable = useStore(state => state.selectedTable)
    const segmentTable = useStore(state => state.segmentTable)
    const ocrView = useStore(state => state.ocrView)
    const disabled = selectedTable === undefined || tables[selectedTable] === undefined
        || tables[selectedTable].rows.length > 0 || ocrView
    const handleClick = () => {
        if (disabled) return
        segmentTable()
    }

    return <Tooltip title="Tabellenzeilen automatisch finden (z)">
        <span>
            <Button disabled={disabled} variant="contained" onClick={handleClick}><SubjectIcon/></Button>
        </span>
    </Tooltip>
}

export default SegmentTableButton
