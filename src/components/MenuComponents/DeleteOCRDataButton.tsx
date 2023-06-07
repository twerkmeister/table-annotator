import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import {Tooltip} from "@mui/material";
import {useStore} from "../../store";

const DeleteOCRDataButton = () => {
    const tables = useStore(state => state.tables)
    const ocrView = useStore(state => state.ocrView)
    const updateCellText = useStore(state => state.updateCellText)
    const selectedTable = useStore(state => state.selectedTable)
    const [open, setOpen] = React.useState(false);

    const handleDeleteStart = () => {
        setOpen(true);
    };

    const handleDeleteStop = () => {
        setOpen(false);
    };

    const disabled = selectedTable === undefined || tables[selectedTable] === undefined || !ocrView
    const handleDelete = () => {
        if (disabled || selectedTable === undefined) return
        const table = tables[selectedTable]
        if (table === undefined) return
        table.cells.forEach((row, i) => {
            row.forEach((cell, j) => {
                updateCellText(i, j, "")
            })
        })
        setOpen(false);
    }

    return <div>
        <Tooltip title="alle Texte löschen">
        <span>
            <Button disabled={disabled} variant="contained" onClick={handleDeleteStart}><DeleteSweepIcon/></Button>
        </span>
        </Tooltip>
        <Dialog
            open={open}
            onClose={handleDeleteStop}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {"Alle Textdaten löschen?"}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    Möchtest Du alle Textdaten in dieser Tabelle löschen?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDeleteStop}>Nein</Button>
                <Button onClick={handleDelete}>
                    Ja 🗑️
                </Button>
            </DialogActions>
        </Dialog>
    </div>
}

export default DeleteOCRDataButton


