import create from "zustand";
import {useEffect} from "react";
import {APIAddress} from "./api";
import {getProject} from "./path";

export type WorkPackage = {
    name: string,
    numDocuments: number,
    numDocumentsWithTables: number
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
            (wp, i) => wp.numDocumentsWithTables).reduce((a, b) => a + b, 0)
        return (
            <div style={{textAlign: "center", color: "lightgrey"}}>
                <h2>{currentProject.name}</h2>
                <p>{totalNumDocumentsWithTables} / {totalNumDocuments}</p>
                <table style={{margin: "0 auto"}}>
                    <tbody>
                    {currentProject.workPackages.map((wp, i) => {
                        return (<tr key={i}>
                            <td style={{textAlign: "right"}}><a className="workPackageLink"
                                   href={currentProject.name + "/" + wp.name}>→{wp.name}←</a></td>
                            <td>{wp.numDocumentsWithTables} / {wp.numDocuments}</td>
                        </tr>)
                    })}
                    </tbody>
                </table>
            </div>
        )
    } else {
        return <div>"Loading..."</div>
    }

}

export default ProjectPage