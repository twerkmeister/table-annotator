
export enum DocumentStates {
    TODO="Noch zu bearbeiten",
    SINGLE_PERSON_DOC="Einzeldokument",
    HANDWRITTEN_LIST="Liste Handschrift",
    NO_DATA="Keine Daten",
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
