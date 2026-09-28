/* Vedsal – pappa-appen. Alt lagres bare på telefonen (localStorage). All tekst er på nynorsk. */
(function () {
  "use strict";
  const { C, h, kr, tall } = Ved;
  const NOKKEL = "vedsalg.v1";
  const VERSJON = "1.0";
  const MVA_GRENSE = 50000;

  const app = document.getElementById("app");
  const tittel = document.getElementById("tittel");
  const tilbakeKnapp = document.getElementById("tilbake");
  const toppIkon = document.getElementById("topp-ikon");

  /* ---------- Lagring ---------- */

  function lesData() {
    try {
      const d = JSON.parse(localStorage.getItem(NOKKEL));
      if (d && Array.isArray(d.ordre)) return d;
    } catch (e) { /* tomt eller ødelagt – starter på nytt */ }
    return { ordre: [] };
  }
  let data = lesData();

  function lagreData() {
    try {
      localStorage.setItem(NOKKEL, JSON.stringify(data));
      return true;
    } catch (e) {
      Ved.visMelding("⚠️ Klarte ikkje å lagre. Ring Benjamin.");
      return false;
    }
  }

  // Ber nettleseren om ikke å slette dataene når telefonen får lite plass.
  function sikreLagring() {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  }

  // Personvern: fjern navn, telefon og adresse fra gamle, ferdige handler. Beløpene blir igjen i oversikten.
  function ryddGamle() {
    const grense = new Date();
    grense.setMonth(grense.getMonth() - C.slettEtterMaaneder);
    let endret = false;
    for (const o of data.ordre) {
      if (o.status === "ferdig" && o.betalt && o.ferdig && new Date(o.ferdig) < grense && !o.anonym) {
        const sted = (o.adresse || "").match(/\d{4}\s+(.+)$/);
        Object.assign(o, { navn: "", telefon: "", adresse: sted ? sted[1] : "", punkt: null, notat: "", anonym: true });
        endret = true;
      }
    }
    if (endret) lagreData();
  }

  const finn = (id) => data.ordre.find((o) => o.id === id);
  const erstatt = (ny) => {
    const i = data.ordre.findIndex((o) => o.id === ny.id);
    if (i >= 0) data.ordre[i] = ny; else data.ordre.push(ny);
  };
  const kopi = (o) => JSON.parse(JSON.stringify(o));

  /* ---------- Hjelpere ---------- */

  // Som app.replaceChildren, men hopper over tomme deler (null/false).
  const vis = (...deler) => app.replaceChildren(...deler.flat().filter((d) => d != null && d !== false));
  const ikon = (t) => h("span", { class: "knapp-ikon", "aria-hidden": "true" }, t);
  const dato = (iso) => new Date(iso).toLocaleDateString("nn-NO", { day: "numeric", month: "short" });
  const fornavn = (navn) => (navn || "").trim().split(/\s+/)[0] || "";
  const nettside = () => new URL("./", location.href).href;
  const stor = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  function prisTekst(o) {
    return kr(o.total) + (o.fraktUkjent ? " + frakt" : "");
  }

  function hvorTekst(o) {
    if (o.levering === true) return "🚚 " + (o.adresse || "Adresse manglar") + (o.km != null ? " · " + tall(o.km) + " km" : "");
    if (o.levering === false) return "🏠 Hentar sjølv";
    return "❓ Ikkje valt levering eller henting";
  }

  /* ---------- Navigasjon ---------- */

  let harNavigert = false;

  function tilbake() {
    if (harNavigert && history.length > 1) history.back();
    else location.replace("#/");
  }
  tilbakeKnapp.addEventListener("click", tilbake);

  function settTittel(tekst, visTilbake) {
    tittel.textContent = tekst;
    tilbakeKnapp.hidden = !visTilbake;
    toppIkon.hidden = visTilbake;
    document.title = visTilbake ? tekst + " – Vedsal" : "Vedsal";
    window.scrollTo(0, 0);
  }

  function rute() {
    const hash = location.hash.slice(1);
    if (hash && !hash.startsWith("/")) return fraLenke(hash);
    const [side, id] = hash.replace(/^\//, "").split("/");
    if (side === "ny") return skjemaSide(null);
    if (side === "endre" && finn(id)) return skjemaSide(finn(id));
    if (side === "facebook") return facebookSide();
    if (side === "oversikt") return oversiktSide(Number(id) || new Date().getFullYear());
    if (side === "benjamin") return benjaminSide();
    return hjem();
  }
  window.addEventListener("hashchange", () => { harNavigert = true; rute(); });

  /* ---------- Installer på startskjermen ---------- */

  let installHendelse = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installHendelse = e;
    if (!location.hash || location.hash === "#/") hjem();
  });

  function installKnapp() {
    if (!installHendelse) return null;
    return h("button", { class: "knapp", type: "button", style: "margin-bottom:14px", onclick: async () => {
      installHendelse.prompt();
      await installHendelse.userChoice.catch(() => {});
      installHendelse = null;
      hjem();
    } }, ikon("📲"), "Legg Vedsal på startskjermen");
  }

  /* ---------- Framsida ---------- */

  function hjem() {
    settTittel("Vedsal", false);
    const aapne = data.ordre.filter((o) => o.status === "aapen").sort((a, b) => a.opprettet.localeCompare(b.opprettet));
    const ubetalte = data.ordre.filter((o) => o.status === "ferdig" && !o.betalt).sort((a, b) => a.ferdig.localeCompare(b.ferdig));
    const ferdige = data.ordre.filter((o) => o.status === "ferdig" && o.betalt).sort((a, b) => b.ferdig.localeCompare(a.ferdig));

    const seksjon = (tittelTekst, liste, lagKort, tomTekst) => h("section", {},
      h("h2", { class: "seksjon-tittel" }, tittelTekst, liste.length ? h("span", { class: "antall-merke", text: String(liste.length) }) : null),
      liste.length ? liste.map(lagKort) : h("p", { class: "tom", text: tomTekst }));

    vis(
      installKnapp(),
      h("a", { class: "knapp primar stor", href: "#/ny" }, ikon("＋"), "Ny bestilling"),
      seksjon("Skal leverast eller hentast", aapne, aapenKort,
        "Ingen bestillingar no. Når nokon vil kjøpe ved, trykkjer du «Ny bestilling»."),
      ubetalte.length ? seksjon("Ventar på betaling", ubetalte, ubetaltKort) : null,
      h("div", { class: "knapp-rad hjem-meny" },
        h("a", { class: "knapp", href: "#/facebook" }, ikon("📣"), "Facebook-annonse"),
        h("a", { class: "knapp", href: "#/oversikt" }, ikon("📊"), "Sal i år")),
      ferdige.length ? h("details", { class: "ferdige" },
        h("summary", { text: "Ferdige og betalte (" + ferdige.length + ")" }),
        ferdige.slice(0, 30).map((o) => h("div", { class: "ferdig-rad" },
          h("span", { text: dato(o.ferdig) + " · " + (o.navn || "Kunde") + " · " + Ved.beskrivAntall(o.antall) + " · " + kr(o.total) + (o.betalt === "vipps" ? " · Vipps" : " · kontant") }),
          o.anonym ? null : h("a", { class: "lenkeknapp", href: "#/endre/" + o.id }, "Endre")))) : null,
    );
  }

  function kortTopp(o) {
    return [
      h("div", { class: "ordre-topp" },
        h("h3", { class: "ordre-navn", text: o.navn || "Kunde utan namn" }),
        h("a", { class: "lenkeknapp", href: "#/endre/" + o.id }, "Endre")),
      h("p", { class: "ordre-hva", text: Ved.beskrivAntall(o.antall) }),
      h("p", { class: "ordre-hvor", text: hvorTekst(o) }),
      o.notat ? h("p", { class: "ordre-notat", text: "«" + o.notat + "»" }) : null,
    ];
  }

  function aapenKort(o) {
    const kort = h("article", { class: "ordre kort" },
      ...kortTopp(o),
      h("p", { class: "ordre-pris" }, h("strong", { text: prisTekst(o) }), " ",
        h("span", { class: "ordre-dato", text: "· bestilt " + dato(o.opprettet) })),
      h("div", { class: "knapp-rad" },
        o.telefon ? h("a", { class: "knapp", href: "tel:" + Ved.telefonLenke(o.telefon) }, ikon("📞"), "Ring") : null,
        o.levering === true && (o.punkt || o.adresse) ? h("a", { class: "knapp", href: Ved.kartLenke(o), target: "_blank", rel: "noopener" }, ikon("🗺️"), "Kart") : null,
        h("button", { class: "knapp primar", type: "button", onclick: () => spørOmBetaling(kort, o, false) }, ikon("✔"), "Ferdig")));
    return kort;
  }

  function ubetaltKort(o) {
    const kort = h("article", { class: "ordre kort ubetalt" },
      ...kortTopp(o),
      h("p", { class: "ordre-pris" }, h("strong", { text: prisTekst(o) + " ikkje betalt" }), " ",
        h("span", { class: "ordre-dato", text: "· ferdig " + dato(o.ferdig) })),
      h("div", { class: "knapp-rad" },
        o.telefon ? h("a", { class: "knapp", href: Ved.smsLenke(o.telefon, paaminnelse(o)) }, ikon("💬"), "Minn på") : null,
        h("button", { class: "knapp primar", type: "button", onclick: () => spørOmBetaling(kort, o, true) }, ikon("✔"), "Betalt")));
    return kort;
  }

  function spørOmBetaling(kort, o, alleredeLevert) {
    const panel = h("div", { class: "sporsmal boks-gronn" },
      h("p", { class: "sporsmal-tekst", text: alleredeLevert ? "Korleis vart det betalt?" : "Har du fått betalt?" }),
      h("div", { class: "knapp-rad" },
        C.vipps ? h("button", { class: "knapp primar", type: "button", onclick: () => fullfor(o, "vipps") }, "Ja, Vipps") : null,
        h("button", { class: "knapp primar", type: "button", onclick: () => fullfor(o, "kontant") }, "Ja, kontant")),
      alleredeLevert ? null : h("button", { class: "knapp", type: "button", onclick: () => fullfor(o, null) }, "Nei, ikkje enno"),
      h("button", { class: "lenkeknapp", type: "button", onclick: hjem }, "Avbryt"));
    kort.querySelector(".knapp-rad").replaceWith(panel);
  }

  function fullfor(o, betalt) {
    const foer = kopi(o);
    const ny = kopi(o);
    const naa = new Date().toISOString();
    if (ny.status === "aapen") { ny.status = "ferdig"; ny.ferdig = naa; }
    ny.betalt = betalt;
    ny.betaltDato = betalt ? naa : null;
    erstatt(ny);
    lagreData();
    hjem();
    Ved.visMelding(betalt ? "Ferdig og betalt ✔" : "Flytta til «Ventar på betaling»",
      { tekst: "Angre", gjor: () => { erstatt(foer); lagreData(); hjem(); } });
  }

  function paaminnelse(o) {
    return "Hei " + fornavn(o.navn) + "! Takk for at du kjøpte ved. Eg ser at " + kr(o.total) +
      " ikkje er betalt enno." + (C.vipps && C.telefon ? " Du kan vippse til " + Ved.visTelefon(C.telefon) + "." : "") +
      "\nHelsing " + C.navn;
  }

  /* ---------- Ny / endre bestilling ---------- */

  function fraLenke(hash) {
    const o = Ved.paramTilOrdre(hash);
    if (!o) return hjem();
    if (finn(o.id)) {
      settTittel("Frå nettsida", true);
      vis(
        h("div", { class: "boks-gronn" }, h("p", { text: "Denne bestillinga er alt lagt inn ✔" })),
        h("a", { class: "knapp primar stor", href: "#/", style: "margin-top:16px" }, "Til framsida"));
      return;
    }
    skjemaSide(Object.assign(o, { priser: Ved.naaPriser() }), "nettside");
  }

  function skjemaSide(eksisterende, kilde) {
    const fraNettside = kilde === "nettside";
    let lagret = fraNettside ? null : eksisterende;
    settTittel(fraNettside ? "Frå nettsida" : eksisterende ? "Endre bestilling" : "Ny bestilling", true);

    const skjema = Ved.lagSkjema({ modus: "pappa", start: eksisterende || { priser: Ved.naaPriser() } });

    function lagre(bliHer) {
      const s = skjema.tilstand();
      if (!C.produkter.some((p) => s.antall[p.id] > 0)) {
        Ved.visMelding("Vel kor mange først (trykk på +).");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return null;
      }
      if (s.levering === null) {
        Ved.visMelding("Vel «Levering» eller «Hentar sjølv».");
        return null;
      }
      const b = Ved.beregn(s);
      const forrige = lagret || {};
      const ordre = {
        id: forrige.id || (eksisterende && eksisterende.id) || Ved.nyId(),
        opprettet: forrige.opprettet || new Date().toISOString(),
        kilde: forrige.kilde || (fraNettside ? "nettside" : "app"),
        navn: s.navn.trim(), telefon: s.telefon.trim(),
        antall: Object.assign({}, s.antall), priser: s.priser || Ved.naaPriser(),
        levering: s.levering,
        adresse: s.levering ? s.adresse.trim() : "", punkt: s.levering ? s.punkt : null,
        km: s.levering ? s.km : null, omtrent: s.levering ? s.omtrent : false,
        manuellFrakt: s.levering ? s.manuellFrakt : null,
        ved: b.ved, frakt: s.levering ? b.frakt : 0, total: b.total, fraktUkjent: s.levering === true && b.fraktUkjent,
        notat: s.notat.trim(),
        status: forrige.status || "aapen", ferdig: forrige.ferdig || null,
        betalt: forrige.betalt || null, betaltDato: forrige.betaltDato || null,
      };
      erstatt(ordre);
      if (!lagreData()) return null;
      sikreLagring();
      lagret = ordre;
      if (!bliHer) {
        tilbake();
        Ved.visMelding("Lagra ✔");
      }
      return ordre;
    }

    function prisMelding() {
      const s = skjema.tilstand();
      const b = Ved.beregn(s);
      const linjer = ["Hei" + (fornavn(s.navn) ? " " + fornavn(s.navn) : "") + "! Her er prisen:"];
      for (const p of C.produkter) {
        const n = s.antall[p.id];
        if (n > 0) {
          const pris = s.priser && s.priser[p.id] != null ? s.priser[p.id] : p.pris;
          linjer.push(tall(n) + " " + (n === 1 ? p.eintal : p.fleirtal) + ": " + kr(n * pris));
        }
      }
      if (s.levering) linjer.push("Levering" + (s.adresse.trim() ? " til " + s.adresse.trim() : "") + ": " + (b.fraktUkjent ? "etter avtale" : kr(b.frakt)));
      linjer.push("Totalt: " + kr(b.total) + (b.fraktUkjent ? " + frakt" : ""));
      if (!s.levering) linjer.push("Du kan hente på " + C.henteadresse + ". Gje beskjed når du kjem.");
      linjer.push("Betaling: " + (C.vipps ? "Vipps" + (C.telefon ? " til " + Ved.visTelefon(C.telefon) : "") + " eller kontant." : "kontant."));
      linjer.push("Helsing " + C.navn);
      return linjer.join("\n");
    }

    async function sendPris() {
      const ordre = lagre(true);
      if (!ordre) return;
      const tekst = prisMelding();
      if (ordre.telefon) {
        location.href = Ved.smsLenke(ordre.telefon, tekst);
        Ved.visMelding("Bestillinga er lagra. Trykk «Send» i meldingsappen.");
      } else {
        const svar = await Ved.del(tekst);
        if (svar === "kopiert") Ved.visMelding("Bestillinga er lagra og prisen er kopiert. Lim han inn i Messenger.");
        else if (svar === "delt") Ved.visMelding("Bestillinga er lagra ✔");
      }
    }

    function slett() {
      if (!confirm("Vil du slette bestillinga til " + (eksisterende.navn || "kunden") + "?")) return;
      const foer = kopi(finn(eksisterende.id) || eksisterende);
      data.ordre = data.ordre.filter((o) => o.id !== eksisterende.id);
      lagreData();
      tilbake();
      Ved.visMelding("Bestillinga er sletta", { tekst: "Angre", gjor: () => { erstatt(foer); lagreData(); rute(); } });
    }

    vis(
      fraNettside ? h("div", { class: "boks-gul", style: "margin-bottom:18px" },
        h("strong", { text: "Bestilling frå nettsida. " }), "Sjekk at alt stemmer, og trykk «Lagre» nedst.") : null,
      skjema.el,
      h("div", { class: "skjema-knapper" },
        h("button", { class: "knapp primar stor", type: "button", onclick: () => lagre(false) }, ikon("💾"), "Lagre bestillinga"),
        h("button", { class: "knapp", type: "button", onclick: sendPris }, ikon("💬"), "Send prisen til kunden"),
        h("p", { class: "hint", text: "«Send prisen» opnar SMS viss du har skrive inn telefonnummer – elles kan du velje Messenger." }),
        h("button", { class: "lenkeknapp", type: "button", onclick: tilbake }, "Avbryt")),
      eksisterende && !fraNettside ? h("button", { class: "knapp fare slett", type: "button", onclick: slett }, ikon("🗑"), "Slett bestillinga") : null,
    );
    skjema.fyllAvstand();
  }

  /* ---------- Facebook-annonse ---------- */

  function annonsetekst() {
    const eks = C.eksempler.filter((e) => e.km <= 40).map((e) => e.sted + " " + kr(Ved.leveringspris(e.km))).join(", ");
    const linjer = ["🔥 Tørr ved til sals!", ""];
    for (const p of C.produkter) linjer.push("🪵 " + p.annonse + ": " + kr(p.pris));
    linjer.push("",
      "🚚 Levering i Naustdal og Førde – frakt etter avstand" + (eks ? " (" + eks + ")" : "") + ". Andre stader etter avtale.",
      "🏠 Eller hent sjølv i Naustdal.",
      "💳 " + (C.vipps ? "Vipps eller kontant." : "Kontant."), "");
    if (C.telefon) linjer.push("📱 Send SMS eller ring " + Ved.visTelefon(C.telefon));
    linjer.push("👉 Rekn ut prisen og bestill her: " + nettside());
    return linjer.join("\n");
  }

  function facebookSide() {
    settTittel("Facebook-annonse", true);
    const felt = h("textarea", { class: "felt annonse", value: annonsetekst(), "aria-label": "Annonsetekst" });
    vis(h("div", { class: "stabel" },
      h("p", { text: "Her er ein ferdig annonse. Du kan endre teksten før du kopierer han." }),
      felt,
      h("button", { class: "knapp primar stor", type: "button", onclick: async () => {
        const ok = await Ved.kopier(felt.value);
        Ved.visMelding(ok ? "Kopiert! Opne Facebook, hald fingeren i tekstfeltet og vel «Lim inn»." : "Klarte ikkje å kopiere.");
      } }, ikon("📋"), "Kopier teksten"),
      h("button", { class: "knapp", type: "button", onclick: () => Ved.del(felt.value) }, ikon("↗"), "Del …"),
      h("p", { class: "boks-gronn", text: "Tips: Legg ved eit bilete av veden, og legg annonsen ut på nytt når det blir kaldt." })));
  }

  /* ---------- Oversikt over salet ---------- */

  function oppsummer(liste) {
    const sum = { antall: liste.length, total: 0, ved: 0, frakt: 0 };
    for (const p of C.produkter) sum[p.id] = 0;
    for (const o of liste) {
      sum.total += o.total || 0;
      sum.ved += o.ved || 0;
      sum.frakt += o.frakt || 0;
      for (const p of C.produkter) sum[p.id] += (o.antall && o.antall[p.id]) || 0;
    }
    return sum;
  }

  function oversiktSide(aar) {
    settTittel("Sal", true);
    const ferdige = data.ordre.filter((o) => o.status === "ferdig" && o.ferdig);
    const iAar = ferdige.filter((o) => new Date(o.ferdig).getFullYear() === aar);
    const sum = oppsummer(iAar);
    const ettAarSiden = Date.now() - 365 * 24 * 3600 * 1000;
    const siste12 = oppsummer(ferdige.filter((o) => new Date(o.ferdig).getTime() >= ettAarSiden)).total;
    const ubetalt = oppsummer(ferdige.filter((o) => !o.betalt));

    const boks = (stort, navn, bred) => h("div", { class: "tall-boks" + (bred ? " bred" : "") },
      h("div", { class: "tall-stort", text: stort }), h("div", { class: "tall-navn", text: navn }));

    const maaneder = [];
    for (let m = 0; m < 12; m++) {
      const liste = iAar.filter((o) => new Date(o.ferdig).getMonth() === m);
      if (liste.length) maaneder.push([stor(new Date(aar, m, 1).toLocaleDateString("nn-NO", { month: "long" })), oppsummer(liste)]);
    }

    const andel = Math.min(100, Math.round((siste12 / MVA_GRENSE) * 100));
    const mvaBoks = h("div", { class: siste12 >= 40000 ? "boks-gul" : "kort" },
      h("strong", { text: "Siste 12 månader: " + kr(siste12) }),
      h("div", { class: "fremdrift", role: "img", "aria-label": andel + " prosent av grensa" }, h("div", { style: "width:" + andel + "%" })),
      h("p", { class: "hint", style: "margin:0", text: siste12 >= 40000
        ? "Du nærmar deg 50 000 kr. Over grensa må du registrere deg for moms (MVA). Snakk med Benjamin."
        : "Grensa for moms (MVA) er 50 000 kr i løpet av 12 månader." }));

    const delTekst = () => [
      "Vedsal " + aar + " (" + C.navn + ")",
      "Bestillingar: " + sum.antall,
      ...C.produkter.map((p) => stor(p.fleirtal) + ": " + tall(sum[p.id])),
      "Ved: " + kr(sum.ved), "Frakt: " + kr(sum.frakt), "Totalt: " + kr(sum.total),
      "", ...maaneder.map(([navn, s]) => navn + ": " + kr(s.total) + " (" + s.antall + " best.)"),
      "", "Ikkje betalt no: " + kr(ubetalt.total),
    ].join("\n");

    vis(
      h("div", { class: "aar-velger" },
        h("a", { class: "knapp", href: "#/oversikt/" + (aar - 1), "aria-label": "Året før" }, "‹"),
        h("span", { text: String(aar) }),
        h("a", { class: "knapp", href: "#/oversikt/" + (aar + 1), "aria-label": "Året etter" }, "›")),
      h("div", { class: "tall-rute" },
        boks(kr(sum.total), "selt for i " + aar + " (ferdige bestillingar)", true),
        ...C.produkter.map((p) => boks(tall(sum[p.id]), p.fleirtal)),
        boks(String(sum.antall), "bestillingar"),
        boks(kr(sum.frakt), "av dette frakt", (C.produkter.length + 1) % 2 === 0),
        ubetalt.total ? boks(kr(ubetalt.total), "ikkje betalt enno", true) : null),
      maaneder.length ? h("table", { class: "maaned-tabell" },
        h("tr", {}, h("th", { text: "Månad" }), h("th", { text: "Selt" })),
        ...maaneder.map(([navn, s]) => h("tr", {}, h("td", { text: navn + " (" + s.antall + ")" }), h("td", { text: kr(s.total) }))))
        : h("p", { class: "tom", text: "Ingen ferdige bestillingar i " + aar + "." }),
      h("div", { style: "margin-top:18px" }, mvaBoks),
      h("div", { class: "stabel", style: "margin-top:18px" },
        h("button", { class: "knapp", type: "button", onclick: () => Ved.del(delTekst()) }, ikon("📤"), "Send oversikta (t.d. til Benjamin)"),
        h("a", { class: "lenkeknapp", href: "#/benjamin" }, "Tryggingskopi og innstillingar")),
    );
  }

  /* ---------- Tryggingskopi (for Benjamin) ---------- */

  function benjaminSide() {
    settTittel("Tryggingskopi", true);
    const filnavn = "vedsal-" + new Date().toISOString().slice(0, 10) + ".json";
    const json = () => JSON.stringify({ app: "vedsal", versjon: VERSJON, laget: new Date().toISOString(), ordre: data.ordre }, null, 1);
    const status = h("p", { class: "hint" });
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((ja) => {
        status.textContent = ja ? "Lagringa er sikra på telefonen ✔" : "Lagringa er ikkje sikra enno (skjer når appen ligg på startskjermen).";
      });
    }

    const velgFil = h("input", { type: "file", accept: ".json,application/json", hidden: true });
    velgFil.addEventListener("change", async () => {
      const fil = velgFil.files[0];
      if (!fil) return;
      try {
        const inn = JSON.parse(await fil.text());
        if (!inn || !Array.isArray(inn.ordre)) throw new Error("feil format");
        const nye = inn.ordre.filter((o) => o && o.id && o.antall);
        if (!confirm("Hente inn " + nye.length + " bestillingar frå tryggingskopien? Like bestillingar blir bytte ut.")) return;
        nye.forEach(erstatt);
        lagreData();
        Ved.visMelding("Henta inn " + nye.length + " bestillingar ✔");
      } catch (e) {
        Ved.visMelding("Fila kunne ikkje lesast.");
      }
    });

    vis(h("div", { class: "stabel" },
      h("p", { text: "Alt i Vedsal ligg berre på denne telefonen. Send ein tryggingskopi til Benjamin av og til." }),
      h("p", { class: "hint", text: data.ordre.length + " bestillingar lagra · versjon " + VERSJON }),
      status,
      h("button", { class: "knapp primar", type: "button", onclick: async () => {
        const fil = new File([json()], filnavn, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [fil] })) {
          try { await navigator.share({ files: [fil], title: filnavn }); return; } catch (e) { if (e.name === "AbortError") return; }
        }
        const a = h("a", { href: URL.createObjectURL(fil), download: filnavn });
        document.body.append(a);
        a.click();
        a.remove();
        Ved.visMelding("Tryggingskopien er lasta ned.");
      } }, ikon("📤"), "Send tryggingskopi"),
      h("button", { class: "knapp", type: "button", onclick: () => velgFil.click() }, ikon("📥"), "Hent inn tryggingskopi"),
      velgFil,
      h("button", { class: "knapp fare", type: "button", style: "margin-top:30px", onclick: () => {
        if (!confirm("Slette ALLE bestillingar på denne telefonen?")) return;
        if (!confirm("Er du heilt sikker? Dette kan ikkje angrast.")) return;
        data = { ordre: [] };
        lagreData();
        location.replace("#/");
      } }, ikon("🗑"), "Slett alle data")));
  }

  /* ---------- Start ---------- */

  ryddGamle();
  rute();
  Ved.registrerOffline();
})();
