import create from "zustand";
import {useEffect} from "react";
import {APIAddress} from "./api";

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
            <div style={{textAlign: "center", color: "lightgrey"}}>
                <h2>Table Annotator</h2>
                <div>
                    {projectNames.map((name, i) => {
                        return (<div key={i}>
                            <a className="projectLink" href={name}>→{name}←</a>
                        </div>)
                    })}
                </div>
            </div>
        )
    } else {
        return <div>"Loading..."</div>
    }

}

export default OverviewPage