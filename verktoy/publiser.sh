#!/bin/sh
# © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
# Publiserer endringer til https://vedfrateigen.github.io (GitHub Pages bygger på nytt på ca. ett minutt).
# Bruk: sh verktoy/publiser.sh "Kort beskrivelse av endringen"
set -e
cd "$(dirname "$0")/.."
node tester/test.mjs >/dev/null || { echo "✘ Testene feilet – ingenting er publisert. Kjør: node tester/test.mjs"; exit 1; }
echo "✔ tester OK"
# Nytt Facebook-bilde? Da får og:image ny ?v=, så Facebook henter det nye bildet ved neste «Scrape Again».
if ! git diff --quiet HEAD -- og-bilde.jpg; then
  sed -i '' "s/og-bilde\.jpg?v=[0-9]*/og-bilde.jpg?v=$(date +%Y%m%d%H%M)/" index.html
fi
# Ny cache-versjon gjør at pappas app henter den nye versjonen neste gang den åpnes.
sed -i '' "s/^const CACHE = \".*\";/const CACHE = \"vedsal-$(date +%Y-%m-%d-%H%M)\";/" sw.js
# Endret innhold? Da får sitemap.xml dagens dato (Google stoler bare på lastmod som er riktig).
if ! git diff --quiet HEAD -- index.html config.js kunde.js felles.js; then
  sed -i '' "s|<lastmod>.*</lastmod>|<lastmod>$(date +%Y-%m-%d)</lastmod>|" sitemap.xml
fi
git add -A
git commit -q -m "${1:-Oppdatering}" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q
echo "✔ Publisert. Sjekk https://vedfrateigen.github.io om ca. ett minutt."
