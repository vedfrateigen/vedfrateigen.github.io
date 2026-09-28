# Vedsal – Ved frå Teigen

Enkel løsning for pappas vedsalg. Brukertekstene er på **nynorsk**, siden det er pappas språk. Koden og denne fila er på bokmål.

- **Kundeside:** https://vedfrateigen.github.io (QR-koden på plakat og kort peker hit)
- **Pappa-appen:** https://vedfrateigen.github.io/pappa.html
- **Kode:** https://github.com/vedfrateigen/vedfrateigen.github.io (organisasjonen «vedfrateigen», eid av kontoen Benjaminn2001)
- **Oppdatere siden:** gjør endringen, `git commit`, så `git push`. GitHub Pages publiserer på nytt i løpet av ca. ett minutt. `gh` ligger i `~/.local/bin/gh`, og innloggingen er lagret i nøkkelringen.

| Del | Fil | Hvem bruker den |
|---|---|---|
| Bestillingsside med priskalkulator | `index.html` + `kunde.js` | Kundene (lenke på Facebook, QR-kode på plakat) |
| Pappa-appen «Vedsal» | `pappa.html` + `pappa.js` | Pappa, lagt på startskjermen på Samsung-telefonen |
| Felles logikk (pris, frakt, adressesøk, skjema) | `felles.js` | Begge |
| **Alle priser og innstillinger** | `config.js` | Endres her |

## Slik virker det

- **Ingen server og ingen database.** Kundesida lagrer ingenting. En bestilling sendes som vanlig SMS fra kundens telefon til pappa.
- SMS-en inneholder en lenke (`pappa.html#i=…`). Når pappa trykker på den, åpnes bestillingen ferdig utfylt i appen. Prisen regnes alltid ut på nytt i appen, så en tuklet lenke kan ikke endre prisen.
- Pappa-appen lagrer alt i `localStorage` på telefonen. Den ber om varig lagring (`navigator.storage.persist`) og virker uten dekning (`sw.js`).
- **Frakt:** kjøreavstand fra Teigavegen 131 × 2 (tur/retur) × 3,50 kr, minst 100 kr, rundet opp til nærmeste 50 kr. Satsen er Skatteetatens skattefrie kilometersats (2025–2026). Over 100 km én vei avtales prisen.
- **Adressesøk:** Kartverkets åpne API-er (`ws.geonorge.no/adresser`, `/stedsnavn`). **Kjøreavstand:** OSRM (`router.project-osrm.org`). Svarer ikke OSRM, brukes luftlinje × 1,4 og prisen merkes «ca.». Pappa kan alltid skrive frakten selv.
- **Personvern:** navn, telefon og adresse på ferdige og betalte handler slettes fra pappas telefon etter 15 måneder (`slettEtterMaaneder`). Beløpene blir igjen i oversikten.

## Endre priser (eller telefonnummer, frakt …)

1. Rediger `config.js`. **Endre aldri `id` på et produkt** som har gamle bestillinger. Endre bare pris og tekst.
2. `sh verktoy/lag_trykksaker.sh`: lager Facebook-bildet, skjermbildene, plakaten, kortene og PDF-en på nytt med de nye prisene.
3. `sh verktoy/publiser.sh "Nye prisar"`: kjører testene, gir appen ny versjon og publiserer. Pappas app henter den nye versjonen neste gang han går til framsida.
4. Facebook husker gamle forhåndsbilder. Lim inn https://vedfrateigen.github.io på https://developers.facebook.com/tools/debug/ og trykk «Scrape Again».

Gamle bestillinger beholder prisen de ble lagret med. En bestilling fra nettsida regnes ut med *dagens* priser når pappa åpner den. Endres prisene samme dag, kan tallet i kundens SMS derfor avvike litt fra appen. Det er med vilje, så en tuklet lenke ikke kan endre prisen.

## Sette opp på pappas telefon (Samsung S10+)

1. Åpne https://vedfrateigen.github.io/pappa.html i Chrome på telefonen hans (send lenka på SMS, eller skann QR-koden og bytt til `/pappa.html`).
2. Trykk den grønne knappen «Legg Vedsal på startskjermen». Finnes ikke knappen: ⋮ → «Legg til på startskjermen».
3. Legg inn én testbestilling sammen, trykk «Ferdig» → «Ja, Vipps», og vis «Angre».
4. Tryggingskopi: «Sal i år» → «Tryggingskopi og innstillingar» → «Send tryggingskopi».

## Verktøy (kjøres på Macen)

De to skriptene over dekker det vanlige. Enkeltverktøyene:

```bash
node tester/test.mjs                                   # regnestykker, lenke, adressetolking
python3 verktoy/lag_bilder.py                          # nettbilder + Facebook-bilde fra verktoy/foto/ (fjerner GPS/EXIF)
swiftc -O verktoy/skjermbilder.swift -o /tmp/skjermbilder
/tmp/skjermbilder verktoy/skjermbilder.json            # skjermbilder med demodata
/tmp/skjermbilder verktoy/skjermbilder-ekstra.json
/tmp/skjermbilder tester/klikktester.json              # klikktester i WebKit (✘ = feil)
python3 verktoy/lag_plakat.py https://vedfrateigen.github.io/   # A4-plakat og kort med QR-kode → leveranse/
python3 verktoy/lag_veiledning.py                      # «Vedsal – slik fungerer det».pdf → leveranse/
```

`verktoy/foto/`, `verktoy/bilder/`, `verktoy/bygg/` og `leveranse/` er ikke med i git. Originalfotoene kan inneholde GPS-posisjon.

## Regler vi har sjekket (ikke juridisk rådgivning)

| Regel | Hva den krever | Slik er det løst |
|---|---|---|
| Merverdiavgift, 50 000 kr-grensen ([Skatteetaten](https://www.skatteetaten.no/en/business-and-organisation/reporting-and-industries/industries-special-regulations/agriculture-forestry-and-fisheries/skogbruk/drive-skogbruk/)) | Omsetning av ved over 50 000 kr i løpet av 12 måneder gir plikt til å registrere seg i Merverdiavgiftsregisteret | «Sal i år» viser siste 12 måneder mot grensen og varsler fra 40 000 kr |
| Skatt | Inntekten skal med i skattemeldingen | Årsoversikt per måned og «Send oversikta» |
| Personvern (GDPR) | Lagre minst mulig, kun til formålet, informere | Kundesida lagrer ingenting og har personverntekst. Appen lagrer bare på pappas telefon og sletter etter 15 måneder |
| Markedsføring på SMS ([Forbrukertilsynet](https://www.forbrukertilsynet.no/wp-content/uploads/2018/01/Veiledning-om-markedsf%C3%B8ring-via-epost-sms-ol.pdf), markedsføringsloven § 15) | Reklame på SMS krever samtykke. Unntaket for egne kunder krever beskjed ved kjøpet og en enkel måte å si nei på | Appen sender bare svar og påminnelser om betaling, ikke reklame. Utsendelser til fjorårets kunder er ikke laget |
| Reklame langs vei ([veglova § 33](https://lovdata.no/lov/1963-06-21-23), [Statens vegvesen](https://www.vegvesen.no/en/traffic-information/along-the-road/apply-for-roadside-advertisement/)) | Skilt som vender mot offentlig vei krever løyve | Står som merknad i idélista i PDF-en |
| Kartdata (Kartverket, OpenStreetMap/OSRM) | Kreditering | Står nederst på kundesida |
| Mål for ved (NS 4414, frivillig standard) | Oppgi volum (liter / løs m³) | 60 l sekk og «laust mål, ikkje stabla» står på sida |
