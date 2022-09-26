import Button from '@mui/material/Button';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const TurnSlightLeftButton = () => {
    const images = useStore(state => state.images)
    const increaseRotationDegrees = useStore(state => state.increaseRotationDegrees)
    const ocrView = useStore(state => state.ocrView)
    const disabled = images === undefined || images.length === 0 || ocrView
    const handleClick = () => {
        if (disabled) return
        increaseRotationDegrees(- 0.3)
    }

    return <Tooltip title="Dokument leicht gegen den Uhrzeigersinn drehen (q)">
        <Button disabled={disabled} variant="contained" onClick={handleClick}><RotateLeftIcon/></Button>
    </Tooltip>
}

export default TurnSlightLeftButton
