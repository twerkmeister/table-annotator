import React from "react";
import {useStore} from "../store";

import SyncIndicator from "./SyncIndicator";
import DocumentStateSelect from "./MenuComponents/DocumentStateSelect";
import BackToProjectButton from "./MenuComponents/BackToProjectButton";
import {Box} from "@mui/material";
import PreviousDocumentButton from "./MenuComponents/PreviousDocumentButton";
import NextDocumentButton from "./MenuComponents/NextDocumentButton";
import TurnSlightLeftButton from "./MenuComponents/TurnSlightLeftButton";
import TurnSlightRightButton from "./MenuComponents/TurnSlightRightButton";
import InvertDocumentButton from "./MenuComponents/InvertDocumentButton";
import TurnRightButton from "./MenuComponents/TurnRightButton";
import SegmentTableButton from "./MenuComponents/SegmentTableButton";
import SetOCRViewButton from "./MenuComponents/SetOCRViewButton";
import DeleteObjectButton from "./MenuComponents/DeleteObjectButton";
import ShowHelpRasterizationButton from "./MenuComponents/ShowHelpRasterizationButton";
import PositionDisplay from "./MenuComponents/PositionDisplay";
import ApplyPreAnnotatedDataButton from "./MenuComponents/ApplyPreAnnotatedDataButton";


const AnnotatorMenu = () => {
    const isInSync = useStore(state => state.isInSync)

    return (<Box sx={{display: "flex", width: "100%", position: "fixed", "top": 0, "left": 0,
    zIndex: 99, background: "lightgrey"}}>
        <BackToProjectButton/>
        <PreviousDocumentButton/>
        <PositionDisplay/>
        <NextDocumentButton/>
        <DocumentStateSelect/>
        <TurnSlightLeftButton/>
        <ShowHelpRasterizationButton/>
        <TurnSlightRightButton/>
        <InvertDocumentButton/>
        <TurnRightButton/>
        <SegmentTableButton/>
        <SetOCRViewButton/>
        <ApplyPreAnnotatedDataButton/>
        <DeleteObjectButton/>
        {<SyncIndicator style={{background: isInSync ? "forestgreen" : "yellow"}}>💾</SyncIndicator>}
    </Box>)
}

export default AnnotatorMenu
