import Button from '@mui/material/Button';
import {Tooltip} from "@mui/material";
import JoinLeftIcon from '@mui/icons-material/JoinLeft';

import {useStore} from "../../store";
import {DataTypes} from "../../dataModel";

const MatchButton = () => {
    const matchData = useStore((state) => state.matchData)
    const ocrView = useStore(state => state.ocrView)
    const tables = useStore(state => state.tables)
    const selectedTable = useStore(state => state.selectedTable)
    let disabled = true
    if (selectedTable !== undefined) {
        const table = tables[selectedTable]
        if (table !== undefined) {
            const all_column_types = table.columnTypes.flatMap((x) => x)
            if (all_column_types.includes("HAEFTLINGSNUMMER") &&
                all_column_types.includes("NACHNAME") &&
                all_column_types.includes("VORNAME") &&
                all_column_types.includes("GEBURTSDATUM")){
                disabled = !ocrView
            }
        }
    }

    return <Tooltip title="Daten matchen. Braucht Häftlingsnummer, Nachname, Vorname und Geburtsdatum.">
        <span>
            <Button disabled={disabled} variant="contained" onClick={matchData}><JoinLeftIcon/></Button>
        </span>
    </Tooltip>
}

export default MatchButton
