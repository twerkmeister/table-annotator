import Button from '@mui/material/Button';
import {Tooltip} from "@mui/material";
import JoinLeftIcon from '@mui/icons-material/JoinLeft';

import {useStore} from "../../store";

const MatchButton = () => {
    const matchData = useStore((state) => state.matchData)
    const ocrView = useStore(state => state.ocrView)
    const tables = useStore(state => state.tables)
    const images = useStore(state => state.images)
    const currentImage = useStore(state => state.currentImageIndex)
    const selectedTable = useStore(state => state.selectedTable)
    let disabled = true
    if (selectedTable !== undefined && images !== undefined) {
        const table = tables[selectedTable]
        const image = images[currentImage]
        if (table !== undefined && image !== undefined) {
            const all_column_types = table.columnTypes.flatMap((x) => x)
            if (all_column_types.includes("HAEFTLINGSNUMMER") &&
                all_column_types.includes("NACHNAME") &&
                all_column_types.includes("VORNAME") &&
                all_column_types.includes("GEBURTSDATUM") &&
                image.hasMatchingData){
                disabled = !ocrView
            }
        }
    }

    return <Tooltip title="Daten matchen. Braucht Matchingdaten (persdata.csv) im Hintergrund
    und Häftlingsnummer, Nachname, Vorname und Geburtsdatum in der Tabelle.">
        <span>
            <Button disabled={disabled} variant="contained" onClick={matchData}><JoinLeftIcon/></Button>
        </span>
    </Tooltip>
}

export default MatchButton
