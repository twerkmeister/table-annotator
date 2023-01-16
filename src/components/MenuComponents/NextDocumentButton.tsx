import Button from '@mui/material/Button';
import SkipNext from '@mui/icons-material/SkipNext';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const NextDocumentButton = () => {
    const currentImageIndex = useStore(state => state.currentImageIndex)
    const images = useStore(state => state.images)
    const setImageIndex = useStore(state => state.setImageIndex)
    const ocrView = useStore(state => state.ocrView)
    const disabled = images === undefined || images.length === 0 ||
        currentImageIndex === images.length - 1 || ocrView
    const handleClick = () => {
        if (disabled) return
        setImageIndex(currentImageIndex + 1)
    }

    return <Tooltip title="Nächstes Dokument (n)">
        <span>
            <Button disabled={disabled} variant="contained" onClick={handleClick}><SkipNext/></Button>
        </span>
    </Tooltip>
}

export default NextDocumentButton
