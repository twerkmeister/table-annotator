
export enum DocumentStates {
    TODO="unbearbeitet",
    NO_LIST="keine Liste",
    FOR_RESUBMISSION="zur Wiedervorlage",
    DONE="fertig",
}

export type DocumentStateKeyStrings = keyof typeof DocumentStates;

export type DocumentStateSelectType = {
    label: DocumentStates,
    value: DocumentStateKeyStrings
}

function enumKeys<E>(e: E): (keyof E)[] {
    return Object.keys(e) as (keyof E)[];
}

export const DocumentStatesOptions = enumKeys(DocumentStates).map((key, i): DocumentStateSelectType => {
    return {label: DocumentStates[key], value: key}})

export const DocumentStatesValues = Object.fromEntries(enumKeys(DocumentStates).map((key) => {
   return [key, {label: DocumentStates[key], value: key}]
}))