# Generatoren für Arbeitsaufträge (Proben)
Erzeugen aus einem Thema (Beispiel „Der Buchdruck“) Textblatt, Arbeitsblatt, Lückentext, Kreuzworträtsel, Check-ups, Kahoot/Plickers/MS-Forms-Dateien, mündliche Wiederholungen und die Präsentation.
- `pipeline.sh` baut alles (Python 3, python-docx, python-pptx, openpyxl, Pillow, LibreOffice, poppler).
- Die Präsentation braucht die eigene Vorlagen-Datei als `vorlage.pptx` in diesem Ordner (nicht im Repo, enthält persönliche Links).
- Zentrales Cover: `cover_tauschen.py <bild>`, dann `pipeline.sh`.
- Ausgabe liegt in `../out`, Bilder in `../img` (bitte neben `src` anlegen).
