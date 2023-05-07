import create from "zustand";
import React, {useEffect} from "react";
import {APIAddress} from "./api";
import {getProject} from "./path";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import BackToOverviewButton from "./components/MenuComponents/BackToOverviewButton";


export type WorkPackage = {
    name: string,
    numDocuments: number,
    numDocumentsDone: number
    numDocumentsTodo: number
    firstTodoDoc?: string
}

export type Project = {
    name: string
    workPackages: WorkPackage[],
}

export type ProjectPageState = {
    currentProject?: Project
    fetchProject: () => void
}

export const useStore = create<ProjectPageState>((set, get) => ({
    currentProject: undefined,
    fetchProject: async() => {
        const projectName = getProject()
        const response = await fetch(`${APIAddress}/${projectName}`)
        if (response.status === 200) {
            const currentProject: Project = (await response.json())["project"]
            set({currentProject})
        } else if (response.status === 404) {
            window.history.replaceState({}, "", "/")
            window.location.reload()
        }
    }
}))

function ProjectPage() {
    const currentProject = useStore(state => state.currentProject)
    const fetchProject = useStore(state => state.fetchProject)

    useEffect(() => {
        if(currentProject === undefined) {
            fetchProject()
        }
    })
    if (currentProject !== undefined) {
        const totalNumDocuments = currentProject.workPackages.map(
            (wp, i) => wp.numDocuments).reduce((a, b) => a + b, 0)
        const totalNumDocumentsWithTables = currentProject.workPackages.map(
            (wp, i) => wp.numDocuments-wp.numDocumentsTodo).reduce((a, b) => a + b, 0)
        return (
            <div style={{paddingTop: "50px"}}>
                <ProjectMenu/>
            <Container maxWidth="sm" style={{"textAlign": "center"}}>
                <Paper>
                    <Typography variant="h5" gutterBottom>
                        {currentProject.name}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        {totalNumDocumentsWithTables} / {totalNumDocuments}
                    </Typography>
                </Paper>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 350, maxWidth: 650}} aria-label="packages">
                        <TableHead>
                            <TableRow>
                                <TableCell>Container</TableCell>
                                <TableCell align="right">Fortschritt</TableCell>
                                <TableCell align="right">Schnellzugriff</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentProject.workPackages.map((wp, i) => (
                                <TableRow
                                    key={i}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Link href={currentProject.name + "/" + wp.name}
                                              underline="hover">
                                        {wp.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell align="right">
                                        {wp.numDocuments-wp.numDocumentsTodo} / {wp.numDocuments}
                                    </TableCell>
                                    <TableCell align="right">
                                        {wp.firstTodoDoc?
                                            <Link href={currentProject.name + "/" + wp.name + "/" + wp.firstTodoDoc}
                                                  underline="hover">
                                                {wp.firstTodoDoc}
                                            </Link> : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
            </div>
        );
    } else {
        return <Box sx={{ display: 'flex' }}>
            <CircularProgress />
        </Box>
    }

}

const ProjectMenu = () => {
    return (
        <Box sx={{
            display: "flex", width: "100%", position: "fixed", "top": 0, "left": 0,
            zIndex: 99, background: "lightgrey"
        }}>
            <BackToOverviewButton/>
        </Box>
    )
}

export default ProjectPage
