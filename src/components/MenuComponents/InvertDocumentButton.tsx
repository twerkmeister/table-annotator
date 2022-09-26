import Button from '@mui/material/Button';
import InvertColorsIcon from '@mui/icons-material/InvertColors';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const InvertDocumentButton = () => {
    const images = useStore(state => state.images)
    const invertImage = useStore(state => state.invertImage)
    const ocrView = useStore(state => state.ocrView)
    const disabled = images === undefined || ocrView
    const handleClick = () => {
        if (disabled) return
        invertImage()
    }

    return <Tooltip title="Dokument invertieren (i)">
        <Button disabled={disabled} variant="contained" onClick={handleClick}><InvertColorsIcon/></Button>
    </Tooltip>
}

export default InvertDocumentButton
