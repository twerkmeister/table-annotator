import React, {useEffect} from 'react';
import axios from 'axios';
import { GlobalHotKeys } from "react-hotkeys";
import styled from 'styled-components'
import {getDataDir} from './path';
import HelpScreen from "./components/HelpScreen";
import DocumentImage from "./components/DocumentImage";
import {useStore} from "./store";
import {AnnotatorState} from "./store";
import SplitTable from "./components/SplitTable";
import StartedTable from "./components/StartedTable";
import TableElement from './components/TableElement';
import HelperGrid from "./components/HelperGrid";

const AppContainer = styled.div`
  margin: 100px auto 100px auto;
  width: 75%;
`


const keyMap = {
    PREVIOUS_IMAGE: "b",
    NEXT_IMAGE: "n",
    INCREASE_ROTATION: "e",
    DECREASE_ROTATION: "q",
    ESC: "esc",
    ZERO: "0",
    BACKSPACE_OR_DELETE: ["Backspace", "Delete"],
    UP: "w",
    LEFT: "a",
    DOWN: "s",
    RIGHT: "d",
    ANNOTATE_ROWS_AUTOMATICALLY: "z",
    OCR_START_AND_VIEW: "o",
    HELP_VIEW: "h",
    HELPER_GRID: "r",
};


const pushTablesToApi = async(state: AnnotatorState, previousState: AnnotatorState) => {
    if(state.tables === previousState.tables) return
    const dataDir = getDataDir()

    const {currentImageIndex, images, tables} = state
    if(currentImageIndex === undefined || images === undefined) return
    const image = images[currentImageIndex]
    if(image === undefined) return
    await axios.post(`/${dataDir}/tables/${image.name}`, tables)
}

useStore.subscribe(pushTablesToApi)

function App() {
    const fetchImages = useStore(state => state.fetchImages)
    const setImageIndex = useStore(state => state.setImageIndex)
    const increaseRotationDegrees = useStore(state => state.increaseRotationDegrees)
    const setRotationDegrees = useStore(state => state.setRotationDegrees)
    const tables = useStore(state => state.tables)
    const unfinishedTable = useStore(state => state.unfinishedTable)
    const imageIdx = useStore(state => state.currentImageIndex)
    const images = useStore(state => state.images)
    const setMousePosition = useStore(state => state.setMousePosition)
    const deleteTable = useStore(state => state.deleteTable)
    const deleteRow = useStore(state => state.deleteRow)
    const deleteColumn = useStore(state => state.deleteColumn)
    const selectedTable = useStore(state => state.selectedTable)
    const selectedColumn = useStore(state => state.selectedColumn)
    const selectedRow = useStore(state => state.selectedRow)
    const cancelActions = useStore(state => state.cancelActions)
    const adjustRow = useStore(state => state.adjustRow)
    const segmentTable = useStore(state => state.segmentTable)
    const adjustColumn = useStore(state => state.adjustColumn)
    const setOCRView = useStore(state => state.setOCRView)
    const setHelpView = useStore(state => state.setHelpView)
    const setHelpGridView = useStore(state => state.setHelpGridView)
    const ocrView = useStore(state => state.ocrView)
    const helpView = useStore(state => state.helpView)
    const helpGridView = useStore(state => state.helpGridView)

    useEffect(() => {
        if(images === undefined) {
            fetchImages()
        }
    })

    const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>) => {
        setMousePosition({x: e.pageX, y: e.pageY})
    }

    const deleteFunc = () => {
        if(selectedTable !== undefined) {
            if(selectedColumn !== undefined) {
                deleteColumn()
            } else if (selectedRow !== undefined) {
                deleteRow()
            } else {
                deleteTable()
            }
        }
    }

    const hotkeyHandlers = {
        PREVIOUS_IMAGE:  () => setImageIndex(imageIdx - 1),
        NEXT_IMAGE:  () => setImageIndex(imageIdx + 1),
        INCREASE_ROTATION: () => increaseRotationDegrees(0.3),
        DECREASE_ROTATION: () => increaseRotationDegrees(-0.3),
        ZERO: () => setRotationDegrees(0),
        ESC: cancelActions,
        BACKSPACE_OR_DELETE: deleteFunc,
        ANNOTATE_ROWS_AUTOMATICALLY: segmentTable,
        OCR_START_AND_VIEW: () => setOCRView(!ocrView),
        UP: () => adjustRow(-2),
        DOWN: () => adjustRow(2),
        LEFT: () => adjustColumn(-5),
        RIGHT: () => adjustColumn(5),
        HELP_VIEW: () => setHelpView(!helpView),
        HELPER_GRID: () => setHelpGridView(!helpGridView)
    }

    if(images !== undefined && images.length > 0) {
        const image = images[imageIdx]
        return (
            <AppContainer onMouseMove={e => handleMouseMove(e)}>
                <GlobalHotKeys keyMap={keyMap} handlers={hotkeyHandlers} allowChanges={true}>
                    {!ocrView ?
                        <div>
                            {helpGridView && <HelperGrid/>}
                            <DocumentImage image={image} />
                            {
                                tables.map((t, i) => {
                                    return (
                                        <TableElement key={i} table={t}
                                                      imageCenter={image.center}
                                                      tableIdx={i}/>
                                    )
                                })
                            }
                            {unfinishedTable !== undefined ? <StartedTable firstPoint={unfinishedTable.firstPoint}
                                imageCenter={image.center} /> : null}
                        </div> : <SplitTable imageName={image.name}/>
                    }
                    {helpView && <HelpScreen/>}
                </GlobalHotKeys>
            </AppContainer>
        );
    } else if(images !== undefined && images.length === 0) {
        return (
            <div>There are no images to annotate...</div>
        )
    } else {
        return (
            <div>Still loading...</div>
        )
    }
}

export default App;
