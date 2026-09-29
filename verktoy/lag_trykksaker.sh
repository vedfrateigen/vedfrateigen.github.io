#!/bin/sh
# © 2026 Benjamin Teigen. Alle rettigheter forbeholdt – se LICENSE.
# Lager alt som har prisar/tekst i seg på nytt: nettbilete, skjermbilete, plakat, kort og rettleiinga.
# Kjør etter at du har endra config.js:  sh verktoy/lag_trykksaker.sh
set -e
cd "$(dirname "$0")/.."
python3 verktoy/lag_bilder.py
swiftc -O verktoy/skjermbilder.swift -o /tmp/vedsal-skjermbilder
/tmp/vedsal-skjermbilder verktoy/skjermbilder.json
/tmp/vedsal-skjermbilder verktoy/skjermbilder-ekstra.json
python3 verktoy/lag_plakat.py https://vedfrateigen.github.io/
mkdir -p verktoy/bygg
qlmanage -t -s 1100 -o verktoy/bygg "leveranse/Plakat A4 – Ved frå Teigen.pdf" >/dev/null 2>&1
mv "verktoy/bygg/Plakat A4 – Ved frå Teigen.pdf.png" verktoy/bygg/plakat-forhand.png
python3 verktoy/lag_veiledning.py
python3 verktoy/lag_huskeliste.py
echo "✔ Ferdig. Filene ligg i leveranse/. Publiser nettsida med: sh verktoy/publiser.sh \"Nye prisar\""
