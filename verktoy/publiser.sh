#!/bin/sh
# © 2026 Benjamin Teigen. Alle rettigheter forbeholdt – se LICENSE.
# Publiserer endringer til https://vedfrateigen.github.io (GitHub Pages bygger på nytt på ca. ett minutt).
# Bruk: sh verktoy/publiser.sh "Kort beskrivelse av endringen"
set -e
cd "$(dirname "$0")/.."
node tester/test.mjs >/dev/null && echo "✔ tester OK"
# Ny cache-versjon gjør at pappas app henter den nye versjonen neste gang den åpnes.
sed -i '' "s/^const CACHE = \".*\";/const CACHE = \"vedsal-$(date +%Y-%m-%d-%H%M)\";/" sw.js
git add -A
git commit -q -m "${1:-Oppdatering}" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q
echo "✔ Publisert. Sjekk https://vedfrateigen.github.io om ca. ett minutt."
