import Box from "@mui/material/Box";
import BackButton from "./components/MenuComponents/BackButton";
import React from "react";

type BrowsingMenuProps = {
    back_to_level: number
}
const BrowsingMenu = ({back_to_level}: BrowsingMenuProps) => {
    return (
        <Box sx={{
            display: "flex", width: "100%", position: "fixed", "top": 0, "left": 0,
            zIndex: 99, background: "lightgrey"
        }}>
            <BackButton to_level={back_to_level}/>
        </Box>
    )
}

export default  BrowsingMenu
