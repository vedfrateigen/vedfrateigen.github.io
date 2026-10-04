// © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
/* Ved frå Teigen – alle prisar og innstillingar på éin stad.
   Endrar du noko her, gjeld det både kundesida (index.html) og pappa-appen (pappa.html). */
window.VED = {
  navn: "Ved frå Teigen",
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
  // kortnavn = på plakat, kort og Facebook-bildet. Endre aldri «id» på et produkt som har gamle bestillinger.
  produkter: [
    { id: "sekk", navn: "Bjørkeved, 60 l sekk", detalj: "Tørr bjørk, 30 cm", pris: 125,
      eining: "sekk", eintal: "sekk bjørk", fleirtal: "sekkar bjørk", steg: 1, maks: 300,
      annonse: "Bjørkeved i 60 l sekk (tørr, 30 cm)", kortnavn: "Bjørk, 60 l sekk" },
    { id: "gran", navn: "Granved, 60 l sekk", detalj: "Tørr gran, 30 cm – fin til opptenning", pris: 79,
      eining: "sekk", eintal: "sekk gran", fleirtal: "sekkar gran", steg: 1, maks: 300,
      annonse: "Granved i 60 l sekk (tørr, 30 cm, fin til opptenning)", kortnavn: "Gran, 60 l sekk" },
    { id: "m3", navn: "Laus kubikk bjørk (m³)", detalj: "Bjørk kappa i 30 cm, laust mål", pris: 2000,
      eining: "m³", eintal: "m³ laus bjørk", fleirtal: "m³ laus bjørk", steg: 0.5, maks: 30,
      annonse: "Laus kubikk bjørk, kappa i 30 cm, per m³", kortnavn: "Laus kubikk, per m³" },
  ],

  // Produkter som er utsolgt, f.eks. ["gran"]. Da står «Utselt no» på nettsida og kunden kan ikke velge dem.
  utselt: [],

  // Kjøper kunden «fraAntal» eller flere av produktet, koster hver av dem «pris».
  rabatt: { produkt: "sekk", fraAntal: 20, pris: 120 },

  levering: {
    minstSekkar: 10, // minstebestilling for levering. Løs kubikk regnes om til sekker (1 m³ ≈ 16,7 sekker à 60 l).
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
