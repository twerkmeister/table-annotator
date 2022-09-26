import Button from '@mui/material/Button';
import RotateRightIcon from '@mui/icons-material/RotateRight';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const TurnSlightRightButton = () => {
    const images = useStore(state => state.images)
    const increaseRotationDegrees = useStore(state => state.increaseRotationDegrees)
    const ocrView = useStore(state => state.ocrView)
    const disabled = images === undefined || ocrView
    const handleClick = () => {
        if (disabled) return
        increaseRotationDegrees(0.3)
    }

    return <Tooltip title="Dokument leicht im Uhrzeigersinn drehen (e)">
        <Button disabled={disabled} variant="contained" onClick={handleClick}><RotateRightIcon/></Button>
    </Tooltip>
}

export default TurnSlightRightButton
