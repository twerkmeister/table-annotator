import Button from '@mui/material/Button';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import {Tooltip} from "@mui/material";

const BackToOverviewButton = () => {
    return <Tooltip title="Zurück zur Übersicht">
        <span>
            <Button variant="contained" href={"/"}><AssignmentReturnIcon/></Button>
        </span>
    </Tooltip>
}

export default BackToOverviewButton
