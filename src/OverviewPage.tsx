import create from "zustand";
import React, {useEffect} from "react";
import {APIAddress} from "./api";
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

export type OverviewPageState = {
    projectNames?: string[]
    fetchAllProjectNames: () => void
}

export const useStore = create<OverviewPageState>((set, get) => ({
    projectNames: undefined,
    fetchAllProjectNames: async() => {
        const response = await fetch(`${APIAddress}/`)
        const projectNames: string[] = (await response.json())["projectNames"]
        set({projectNames})
    }
}))

function OverviewPage() {
    const projectNames= useStore(state => state.projectNames)
    const fetchAllProjectNames = useStore(state => state.fetchAllProjectNames)

    useEffect(() => {
        if(projectNames === undefined) {
            fetchAllProjectNames()
        }
    })
    if (projectNames !== undefined) {
        return (
            <Container maxWidth="sm" style={{"textAlign": "center"}}>
                <Paper>
                    <Typography variant="h5" gutterBottom>
                        Table Annotator
                    </Typography>
                </Paper>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 350, maxWidth: 650}} aria-label="packages">
                        <TableHead>
                            <TableRow>
                                <TableCell>Projekt</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projectNames.map((name, i) => (
                                <TableRow
                                    key={i}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Link href={name}
                                              underline="hover">
                                            {name}
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        )
    } else {
        return <Box sx={{ display: 'flex' }}>
            <CircularProgress />
        </Box>
    }

}

export default OverviewPage
