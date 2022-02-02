
export enum DataTypes {
    LAST_NAME = "last name",
    FIRST_NAME = "first name",
    OCCUPATION = "occupation",
    PLACE_OF_BIRTH = "place of birth",
    DATE_OF_BIRTH = "date of birth",
    DATE_OF_DEATH = "date of death",
    DATE_OF_ENTERING_CAMP = "date of entering camp",
    DATE_OF_LEAVING_CAMP = "date of leaving camp",
    DATE_OF_RESCUE = "date of rescue",
    PRISONER_NUMBER = "prisoner number",
    OLD_PRISONER_NUMBER = "old prisoner number",
    RUNNING_NUMBER = "running number",
    CONCENTRATION_CAMP = "concentration camp",
    NATIONALITY = "nationality",
    RELIGION = "religion",
    IMPRISONMENT_REASON = "imprisonment reason",
    PLACE_OF_RESIDENCE = "place of residence",
    DATE_OF_ESCAPE = "date of escape",
    DATE_OF_RECAPTURE = "date of recapture"
}

function enumKeys<E>(e: E): (keyof E)[] {
    return Object.keys(e) as (keyof E)[];
}

export const DataTypesOptions = enumKeys(DataTypes).map((key, i) => {
    return {label: DataTypes[key], value: key}})