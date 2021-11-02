
type PathParts = {
    subdir?: string
    app?: string
}


function getPathParts(): PathParts {
    const splitPath = window.location.pathname.split("/")
    if(splitPath.length === 3) {
        return {subdir: splitPath[1], app: splitPath[2]}
    } else {
        return {subdir: undefined, app: undefined}
    }
}

export {getPathParts}