
type PathParts = {
    subdir?: string
    app?: string
}


function getPathParts(): PathParts {
    const splitPath = window.location.pathname.split("/").filter(p => p.length > 0)
    if(splitPath.length === 2) {
        return {subdir: splitPath[0], app: splitPath[1]}
    } else if (splitPath.length === 1) {
        return {subdir: splitPath[0], app: undefined}
    } else {
        return {subdir: undefined, app: undefined}
    }
}

export {getPathParts}