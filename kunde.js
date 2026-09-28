/* Kundesida: prisliste, priskalkulator og bestilling på SMS til seljaren. */
(function () {
  "use strict";
  const { C, h, kr, tall } = Ved;
  const harTelefon = /^\+?\d{8,12}$/.test(Ved.telefonLenke(C.telefon));

  document.getElementById("merkenavn").textContent = C.navn;

  /* Prisliste */
  document.getElementById("priser").append(h("div", { class: "kort prisliste" },
    ...C.produkter.map((p) => h("div", { class: "prisrad" },
      h("div", {},
        h("div", { class: "navn", text: p.navn }),
        h("div", { class: "detalj", text: p.detalj })),
      h("div", { class: "pris" }, kr(p.pris), h("span", { class: "per", text: "per " + p.eining }))))));

  /* Kalkulator og bestilling */
  let id = Ved.nyId();
  let sendt = false;
  const skjema = Ved.lagSkjema({
    modus: "kunde",
    vedEndring: () => {
      // Endrar kunden noko etter å ha sendt, blir det ei ny bestilling.
      if (sendt) { id = Ved.nyId(); sendt = false; takk.hidden = true; }
    },
  });
  document.getElementById("skjema").append(skjema.el);

  function bestillingstekst(s, lenke) {
    const b = Ved.beregn(s);
    const linjer = ["Hei! Eg vil bestille ved:", Ved.beskrivAntall(s.antall)];
    if (s.levering) linjer.push("Levering til " + (s.adresse.trim() || "(skriv adressa her)") + (s.km != null ? " (ca. " + tall(s.km) + " km)" : ""));
    else linjer.push("Eg hentar sjølv.");
    linjer.push("Pris ifølgje nettsida: " + kr(b.total) + (b.fraktUkjent ? " + frakt" : ""));
    if (s.navn.trim()) linjer.push("Namn: " + s.navn.trim());
    if (s.telefon.trim()) linjer.push("Tlf: " + Ved.visTelefon(s.telefon.trim()));
    if (s.notat.trim()) linjer.push("Merknad: " + s.notat.trim());
    linjer.push("", "For seljar – legg inn i Vedsal: " + lenke);
    return linjer.join("\n");
  }

  function mangler(s) {
    if (!C.produkter.some((p) => s.antall[p.id] > 0)) return "Vel kor mykje ved du vil ha (trykk +).";
    if (s.levering === null) return "Vel levering eller henting.";
    if (s.levering && s.adresse.trim().length < 3) return "Skriv kvar veden skal leverast.";
    if (!s.navn.trim()) return "Skriv namnet ditt.";
    return null;
  }

  function lagTekst() {
    const s = skjema.tilstand();
    const ordre = Object.assign({}, s, { id, navn: s.navn.trim(), telefon: s.telefon.trim(), adresse: s.adresse.trim(), notat: s.notat.trim() });
    const lenke = new URL("pappa.html", location.href).href.split("#")[0] + "#" + Ved.ordreTilParam(ordre);
    return bestillingstekst(s, lenke);
  }

  const takk = h("div", { class: "boks-gronn takk", hidden: true },
    h("strong", { text: "Takk! " }), "Trykk «Send» i meldingsappen. Vi svarar deg så fort vi kan og stadfestar prisen.");

  const sendKnapp = h("button", { class: "knapp primar stor", type: "button", onclick: () => {
    const feil = mangler(skjema.tilstand());
    if (feil) { Ved.visMelding(feil); return; }
    sendt = true;
    takk.hidden = false;
    location.href = Ved.smsLenke(C.telefon, lagTekst());
  } }, h("span", { class: "knapp-ikon", "aria-hidden": "true" }, "💬"), "Bestill på SMS");

  const ringKnapp = harTelefon
    ? h("a", { class: "knapp", href: "tel:" + Ved.telefonLenke(C.telefon) },
      h("span", { class: "knapp-ikon", "aria-hidden": "true" }, "📞"), "Ring " + Ved.visTelefon(C.telefon))
    : null;

  const kopierLenke = h("p", { class: "hint" }, "Opnar ikkje meldingsappen seg, eller sit du på PC? ",
    h("button", { type: "button", class: "lenkeknapp", onclick: async () => {
      const feil = mangler(skjema.tilstand());
      if (feil) { Ved.visMelding(feil); return; }
      const ok = await Ved.kopier(lagTekst());
      sendt = true;
      Ved.visMelding(ok ? "Kopiert – send teksten på SMS til " + Ved.visTelefon(C.telefon) + "." : "Klarte ikkje å kopiere.");
    } }, "Kopier bestillinga"),
    harTelefon ? " og send ho på SMS til " + Ved.visTelefon(C.telefon) + "." : ".");

  const send = document.getElementById("send");
  if (!harTelefon) {
    send.append(h("p", { class: "boks-gul", text: "Telefonnummeret til seljaren er ikkje lagt inn enno (config.js)." }));
    sendKnapp.disabled = true;
  }
  send.append(...[sendKnapp, takk, ringKnapp, kopierLenke].filter(Boolean));

  /* Informasjon */
  const L = C.levering;
  const eksempler = h("table", { class: "eksempler" }, ...C.eksempler.map((e) => {
    const pris = Ved.leveringspris(e.km);
    return h("tr", {}, h("td", { text: e.sted + " (" + tall(Math.round(e.km)) + " km)" }), h("td", { text: pris != null ? kr(pris) : "etter avtale" }));
  }));
  const infoKort = (ikon, tittel, ...innhald) => h("section", { class: "kort" },
    h("h2", {}, h("span", { "aria-hidden": "true" }, ikon), tittel), ...innhald);

  document.getElementById("info").append(
    infoKort("🚚", "Levering",
      h("p", { text: "Frakt blir rekna ut frå køyrde kilometer tur/retur: " + tall(L.krPerKm) + " kr per km" +
        (L.startpris ? " + " + kr(L.startpris) : "") + ", minst " + kr(L.minimum) + ", runda opp til næraste " + L.rundOppTil + "-lapp." }),
      eksempler,
      h("p", { class: "hint", text: "Vi leverer mest i Naustdal og Førde. Florø og andre stader etter avtale. Over " + L.maksKm + " km avtalar vi prisen." })),
    infoKort("🏠", "Hent sjølv",
      h("p", {}, "Hent på ", h("strong", { text: C.henteadresse }), ". Send SMS først, så avtalar vi tid."),
      h("a", { class: "knapp", href: Ved.kartLenke({ punkt: C.start }), target: "_blank", rel: "noopener" },
        h("span", { class: "knapp-ikon", "aria-hidden": "true" }, "🗺️"), "Vis vegen på kartet")),
    infoKort("💳", "Betaling",
      h("p", { text: (C.vipps ? "Vipps eller kontant" : "Kontant") + " ved levering eller henting." })),
    infoKort("🪵", "Om veden",
      h("img", { class: "foto", src: "bilder/sekkar.jpg", alt: "Vedsekkar med bjørk og gran, klare til levering", loading: "lazy", width: "1200", height: "900" }),
      h("p", { text: "Bjørk er god fyringsved. Gran tek lett fyr og er fin til opptenning. Bjørka er kappa i 30 cm – " +
        "det passar i dei fleste vedomnar. Sekkane er på 60 liter. Laus kubikk er målt laust, ikkje stabla." })));

  document.getElementById("bunn").append(
    h("h2", { text: "Personvern" }),
    h("p", { text: "Denne sida lagrar ingenting om deg og brukar ikkje informasjonskapslar (cookies). Bestillinga blir send som ein vanleg SMS frå telefonen din. " +
      "Adressa du skriv, blir slått opp hos Kartverket, og kartpunktet blir sendt til ruteplanleggjaren OSRM for å rekne ut køyreavstanden. " +
      "Seljaren lagrar namn, telefon og adresse på eigen telefon for å levere, og slettar det seinast " + C.slettEtterMaaneder + " månader etter at handelen er ferdig." }),
    h("p", { text: "Adresser og stadnamn © Kartverket. Køyreavstand frå OSRM, kartdata © OpenStreetMap-bidragsytarar." }),
    h("p", { text: "© " + new Date().getFullYear() + " " + C.navn + " · " + C.henteadresse }));

  Ved.registrerOffline();
})();
