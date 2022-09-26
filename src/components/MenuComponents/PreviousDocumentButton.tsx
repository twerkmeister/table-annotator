import Button from '@mui/material/Button';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const PreviousDocumentButton = () => {
    const currentImageIndex = useStore(state => state.currentImageIndex)
    const images = useStore(state => state.images)
    const setImageIndex = useStore(state => state.setImageIndex)
    const ocrView = useStore(state => state.ocrView)
    const disabled = images === undefined || images.length === 0 || currentImageIndex === 0 || ocrView
    const handleClick = () => {
        if (disabled) return
        setImageIndex(currentImageIndex - 1)
    }

    return <Tooltip title="Vorheriges Dokument (b)">
        <Button disabled={disabled} variant="contained" onClick={handleClick}><SkipPreviousIcon/></Button>
    </Tooltip>
}

export default PreviousDocumentButton
