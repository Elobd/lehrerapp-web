#!/bin/bash
# Baut alles neu (nach Cover-Tausch oder Textänderung). Aufruf: bash pipeline.sh
set -e; cd "$(dirname "$0")"
python3 covers.py
python3 build_textblatt.py; python3 build_ab.py; python3 build_lt.py; python3 build_kwr.py; python3 build_cu.py; python3 build_wdh.py
cd ../out
soffice --headless --convert-to pdf Textblatt_Buchdruck.docx Arbeitsblatt_Offene_Fragen.docx Lueckentext.docx Kreuzwortraetsel.docx Check-up_SingleChoice.docx >/dev/null 2>&1
for pair in "Textblatt_Buchdruck:textblatt" "Arbeitsblatt_Offene_Fragen:arbeitsblatt" "Lueckentext:lueckentext" "Kreuzwortraetsel:kreuzwort" "Check-up_SingleChoice:checkup"; do pdftoppm -r 110 -png -f 1 -l 1 -singlefile "${pair%%:*}.pdf" "../img/thumb_${pair##*:}"; done
pdftoppm -r 110 -png -f 3 -l 3 -singlefile Textblatt_Buchdruck.pdf ../img/thumb_textblatt3
cd ../src; python3 build_ppt3.py
cd ../out; soffice --headless --convert-to pdf Praesentation_Buchdruck.pptx >/dev/null 2>&1
# Druckmappen (alle Dokumente als ein PDF zum Ausdrucken)
soffice --headless --convert-to pdf Arbeitsblatt_Offene_Fragen_LOESUNG.docx Lueckentext_LOESUNG.docx Kreuzwortraetsel_LOESUNG.docx Check-up_SingleChoice_LOESUNG.docx Check-up_MultipleChoice.docx Check-up_MultipleChoice_LOESUNG.docx Wiederholung-muendlich_Der-Buchdruck.docx >/dev/null 2>&1
pdfunite Textblatt_Buchdruck.pdf Arbeitsblatt_Offene_Fragen.pdf Lueckentext.pdf Kreuzwortraetsel.pdf Check-up_SingleChoice.pdf Check-up_MultipleChoice.pdf Druckmappe_Schueler_Der-Buchdruck.pdf
pdfunite Textblatt_Buchdruck.pdf Arbeitsblatt_Offene_Fragen.pdf Arbeitsblatt_Offene_Fragen_LOESUNG.pdf Lueckentext.pdf Lueckentext_LOESUNG.pdf Kreuzwortraetsel.pdf Kreuzwortraetsel_LOESUNG.pdf Check-up_SingleChoice.pdf Check-up_SingleChoice_LOESUNG.pdf Check-up_MultipleChoice.pdf Check-up_MultipleChoice_LOESUNG.pdf Wiederholung-muendlich_Der-Buchdruck.pdf Druckmappe_Lehrkraft_Der-Buchdruck.pdf
echo fertig
