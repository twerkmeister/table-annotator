import React from "react";
import styled from "styled-components";

const HelpScreenDiv = styled.div`
    width: 50%;
    position: absolute;
    left: 25%;
    top: 100px;
    background: papayawhip;
    padding: 20px;
    z-index: 99;
`

const HelpScreen = () => {
    return (
        <HelpScreenDiv>
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
                    <li>Dokumente mittels Tasten "q" und "e" drehen, sodass der Tabellenkörper gerade steht.
                        Bei der Ausrichtung kann das Raster, das über "r" aktiviert und deaktiviert werden kann, helfen</li>
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
                    <li>Spalten über den lilanen, oberen Rand der Tabelle hinzufügen</li>
                    <li>Spalten und Zeilen können über die Griffe am Tabellenrand ausgewählt werden und durch die Maus
                        oder die Tasten "w", "a", "s", "d" bewegt werden.</li>
                    <li>Zellwände können ebenso verschoben werden</li>
                    <li>Fehlerhaft gesetzte Spalten und Zeilen lassen sich durch die Rücktaste löschen.</li>
                </ol>
            </div>
            <div>
                <h3>OCR</h3>
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
        </HelpScreenDiv>
    )
}

export default HelpScreen