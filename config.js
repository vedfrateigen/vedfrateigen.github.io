// © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
/* Ved frå Teigen – alle prisar og innstillingar på éin stad.
   Endrar du noko her, gjeld det både kundesida (index.html) og pappa-appen (pappa.html). */
window.VED = {
  navn: "Ved frå Teigen",
  // Adressen til kundesida. Brukes i Facebook-annonsen og påminnings-SMS-en, så lenka alltid blir riktig.
  nettside: "https://vedfrateigen.github.io/",
  // Selgeren. Navnet brukes på nettsida, i SMS-ene, i annonsen og på plakat/kort.
  selger: "Kjell Arne Teigen",
  selgerFornavn: "Kjell Arne",

  // Pappas mobilnummer (8 siffer). Kundesida sender bestillinger hit på SMS.
  telefon: "91750205",
  // true = kundene kan betale med Vipps til nummeret over.
  vipps: true,

  henteadresse: "Teigavegen 131, 6817 Naustdal",
  // Henteadressen på kartet (Kartverket). Kjøreavstanden regnes herfra.
  start: { lat: 61.591702, lon: 5.945939 },

  // eining = «per sekk», eintal/fleirtal = etter et tall («1 sekk bjørk», «10 sekkar bjørk»), annonse = linja i Facebook-annonsen,
  // kortnavn = på plakat, kort og Facebook-bildet, vedtype = i første linje av annonsen. Endre aldri «id» på et produkt som har gamle bestillinger.
  produkter: [
    { id: "sekk", navn: "Bjørkeved, 60 l sekk", detalj: "Tørr bjørk, 30 cm", pris: 125,
      eining: "sekk", eintal: "sekk bjørk", fleirtal: "sekkar bjørk", steg: 1, maks: 300,
      annonse: "Bjørkeved i 60 l sekk (tørr, 30 cm)", kortnavn: "Bjørk, 60 l sekk", vedtype: "bjørkeved" },
    { id: "gran", navn: "Granved, 60 l sekk", detalj: "Tørr gran, 30 cm – fin til opptenning", pris: 79,
      eining: "sekk", eintal: "sekk gran", fleirtal: "sekkar gran", steg: 1, maks: 300,
      annonse: "Granved i 60 l sekk (tørr, 30 cm, fin til opptenning)", kortnavn: "Gran, 60 l sekk", vedtype: "granved" },
    // Kubikken er laus ved (ikkje i sekk), MÅLT STABLA i hengaren (avklart 2026-10-04). 1 m³ stabla ≈ 1,375 m³ laust mål (NS 4414: 1 favn = 2,4 m³ stabla
    // ≈ 3,3 m³ laus) ≈ 23 sekkar à 60 l – brukt når minstebestillinga for levering blir rekna ut.
    { id: "m3", navn: "Stabla kubikk bjørk (m³)", detalj: "30 cm, stabla i hengaren – ikkje i sekk", pris: 2000,
      eining: "m³", eintal: "m³ stabla bjørk", fleirtal: "m³ stabla bjørk", steg: 0.5, maks: 30, sekkPerEining: 23,
      annonse: "Kubikk bjørk, 30 cm, stabla i hengaren, per m³", kortnavn: "Stabla kubikk, per m³", vedtype: "bjørkeved" },
  ],

  // Produkter som er utsolgt, f.eks. ["gran"]. Da står «Utselt no» på nettsida og kunden kan ikke velge dem.
  utselt: [],

  // Fast tilbud: for hver 10. sekk bjørk får kunden 1 sekk granved gratis (avtalt 2026-10-04, uten tak).
  // Forbrukertilsynet (betingede tilbud): må kalles «fast tilbod» og ha vilkårene med overalt der det markedsføres,
  // og prisen på bjørk skal IKKE settes opp for å «betale» for gaven. Pause: sett "gran" i utselt.
  tilbod: { kjop: "sekk", per: 10, gratis: "gran", antal: 1 },

  // Gammel mengderabatt (120 kr per sekk fra 20 sekker) – avløst av tilbudet over. null = av.
  // Bestillinger som ble lagret med rabatten, beholder den.
  rabatt: null,

  levering: {
    minstSekkar: 10, // minstebestilling for levering. Kubikk regnes om til sekker (sekkPerEining: 1 m³ stabla ≈ 23 sekker).
    krPerKm: 3.5,    // per kjørte km, tur/retur. Skatteetatens skattefrie bilsats 2025–2026.
    startpris: 0,    // fast tillegg per levering (f.eks. for tida). 0 = ingen.
    minimum: 100,
    rundOppTil: 50,
    maksKm: 100,     // én vei. Lenger enn dette: prisen avtales.
  },

  // Kjøreavstand fra henteadressen (router.project-osrm.org, målt 2026-09-28).
  // Brukes som eksempler på kundesida og i Facebook-annonsen.
  eksempler: [
    { sted: "Naustdal sentrum", km: 20.5 },
    { sted: "Førde sentrum", km: 32.5 },
    { sted: "Florø", km: 62.4 },
  ],

  literPerSekk: 60,

  // Når kartserveren ikke svarer: luftlinje × denne faktoren gir omtrentlig kjøreavstand.
  veiFaktor: 1.4,

  // Kundedata slettes fra pappas telefon så mange måneder etter at handelen er ferdig og betalt.
  slettEtterMaaneder: 15,
};
