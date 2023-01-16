import Button from '@mui/material/Button';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import {getProject} from "../../path";
import {Tooltip} from "@mui/material";

const BackToProjectButton = () => {
    const handleClick = () => {
        const project = getProject()
        window.history.pushState({}, "", `/${project}`)
        window.location.reload()
    }

    return <Tooltip title="Zurück zum Projektordner">
        <span>
            <Button variant="contained" onClick={handleClick}><AssignmentReturnIcon/></Button>
        </span>
    </Tooltip>
}

export default BackToProjectButton
