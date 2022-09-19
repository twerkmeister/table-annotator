
export enum DataTypes {
    LAUFENDE_NUMMER = "Laufende Nummer",
    NACHNAME = "Nachname",
    VORNAME = "Vorname",
    BERUF = "Beruf",
    GEBURTSORT = "Geburtsort",
    GEBURTSDATUM = "Geburtsdatum",
    STERBEDATUM = "Sterbedatum",
    EINWEISUNGSDATUM = "Einweisungsdatum",
    ENTLASSUNGSDATUM = "Entlassungsdatum",
    BEFREIUNGSDATUM = "Befreiungsdatum",
    HAEFTLINGSNUMMER = "Häfltingsnummer",
    HAFTSTAETTE = "Haftstätte",
    NATIONALITÄT = "Nationalität",
    RELIGION = "Religion",
    HAEFTLINGSKATEGORIE = "Häftlingskategorie",
    LETZTER_WOHNORT = "letzter Wohnort",
    STERBEORT = "Sterbeort",
    GESCHLECHT = "Geschlecht",
    GEBURTSNAME = "Geburtsname",
    VOLKSZUGEHOERIGKEIT = "Volkszugehörigkeit",
    FAMILIENSTAND = "Familienstand",
    EINGEWIESEN_DURCH = "eingewiesen durch",
    TRANSPORT_VON = "Transport von",
    TRANSPORT_NACH = "Transport nach",
    MIT_NUMMERNABKUERZUNG = "Mit Nummernabkürzung",
    MIT_ANFUEHRUNGSZEICHEN = "Mit Anführungszeichen",
}

function enumKeys<E>(e: E): (keyof E)[] {
    return Object.keys(e) as (keyof E)[];
}

export const DataTypesOptions = enumKeys(DataTypes).map((key, i) => {
    return {label: DataTypes[key], value: key}})