import React from "react";

const HelpScreen = () => {
    return (
        <div className="helpScreen">
            <h2>Hilfe</h2>
            <div>
                <h3>Dokument auswählen</h3>
                <ol>
                    <li>Über die Tasten "n" und "b" kann zwischen den Dokumenten eines Pakets gewechselt werden.</li>
                </ol>
            </div>
            <div>
                <h3>Tabellen Zeichnen</h3>
                <ol>
                    <li>Dokumente mittels Tasten "q" und "e" drehen, sodass der Tabellenkörper gerade steht</li>
                    <li>Oberen, linken Eckpunkt des Tabellenkörpers mit der linken Maustaste setzen</li>
                    <li>Unteren, rechten Eckpunkt des Tabellenkörpers mit der linken Maustaste setzen</li>
                </ol>
                Mit der Escapetaste kann das Zeichnen abgebrochen werden, mit der Rücktaste (3x) die fertige Tabelle
                gelöscht werden.
            </div>
            <div>
                <h3>Zeilen und Spalten einfügen</h3>
                Die Tabelle muss ausgewählt sein (sichtbar am grünen Rand)
                <ol>
                    <li>Zeilen automatisch einfügen lassen mittels Taste <b>z</b></li>
                    <li>Zeilen können zur Korrektur ausgewählt und über die Tasten "w" und "s"
                        nach oben oder unten verschoben oder mittels der Rücktaste gelöschen werden</li>
                    <li>fehlende Zeilen über den orangenen, linken Rand der Tabelle hinzugefügen</li>
                    <li>Spalten über den lilanen, oberen Rand der Tabelle hinzufügen</li>
                    <li>Spalten bei Bedarf auswählen und über die Tasten "a" und "d" nach links bzw. rechts verschieben,
                        oder über die Rücktaste löschen und neu setzen</li>
                </ol>
                Sollte sich beim Setzen der Zeilen und Spalten herausstellen, dass die Tabelle doch nicht richtig
                ausgerichtet wurde, kann sie mit der Rücktaste (3x) wieder gelöscht werden. Falls das Ergebnis der
                automatischen Zeilensetzung zu schlecht ist, kann es Sinn machen, die Tabelle zu löschen und die Zeilen
                komplett händisch zu setzen.
            </div>
            <div>
                <h3>Spalten verfeinern</h3>
                Sobald dieser Schritt begonnen wird können keine neuen Spalten und Zeilen gesetzt werden. <br/>
                Die Tabelle muss ausgewählt sein (sichtbar am grünen Rand)
                <ol>
                    <li>Verfeinerung der Spalten über die Taste "v" beginnen. Die farblichen Ränder links, und rechts
                        zum Setzen von Zeilen und Spalten verschwinden daraufhin.</li>
                    <li>Einzelne vertikale Zellwände können ausgewählt werden und mittels Tasten "a" und "d" nach
                        links und rechts verschoben werdern</li>
                </ol>
            </div>
            <div>
                <h3>OCR</h3>
                Sobald dieser Schritt begonnne wird, können die Spalten nicht weiter verfeinert werden. <br/>
                Die Tabelle muss ausgewählt sein (sichtbar am grünen Rand)
                <ol>
                    <li>OCR über die Taste "o" beginnen, nach einer kurzen Wartezeit steht das OCR Ergebnis
                        bereit und die Tabelle erscheint in einer aufgespaltenen Form. Diese Ansicht kann
                        ebensfalls über die Taste "o" wieder verlassen werden.</li>
                    <li>Auswahl der Datentypen im Kopf der Tabelle</li>
                    <li>Korrektur der OCR Ergebnisse. Änderungen werden automatisch gespeichert, sobald ein
                        Textfeld verlassen wird. Mittels der Tabulatortaste kann man zum nächsten Textfeld springen</li>
                </ol>
            </div>
            <div>
                <h3>Export</h3>
                <li>Bei ausgewählter Tabelle oder in der OCR-Ansicht durch die Taste "x"</li>
            </div>
        </div>
    )
}

export default HelpScreen