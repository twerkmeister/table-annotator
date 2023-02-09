
export enum DataTypes {
    LAUFENDE_NUMMER = "Laufende Nummer",
    UNBESTIMMT = "Unbestimmt",
    NACHNAME = "Nachname",
    VORNAME = "Vorname",
    BERUF = "Beruf",
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
    GEBURTSORT = "Geburtsort",
    LETZTER_WOHNORT = "letzter Wohnort",
    STERBEORT = "Sterbeort",
    GESCHLECHT = "Geschlecht",
    GEBURTSNAME = "Geburtsname",
    VOLKSZUGEHOERIGKEIT = "Volkszugehörigkeit",
    FAMILIENSTAND = "Familienstand",
    EINGEWIESEN_DURCH = "eingewiesen durch",
    TRANSPORT_VON = "Transport von",
    TRANSPORT_NACH = "Transport nach",
    BESTATTUNGSDATUM = "Bestattungsdatum",
    BESTATTUNGSORT = "Bestattungsort",
    MIT_NUMMERNABKUERZUNG = "Mit Nummernabkürzung",
    MIT_ANFUEHRUNGSZEICHEN = "Mit Anführungszeichen",
}

function enumKeys<E>(e: E): (keyof E)[] {
    return Object.keys(e) as (keyof E)[];
}

export const DataTypesOptions = enumKeys(DataTypes).map((key, i) => {
    return {label: DataTypes[key], value: key}})
