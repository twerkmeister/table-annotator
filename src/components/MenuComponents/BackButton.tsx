import Button from '@mui/material/Button';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import {Tooltip} from "@mui/material";
import {goBack} from "../../path";

type BackButtonProps = {
    to_level: number
}

const BackButton = ({to_level}: BackButtonProps) => {
    return <Tooltip title="Eine Ebene Zurück">
        <span>
            <Button variant="contained" href={goBack(to_level)}><AssignmentReturnIcon/></Button>
        </span>
    </Tooltip>
}

export default BackButton
