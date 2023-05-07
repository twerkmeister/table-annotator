import Button from '@mui/material/Button';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import {Tooltip} from "@mui/material";

const BackToOverviewButton = () => {
    const handleClick = () => {
        window.history.pushState({}, "", `/`)
        window.location.reload()
    }

    return <Tooltip title="Zurück zur Übersicht">
        <span>
            <Button variant="contained" onClick={handleClick}><AssignmentReturnIcon/></Button>
        </span>
    </Tooltip>
}

export default BackToOverviewButton
