import Button from '@mui/material/Button';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import {Tooltip} from "@mui/material";
import {getProject} from "../../path";

const BackToProjectButton = () => {
    const project = getProject()
    return <Tooltip title="Zurück zum Projektordner">
        <span>
            <Button variant="contained" href={`/${project}`}><AssignmentReturnIcon/></Button>
        </span>
    </Tooltip>
}

export default BackToProjectButton
