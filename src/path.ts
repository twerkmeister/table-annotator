
function getProject(): string | undefined {
    const splitPath = window.location.pathname.split("/").filter(p => p.length > 0)
    if(splitPath.length >= 1) {
        return splitPath[0]
    } else {
        return undefined
    }
}

function getDataDir(): string | undefined {
    const splitPath = window.location.pathname.split("/").filter(p => p.length > 0)
    if(splitPath.length >= 2) {
        return splitPath[1]
    } else {
        return undefined
    }
}

function getDocId(): string | undefined {
    const splitPath = window.location.pathname.split("/").filter(p => p.length > 0)
    if(splitPath.length >= 3) {
        return splitPath[2]
    } else {
        return undefined
    }
}

export {getProject, getDataDir, getDocId}