import Button from '@mui/material/Button';
import InvertColorsIcon from '@mui/icons-material/InvertColors';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const InvertDocumentButton = () => {
    const images = useStore(state => state.images)
    const invertImage = useStore(state => state.invertImage)
    const ocrView = useStore(state => state.ocrView)
    const tables = useStore(state => state.tables)
    const disabled = images === undefined || ocrView || tables.length > 0
    const handleClick = () => {
        if (disabled) return
        invertImage()
    }

    return <Tooltip title="Dokument invertieren (i)">
        <span>
            <Button disabled={disabled} variant="contained" onClick={handleClick}><InvertColorsIcon/></Button>
        </span>
    </Tooltip>
}

export default InvertDocumentButton
