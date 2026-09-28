# Endringslogg – Vedsal

## 2026-09-28 – Publisert og kvalitetssikret

- Publisert på https://vedfrateigen.github.io (GitHub-organisasjonen «vedfrateigen»). QR-koden på plakat og kort er kontrollert med Macens strekkodeleser.
- Uavhengig gjennomgang av nynorsk og kode (to agenter). Retta:
  - Ulagret ny bestilling tas vare på som utkast («Hald fram» på framsida). Android-tilbakeknappen mister ikke lenger det pappa har skrevet.
  - «Ferdig/Betalt/Slett» sier ikke lenger «lagra» hvis lagringen feilet.
  - Påminnelse om tryggingskopi etter 30 dager (fra 5 bestillinger).
  - Ny versjon lastes automatisk når pappa er på framsida (service worker og cache-versjon).
  - Adressesøket gir opp etter ca. 9 sekunder og sier «Fekk ikkje kontakt med kartet» ved dårlig dekning.
  - Advarsel om mulig dobbel bestilling fra samme telefonnummer.
  - Et raskt dobbelttrykk på «Ferdig» kan ikke velge betalingsmåte ved et uhell.
  - Bedre kontrast i mørk modus, reservetekst når SMS-knappen ikke virker (Facebook-nettleseren), ingen priser i Facebook-forhåndsteksten.
  - Språk: «Lagre bestillinga» overalt, «bygdetreff» i stedet for «bygdemeet», knappetekster lik veiledningen.
- Kartlenke til henteadressen på kundesida.
- Plakat, kort, Facebook-bilde og PDF henter nå prisene fra `config.js` (`verktoy/config.py`). Nye skript: `verktoy/lag_trykksaker.sh` og `verktoy/publiser.sh`.
- Skjermbildeverktøyet hang på relative stier. Retta, og har nå tidsavbrudd.
- Tester: 10 enhetstester og 9 klikktester, alle grønne.

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
