import Button from '@mui/material/Button';
import TurnRightIcon from '@mui/icons-material/TurnRight';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const TurnRightButton = () => {
    const images = useStore(state => state.images)
    const tables = useStore(state => state.tables)
    const rotateImage90 = useStore(state => state.rotateImage90)
    const ocrView = useStore(state => state.ocrView)
    const disabled = images === undefined || tables.length > 0 || ocrView
    const handleClick = () => {
        if (disabled) return
        rotateImage90()
    }

    return <Tooltip title="Dokument 90° im Uhrzeigersinn drehen (u)">
        <span>
            <Button disabled={disabled} variant="contained" onClick={handleClick}><TurnRightIcon/></Button>
        </span>
    </Tooltip>
}

export default TurnRightButton
