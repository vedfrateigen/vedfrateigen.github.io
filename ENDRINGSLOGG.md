# Endringslogg – Vedsal

## 2026-10-04 – Fast tilbud, stablet kubikk og enklere Facebook

- Fast tilbud erstatter 120-kr-rabatten: for hver 10. sekk bjørk får kunden 1 sekk granved gratis, uten tak. Det står som «Fast tilbod: … – så lenge det er granved att» i prislista, annonsen, påminnelsen, Facebook-bildet og plakaten (Forbrukertilsynet om betingede tilbud). Gratissekken vises i kalkulatoren, i SMS-en og på kortet, men ikke i summen. Gamle bestillinger beholder reglene de ble lagret med.
- Utselt gran setter tilbudet på pause. Annonsen og påminnelsen nevner da bare det som er igjen, og pappa ser «Tilbodet er på pause».
- Kubikken heter nå «Stabla kubikk bjørk (m³)»: ved uten sekk, målt stablet i hengeren. Minstebestilling for levering er 10 sekker eller ½ m³ (1 m³ stablet ≈ 23 sekker).
- Facebook-annonsen er forenklet. Pappa kopierer én kort tekst med lenke og telefonnummer, limer den inn én gang, og Facebook lager bildet selv. Bildevalget er fjernet, fordi et delt bilde ga innlegg uten klikkbar lenke. Stegene advarer mot «Selg noe», skjermbilder og flere innliminger, og sier hva som er normalt (ingen forhåndsvisning, venter på godkjenning). Dobbel tekst slettes med sletteknappen («Merk alt»/«Slett» finnes ikke i menyen på Samsung).
- Lenka i annonsen og påminnelsen kommer nå fra `nettside` i `config.js`. Skjermbildet i veiledningen viste en lokal filsti.
- Ny «Vedsal – Facebook-guide».pdf (1 side). Side 2 i huskelista gikk utenfor arket og er kortet ned. Huskeliste, Facebook-guide og veiledning (side 5) stopper nå med feil i stedet for å lage et avkuttet ark.
- Opphavsrett: «© 2026 Benjamin Bruflot Teigen · 913 47 058» i LICENSE, kodefilene, nettsida, appen og PDF-ene.
- `publiser.sh` gir `og:image` en ny `?v=` når Facebook-bildet er endret.
- «Slik skal appen se ut.png» er flyttet til `verktoy/bygg/`, fordi den viste gamle priser.
- Tester: 17 enhetstester og 28 klikktester, alle grønne. QR-koden er kontrollert (plakat 1, kort 10).

## 2026-09-29 – Påminning neste haust, bilete i annonsen, målingar

- Påminning neste haust, med samtykke (markedsføringsloven § 15): avkryssing på kundesida (aldri forhåndsavkrysset) og i pappas skjema. Samtykket følger med SMS-lenka og lagres med dato. «Sal i år» › «Påminning neste haust» viser kundene med «Send» (ferdig SMS med «svar NEI») og «Vil ikkje ha». Framsida minner om det 15. aug.–31. okt., men bare for kunder som ikke har handlet de siste 150 dagene.
- Facebook-annonsen: velg bilde («Med prisar», «Sekkane», «Vedstabelen») og trykk «Del på Facebook». Teksten kopieres og bildet deles i samme trykk. Bildene virker uten dekning.
- «Sal i år» viser hvor bestillingene kom fra: nettsida, telefon/Facebook og kjøpt på staden (hurtigsalg lagres med kilde «innom»). Dette er målingen for testperioden.
- Retta: produktbildet på kundesida ble høyt og smalt, fordi `height`-attributtet overstyrte `aspect-ratio`. Har nå `height: auto` og en regresjonstest.
- Huskeliste og veiledning er oppdatert. «Slik skal appen se ut.png» viser riktig app (lys/mørk) mot kundesida.
- Tester: 15 enhetstester og 25 klikktester, alle grønne.

## 2026-09-28 – Navn, rødt blikkfang, huskeliste og nye snarveier for pappa

- Navnet «Kjell Arne Teigen» står på nettsida («Ring Kjell Arne», «Hent hos Kjell Arne»), i SMS-ene («Hei Kjell Arne!», «Helsing Kjell Arne»), i annonsen og på plakat/kort. Veiledningen er «Laga til Kjell Arne».
- Plakaten: bildet har en ren kant (kolliderte med overskriften før), rød «Bestill her!»-lapp ved QR-koden, «Skann og bestill her!», og tilbudet i rødt. Kortene har «Bestill her!» over QR-koden. Nettsida har en rød «Tilbod»-merkelapp.
- Nytt i appen: «Betalt med Vipps/kontant» for kunder som betaler med en gang (hurtigsalg), forslag fra tidligere kunder når han skriver navnet, «Endre totalprisen» (vennepris), «Kvittering» på betalte handler, og «utselt» i `config.js`.
- Ny «Vedsal – huskeliste».pdf (2 sider): hva han gjør i hver situasjon, også ved bestillinger «på den gamle måten».
- Tester: 14 enhetstester og 17 klikktester, alle grønne.

## 2026-09-28 – Svar fra pappa

- Granved: 30 cm (står nå i prislista, annonsen, plakaten og veiledningen).
- Minstebestilling for levering: 10 sekker eller 1 m³. Kundesida stopper bestillingen under det, pappas app gir bare en advarsel.
- Rabatt: 20 sekker bjørk eller flere koster 120 kr per sekk (Benjamin bekreftet «20, ikke 21»). Vises i prislista, kalkulatoren, SMS-ene, Facebook-annonsen, plakaten og PDF-en.
- Ingen faste leveringsdager: «Tidspunkt avtalar vi på SMS».
- Tester: 13 enhetstester og 12 klikktester, alle grønne.

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
