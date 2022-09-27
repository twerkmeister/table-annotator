import Button from '@mui/material/Button';
import {Box} from "@mui/material";
import {useStore} from "../../store";

const PositionDisplay = () => {
    const currentImageIndex = useStore(state => state.currentImageIndex)
    const images = useStore(state => state.images)
    const displayText = images !== undefined ? `${currentImageIndex+1} / ${images.length}` : "*/*"
    return <Button disabled={true} variant={"outlined"}>{displayText}</Button>
}

export default PositionDisplay
