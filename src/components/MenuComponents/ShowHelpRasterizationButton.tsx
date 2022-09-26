import Button from '@mui/material/Button';
import TagIcon from '@mui/icons-material/Tag';

import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const ShowHelpRasterizationButton = () => {
    const currentImageIndex = useStore(state => state.currentImageIndex)
    const images = useStore(state => state.images)
    const helpGridView = useStore(state => state.helpGridView)
    const setHelpGridView = useStore(state => state.setHelpGridView)
    const ocrView = useStore(state => state.ocrView)
    const disabled = images === undefined || images.length === 0 || ocrView

    const handleClick = () => {
        if (disabled) return
        setHelpGridView(!helpGridView)
    }

    return <Tooltip title="Hilfsraster anzeigen (r)">
        <Button disabled={disabled} variant="contained" onClick={handleClick}><TagIcon/></Button>
    </Tooltip>
}

export default ShowHelpRasterizationButton
