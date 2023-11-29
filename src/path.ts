
function getPathChunk(part_idx: number): string | undefined {
    const splitPath = window.location.pathname.split("/").filter(p => p.length > 0)
    if(splitPath.length > part_idx) {
        return splitPath[part_idx]
    } else {
        return undefined
    }
}

function getProjectBucket(): string | undefined {
    return getPathChunk(0)
}

function getProject(): string | undefined {
    return getPathChunk(1)
}

function getDataDir(): string | undefined {
    return getPathChunk(2)
}

function getDocId(): string | undefined {
    return getPathChunk(3)
}

function goBack(to_level: number): string {
    const currentPath = window.location.pathname
    if (currentPath === "/") return "/"
    const parts = currentPath.split("/").filter(p => p.length > 0)
    return "/" + parts.slice(0, to_level).join("/")
}

export {getProjectBucket, getProject, getDataDir, getDocId, goBack}
