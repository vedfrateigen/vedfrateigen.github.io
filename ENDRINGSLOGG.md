# Endringslogg – Vedsal

## 2026-09-28 – Første versjon

Benjamin ba om et enkelt system for pappas vedsalg, med brukerveiledning, plakat og ideer til markedsføring.

- Kundeside (`index.html`) med prisliste, priskalkulator, adressesøk (Kartverket), kjøreavstand (OSRM) og bestilling på SMS til 917 50 205.
- Pappa-appen «Vedsal» (`pappa.html`): ny bestilling, «Ferdig» → betalt/ikke betalt, angre, påminnelse på SMS, kart, Facebook-annonse, «Sal i år» med MVA-grense og tryggingskopi. Kan installeres på startskjermen og virker uten dekning.
- Produkter: bjørk 60 l sekk 125 kr, gran 60 l sekk 79 kr (til opptenning), løs kubikk bjørk 2 000 kr/m³. Frakt 3,50 kr/km tur/retur, minst 100 kr.
- All brukertekst på nynorsk (pappas språk).
- Foto fra Benjamin (IMG_4142–4146) brukt på kundesida, Facebook-bildet og plakaten. GPS/EXIF er fjernet.
- Leveranser i `leveranse/`: «Vedsal – slik fungerer det».pdf (11 sider), A4-plakat med QR og avrivingslapper, og kortark (10 stk. 85 × 55 mm).
- Tester: `tester/test.mjs` (10 enhetstester) og `tester/klikktester.json` (6 klikktester i WebKit). Alle grønne.

**Ikke gjort ennå:** publisering (venter på GitHub-konto). QR-koden på plakat og kort, `og:image` og `og:url` settes når adressen er kjent.
