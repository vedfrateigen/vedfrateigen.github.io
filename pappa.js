// © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
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
      Ved.visMelding("⚠️ Klarte ikkje å lagre. Ring Benjamin (913 47 058).");
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

  // Ny bestilling som ikke er lagret ennå. Overlever Android-tilbakeknappen og at appen lukkes.
  const UTKAST = "vedsalg.utkast";
  function lesUtkast() {
    try { return JSON.parse(localStorage.getItem(UTKAST)); } catch (e) { return null; }
  }
  function lagreUtkast(u) {
    try { localStorage.setItem(UTKAST, JSON.stringify(u)); } catch (e) { /* ikke kritisk */ }
  }
  function slettUtkast() {
    try { localStorage.removeItem(UTKAST); } catch (e) { /* ikke kritisk */ }
  }

  const finn = (id) => data.ordre.find((o) => o.id === id);

  function tidlegareKundar() {
    const sett = new Set();
    return data.ordre
      .filter((o) => o.navn && !o.anonym)
      .sort((a, b) => b.opprettet.localeCompare(a.opprettet))
      .filter((o) => {
        const nokkel = o.navn.toLowerCase() + "|" + Ved.telefonLenke(o.telefon || "");
        if (sett.has(nokkel)) return false;
        sett.add(nokkel);
        return true;
      })
      .map((o) => ({ navn: o.navn, telefon: o.telefon, levering: o.levering, adresse: o.adresse, punkt: o.punkt, km: o.km, omtrent: o.omtrent }));
  }
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
  // Fast adresse frå config.js, så lenkja i annonsen er rett same kvar appen er opna frå.
  const nettside = () => C.nettside || new URL("./", location.href).href;
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
    if (side === "utkast") return fortsettUtkast();
    if (side === "endre" && finn(id)) return skjemaSide(finn(id));
    if (side === "endre") {
      hjem();
      Ved.visMelding("Bestillinga finst ikkje lenger.");
      return;
    }
    if (side === "facebook") return facebookSide();
    if (side === "oversikt") return oversiktSide(Number(id) || new Date().getFullYear());
    if (side === "benjamin") return benjaminSide();
    if (side === "paaminning") return paaminningSide();
    return hjem();
  }
  const paaFramsida = () => !location.hash || location.hash === "#/";
  window.addEventListener("hashchange", () => {
    harNavigert = true;
    Ved.skjulMelding();
    // Ny versjon publisert mens appen var open: last inn på nytt når pappa er tilbake på framsida.
    if (Ved.oppdatering.venter && paaFramsida()) return location.reload();
    rute();
  });

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

    const utkast = lesUtkast();
    const ventarPaaminning = paaminningsKundar().filter((k) => k.klar).length;
    const d = new Date();
    const iSesong = (d.getMonth() === 7 && d.getDate() >= 15) || d.getMonth() === 8 || d.getMonth() === 9;
    const kopiGammal = data.ordre.length >= 5 &&
      (!data.sistKopi || Date.now() - new Date(data.sistKopi).getTime() > 30 * 24 * 3600 * 1000);

    vis(
      installKnapp(),
      utkast ? h("div", { class: "boks-gul", style: "margin-bottom:14px" },
        h("p", { style: "margin:0 0 10px" }, h("strong", { text: "Du har ei bestilling som ikkje er lagra" }),
          utkast.s && utkast.s.navn ? " (" + utkast.s.navn + ")" : "", "."),
        h("div", { class: "knapp-rad" },
          h("a", { class: "knapp primar", href: "#/utkast" }, "Hald fram"),
          h("button", { class: "knapp", type: "button", onclick: () => {
            if (!confirm("Kaste bestillinga som ikkje er lagra?")) return;
            slettUtkast();
            hjem();
          } }, "Kast"))) : null,
      h("a", { class: "knapp primar stor", href: "#/ny" }, ikon("＋"), "Ny bestilling"),
      seksjon("Skal leverast eller hentast", aapne, aapenKort,
        "Ingen bestillingar no. Når nokon vil kjøpe ved, trykkjer du «Ny bestilling»."),
      ubetalte.length ? seksjon("Ventar på betaling", ubetalte, ubetaltKort) : null,
      iSesong && ventarPaaminning ? h("div", { class: "boks-gul", style: "margin-top:24px" },
        h("p", { style: "margin:0 0 10px" }, h("strong", { text: ventarPaaminning + " kundar" }),
          " har bede om ein SMS når det er tid for ved. No er det tid!"),
        h("a", { class: "knapp primar", href: "#/paaminning" }, ikon("💬"), "Send påminningar")) : null,
      kopiGammal ? h("div", { class: "boks-gronn", style: "margin-top:24px" },
        h("p", { style: "margin:0 0 10px", text: "Det er lenge sidan du sende tryggingskopi til Benjamin." }),
        h("button", { class: "knapp", type: "button", onclick: sendKopi }, ikon("📤"), "Send tryggingskopi no")) : null,
      h("div", { class: "knapp-rad hjem-meny" },
        h("a", { class: "knapp", href: "#/facebook" }, ikon("📣"), "Facebook-annonse"),
        h("a", { class: "knapp", href: "#/oversikt" }, ikon("📊"), "Sal i år")),
      ferdige.length ? h("details", { class: "ferdige" },
        h("summary", { text: "Ferdige og betalte (" + ferdige.length + ")" }),
        ferdige.slice(0, 30).map((o) => h("div", { class: "ferdig-rad" },
          h("span", { text: dato(o.ferdig) + " · " + (o.navn || "Kunde") + " · " + Ved.beskrivAntall(o.antall, Ved.gratisFor(o)) + " · " + kr(o.total) + (o.betalt === "vipps" ? " · Vipps" : " · kontant") }),
          o.anonym ? null : h("span", { class: "ferdig-lenker" },
            o.telefon ? h("a", { class: "lenkeknapp", href: Ved.smsLenke(o.telefon, kvittering(o)) }, "Kvittering") : null,
            h("a", { class: "lenkeknapp", href: "#/endre/" + o.id }, "Endre"))))) : null,
    );
  }

  function kortTopp(o) {
    return [
      h("div", { class: "ordre-topp" },
        h("h3", { class: "ordre-navn", text: o.navn || "Kunde utan namn" }),
        h("a", { class: "lenkeknapp", href: "#/endre/" + o.id }, "Endre")),
      h("p", { class: "ordre-hva", text: Ved.beskrivAntall(o.antall, Ved.gratisFor(o)) }),
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
    // Et raskt dobbelttrykk på «Ferdig» skal ikke treffe «Ja, …» ved et uhell.
    panel.style.pointerEvents = "none";
    setTimeout(() => { panel.style.pointerEvents = ""; }, 400);
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
    if (!lagreData()) { erstatt(foer); return; }
    hjem();
    Ved.visMelding(betalt ? "Ferdig og betalt ✔" : "Flytta til «Ventar på betaling»",
      { tekst: "Angre", gjor: () => { erstatt(foer); if (lagreData()) hjem(); } });
  }

  function kvittering(o) {
    return "Kvittering frå " + C.navn + "\n" + Ved.beskrivAntall(o.antall, Ved.gratisFor(o)) + (o.levering ? " (med levering)" : "") +
      "\nBetalt: " + kr(o.total) + " med " + (o.betalt === "vipps" ? "Vipps" : "kontant") + " " +
      new Date(o.betaltDato || o.ferdig).toLocaleDateString("nn-NO") +
      "\nTakk for handelen!\nHelsing " + C.selgerFornavn + ", " + C.navn;
  }

  function paaminnelse(o) {
    return "Hei " + fornavn(o.navn) + "! Takk for at du kjøpte ved. Eg ser at " + kr(o.total) +
      " ikkje er betalt enno." + (C.vipps && C.telefon ? " Du kan vippse til " + Ved.visTelefon(C.telefon) + "." : "") +
      "\nHelsing " + C.selgerFornavn + ", " + C.navn;
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
    skjemaSide(Object.assign(o, { priser: Ved.naaPriser(), rabatt: C.rabatt, tilbod: Ved.tilbodNaa() }), "nettside");
  }

  function fortsettUtkast() {
    const u = lesUtkast();
    if (!u || !u.s) return hjem();
    skjemaSide(u.id ? Object.assign({}, u.s, { id: u.id }) : null, u.kilde, u.s);
  }

  // Finnes det alt ei open bestilling frå same telefonnummer? (Kanskje pappa la ho inn etter ein telefon.)
  function kanskjeSame(o) {
    if (!o.telefon) return null;
    const nr = Ved.telefonLenke(o.telefon);
    return data.ordre.find((x) => x.status === "aapen" && x.id !== o.id && x.telefon && Ved.telefonLenke(x.telefon) === nr) || null;
  }

  function skjemaSide(eksisterende, kilde, fraUtkast) {
    const fraNettside = kilde === "nettside";
    let lagret = fraNettside ? null : eksisterende;
    const redigerer = Boolean(eksisterende) && !fraNettside;
    let endra = Boolean(fraUtkast);
    settTittel(fraNettside ? "Frå nettsida" : redigerer ? "Endre bestilling" : "Ny bestilling", true);

    const skjema = Ved.lagSkjema({
      modus: "pappa",
      kundar: redigerer || fraNettside ? [] : tidlegareKundar(),
      start: fraUtkast || eksisterende || { priser: Ved.naaPriser(), rabatt: C.rabatt, tilbod: Ved.tilbodNaa() },
      vedEndring: (s) => {
        endra = true;
        if (!redigerer && !lagret) lagreUtkast({ s, kilde, id: fraNettside ? eksisterende.id : null, tid: Date.now() });
      },
    });

    // betaltNo: "vipps"/"kontant" når kunden er der og har betalt med ein gong (hurtigsal).
    function lagre(bliHer, betaltNo) {
      if (betaltNo && skjema.tilstand().levering === null) skjema.settLevering(false);
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
        kilde: forrige.kilde || (fraNettside ? "nettside" : betaltNo ? "innom" : "app"),
        navn: s.navn.trim(), telefon: s.telefon.trim(),
        antall: Object.assign({}, s.antall), priser: s.priser || Ved.naaPriser(), rabatt: Ved.rabattFor(s),
        tilbod: Ved.tilbodFor(s), gratis: Ved.gratisFor(s),
        levering: s.levering,
        adresse: s.levering ? s.adresse.trim() : "", punkt: s.levering ? s.punkt : null,
        km: s.levering ? s.km : null, omtrent: s.levering ? s.omtrent : false,
        manuellFrakt: s.levering ? s.manuellFrakt : null, manuellTotal: s.manuellTotal != null ? s.manuellTotal : null,
        ved: b.ved, frakt: s.levering ? b.frakt : 0, total: b.total, fraktUkjent: s.levering === true && b.fraktUkjent,
        notat: s.notat.trim(),
        paaminning: Boolean(s.paaminning),
        samtykkeDato: s.paaminning ? (forrige.samtykkeDato || new Date().toISOString()) : null,
        status: forrige.status || "aapen", ferdig: forrige.ferdig || null,
        betalt: forrige.betalt || null, betaltDato: forrige.betaltDato || null,
      };
      const nyOrdre = !forrige.id;
      if (betaltNo) {
        const naa = new Date().toISOString();
        Object.assign(ordre, { status: "ferdig", ferdig: ordre.ferdig || naa, betalt: betaltNo, betaltDato: naa });
      }
      erstatt(ordre);
      if (!lagreData()) return null;
      sikreLagring();
      slettUtkast();
      lagret = ordre;
      if (!bliHer) {
        tilbake();
        if (betaltNo && nyOrdre) {
          Ved.visMelding("Selt og betalt ✔", { tekst: "Angre", gjor: () => {
            data.ordre = data.ordre.filter((o) => o.id !== ordre.id);
            if (lagreData()) hjem();
          } });
        } else {
          Ved.visMelding(betaltNo ? "Selt og betalt ✔" : "Lagra ✔");
        }
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
          const pris = Ved.einingspris(p, s.antall, s.priser, Ved.rabattFor(s));
          const rabatt = Ved.harRabatt(p, s.antall, Ved.rabattFor(s)) ? " (rabattpris " + kr(pris) + " per " + p.eining + ")" : "";
          linjer.push(tall(n) + " " + (n === 1 ? p.eintal : p.fleirtal) + ": " + kr(n * pris) + rabatt);
        }
      }
      const gratis = Ved.gratisFor(s);
      for (const p of C.produkter) {
        if (gratis[p.id] > 0) linjer.push(tall(gratis[p.id]) + " " + (gratis[p.id] === 1 ? p.eintal : p.fleirtal) + ": gratis (tilbod)");
      }
      if (s.levering) linjer.push("Levering" + (s.adresse.trim() ? " til " + s.adresse.trim() : "") + ": " + (b.fraktUkjent ? "etter avtale" : kr(b.frakt)));
      linjer.push("Totalt: " + kr(b.total) + (b.fraktUkjent ? " + frakt" : ""));
      if (!s.levering) linjer.push("Du kan hente på " + C.henteadresse + ". Gje beskjed når du kjem.");
      linjer.push("Betaling: " + (C.vipps ? "Vipps" + (C.telefon ? " til " + Ved.visTelefon(C.telefon) : "") + " eller kontant." : "kontant."));
      linjer.push("Helsing " + C.selgerFornavn + ", " + C.navn);
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
      if (!lagreData()) { erstatt(foer); return; }
      tilbake();
      Ved.visMelding("Bestillinga er sletta", { tekst: "Angre", gjor: () => { erstatt(foer); if (lagreData()) rute(); } });
    }

    const same = fraNettside ? kanskjeSame(eksisterende) : null;
    vis(
      fraNettside ? h("div", { class: "boks-gul", style: "margin-bottom:18px" },
        h("strong", { text: "Bestilling frå nettsida. " }), "Sjekk at alt stemmer, og trykk «Lagre bestillinga» nedst.",
        same ? h("p", { style: "margin:10px 0 0" }, h("strong", { text: "Obs: " }),
          "Du har alt ei open bestilling frå same telefonnummer (" + (same.navn || "utan namn") +
          "). Er det same bestillinga, trykk «Avbryt».") : null) : null,
      skjema.el,
      h("div", { class: "skjema-knapper" },
        h("button", { class: "knapp primar stor", type: "button", onclick: () => lagre(false) }, ikon("💾"), "Lagre bestillinga"),
        h("button", { class: "knapp", type: "button", onclick: sendPris }, ikon("💬"), "Send prisen til kunden"),
        h("p", { class: "hint", text: "Har du skrive telefonnummeret, opnar det seg ein ferdig SMS. Elles kan du velje Messenger." }),
        !redigerer ? h("div", { class: "boks-gronn stabel" },
          h("p", { style: "margin:0" }, h("strong", { text: "Er kunden her og har betalt med ein gong?" })),
          h("div", { class: "knapp-rad" },
            C.vipps ? h("button", { class: "knapp", type: "button", onclick: () => lagre(false, "vipps") }, "Betalt med Vipps") : null,
            h("button", { class: "knapp", type: "button", onclick: () => lagre(false, "kontant") }, "Betalt kontant"))) : null,
        h("button", { class: "lenkeknapp", type: "button", onclick: () => {
          if (endra && !redigerer && !lagret && !confirm("Vil du kaste det du har skrive?")) return;
          if (!redigerer) slettUtkast();
          tilbake();
        } }, "Avbryt")),
      eksisterende && !fraNettside ? h("button", { class: "knapp fare slett", type: "button", onclick: slett }, ikon("🗑"), "Slett bestillinga") : null,
    );
    skjema.fyllAvstand();
  }

  /* ---------- Facebook-annonse ---------- */

  // «bjørkeved og granved» – berre det som ikkje er utselt.
  function vedtypar() {
    const typar = C.produkter.filter((p) => !(C.utselt || []).includes(p.id)).map((p) => p.vedtype).filter(Boolean);
    return [...new Set(typar)].join(" og ") || "ved";
  }

  // Kort annonse med lenkja – limast inn éin gong. Facebook lagar sjølv eit bilete med prisane frå lenkja (og-bilde.jpg).
  // Eigne bilete er tekne bort med vilje: eit delt bilete blir eit innlegg utan klikkbar lenkje.
  function facebookTekst() {
    const linjer = ["🔥 Tørr " + vedtypar() + " til sals frå Naustdal!"];
    // Prisane i sjølve teksten – fleire vedgrupper krev det («pris, stad, type ved og mengde»).
    const vare = (id) => C.produkter.find((p) => p.id === id && !(C.utselt || []).includes(p.id));
    const sekk = [vare("sekk") && "bjørk " + kr(vare("sekk").pris), vare("gran") && "gran " + kr(vare("gran").pris)].filter(Boolean);
    const prisar = ((sekk.length ? sekk.join(" og ") + " per 60 l sekk (30 cm). " : "") +
      (vare("m3") ? "Stabla kubikk bjørk " + kr(vare("m3").pris) + " per m³." : "")).trim();
    if (prisar) linjer.push("💰 " + prisar.charAt(0).toUpperCase() + prisar.slice(1));
    if (Ved.tilbodTekst(true)) linjer.push("🎁 " + Ved.tilbodTekst(true) + ".");
    linjer.push("🚚 Levering i Naustdal, Førde og Florø – eller hent sjølv i Naustdal. Andre stader? Ta kontakt.");
    linjer.push("👉 Prisar og bestilling: " + nettside().replace(/\/$/, ""));
    linjer.push("📞 Eller ring meg på " + Ved.visTelefon(C.telefon)); // pappa legg ut frå sin eigen konto
    return linjer.join("\n");
  }

  function facebookSide() {
    settTittel("Facebook-annonse", true);
    const tekst = facebookTekst();
    const steg = (nr, ...innhald) => h("div", { class: "fb-steg" },
      h("span", { class: "steg-nr", "aria-hidden": "true" }, String(nr)), h("div", {}, ...innhald));
    const ikkje = (t) => h("p", { style: "margin:0 0 4px", text: "✗ " + t });

    vis(h("div", { class: "stabel" },
      h("p", { text: "Slik legg du ut annonsen i ei Facebook-gruppe. Gjer stega i rekkjefølgje." }),
      steg(1, h("button", { class: "knapp primar stor", type: "button", onclick: async () => {
        const ok = await Ved.kopier(tekst);
        Ved.visMelding(ok ? "Kopiert ✔ Gå vidare til steg 2." : "Klarte ikkje å kopiere – prøv igjen.");
      } }, ikon("📋"), "Kopier annonsen"),
        h("p", { class: "hint", text: "Dette blir kopiert:" }),
        h("p", { class: "annonse-tekst", text: tekst })),
      steg(2, h("p", {}, "Opne ", h("strong", { text: "Facebook" }), " og gå inn i gruppa (t.d. ei kjøp-og-sal-gruppe for Førde eller Naustdal). Trykk på ",
        h("strong", { text: "skrivefeltet øvst" }), " (der det står «Skriv noe …»). ", h("strong", { text: "Ikkje vel «Selg noe»." }))),
      steg(3, h("p", {}, "Er det alt tekst i feltet, tøm det først. ", h("strong", { text: "Hald fingeren" }),
        " i det tomme feltet til det kjem opp «Lim inn». Trykk ", h("strong", { text: "«Lim inn» éin gong" }), ".")),
      steg(4, h("p", {}, "Vent nokre sekund – då kjem eit ", h("strong", { text: "bilete av veden med prisane" }), " under teksten. Trykk ",
        h("strong", { text: "«Publiser»" }), ". Ferdig!"),
        h("p", { class: "hint", text: "Kjem det ikkje noko bilete? Det er greitt – lenkja verkar likevel. " +
          "Står det at innlegget ventar på godkjenning, er alt i orden. Ikkje legg det ut på nytt." })),
      h("div", { class: "boks-gul" },
        h("p", { style: "margin:0 0 6px" }, h("strong", { text: "Ikkje gjer dette:" })),
        ikkje("Ikkje ta skjermbilde av annonsen – då kan ikkje folk trykke på lenkja."),
        ikkje("Ikkje trykk «Lim inn» fleire gonger."),
        ikkje("Ikkje vel «Selg noe» – der verkar ikkje lenkja."),
        ikkje("Ikkje legg ut i meir enn 2–3 grupper same dag – då kan Facebook stoppe innlegga."),
        h("p", { style: "margin:8px 0 0", text: "Kom teksten dobbelt? Hald inne sletteknappen på tastaturet (pila med kryss i, til høgre) " +
          "til feltet er heilt tomt. Lim så inn éin gong." }))));
  }

  /* ---------- Oversikt over salet ---------- */

  function oppsummer(liste) {
    const sum = { antall: liste.length, total: 0, ved: 0, frakt: 0, gratis: {} };
    for (const p of C.produkter) { sum[p.id] = 0; sum.gratis[p.id] = 0; }
    for (const o of liste) {
      sum.total += o.total || 0;
      sum.ved += o.ved || 0;
      sum.frakt += o.frakt || 0;
      for (const p of C.produkter) sum[p.id] += (o.antall && o.antall[p.id]) || 0;
      const g = o.gratis || Ved.gratisFor(o);
      for (const p of C.produkter) sum.gratis[p.id] += g[p.id] || 0;
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

    const fra = (k) => iAar.filter((o) => (o.kilde || "app") === k).length;
    const kjelder = "Frå nettsida: " + fra("nettside") + " · Telefon, Facebook o.l.: " + fra("app") + " · Kjøpt på staden: " + fra("innom");
    const antalPaaminning = paaminningsKundar().length;
    const gittBort = C.produkter.filter((p) => sum.gratis[p.id] > 0)
      .map((p) => tall(sum.gratis[p.id]) + " " + (sum.gratis[p.id] === 1 ? p.eintal : p.fleirtal)).join(" og ");

    const delTekst = () => [
      "Vedsal " + aar + " (" + C.navn + ")",
      "Bestillingar: " + sum.antall,
      ...C.produkter.map((p) => stor(p.fleirtal) + ": " + tall(sum[p.id])),
      "Ved: " + kr(sum.ved), "Frakt: " + kr(sum.frakt), "Totalt: " + kr(sum.total),
      "", ...maaneder.map(([navn, s]) => navn + ": " + kr(s.total) + " (" + s.antall + " best.)"),
      "", "Ikkje betalt no: " + kr(ubetalt.total),
      kjelder,
      ...(gittBort ? ["Gitt bort i tilbodet: " + gittBort] : []),
      "Kundar som vil ha påminning neste haust: " + antalPaaminning,
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
      iAar.length ? h("p", { class: "hint", style: "margin-top:12px", text: "Kvar kom bestillingane frå? " + kjelder }) : null,
      gittBort ? h("p", { class: "hint", text: "Gitt bort i tilbodet: " + gittBort + "." }) : null,
      h("div", { style: "margin-top:18px" }, mvaBoks),
      h("div", { class: "stabel", style: "margin-top:18px" },
        h("a", { class: "knapp", href: "#/paaminning" }, ikon("💬"), "Påminning neste haust (" + antalPaaminning + " kundar)"),
        h("button", { class: "knapp", type: "button", onclick: () => Ved.del(delTekst()) }, ikon("📤"), "Send oversikta til Benjamin"),
        h("a", { class: "lenkeknapp", href: "#/benjamin" }, "Tryggingskopi og innstillingar")),
    );
  }

  /* ---------- Påminning neste haust (berre kundar som har sagt ja) ---------- */

  // Éin rad per kunde (telefonnummer) som har sagt ja og ikkje har meldt seg av.
  function paaminningsKundar() {
    const aar = new Date().getFullYear();
    const perNr = new Map();
    for (const o of data.ordre) {
      if (!o.telefon || o.anonym) continue;
      const nr = Ved.telefonLenke(o.telefon);
      const k = perNr.get(nr) || { nr, telefon: o.telefon, navn: o.navn, ja: false, nei: false, sendt: null, sist: "" };
      if (o.paaminning) k.ja = true;
      if (o.opprettet > k.sist) k.sist = o.opprettet;
      if (o.paaminningNei) k.nei = true;
      if (o.paaminningSendt && (!k.sendt || o.paaminningSendt > k.sendt)) k.sendt = o.paaminningSendt;
      if (o.navn) k.navn = o.navn;
      perNr.set(nr, k);
    }
    // Har kunden handla dei siste 150 dagane, har han alt fått ved denne sesongen – vent til neste haust.
    const nyleg = Date.now() - 150 * 24 * 3600 * 1000;
    return [...perNr.values()].filter((k) => k.ja && !k.nei)
      .map((k) => Object.assign(k, {
        sendtIAar: Boolean(k.sendt) && new Date(k.sendt).getFullYear() === aar,
        handlaNyleg: Boolean(k.sist) && new Date(k.sist).getTime() > nyleg,
      }))
      .map((k) => Object.assign(k, { klar: !k.sendtIAar && !k.handlaNyleg }))
      .sort((a, b) => (b.klar - a.klar) || (a.navn || "").localeCompare(b.navn || "", "nn"));
  }

  function merkKunde(nr, felt, verdi) {
    for (const o of data.ordre) if (o.telefon && Ved.telefonLenke(o.telefon) === nr) o[felt] = verdi;
    return lagreData();
  }

  function paaminningsTekst(k) {
    const bjork = C.produkter[0];
    const pris = (C.utselt || []).includes(bjork.id) ? "" : " – bjørk " + kr(bjork.pris) + " per 60 l sekk";
    const tilbod = Ved.tilbodTekst(true) ? ". " + Ved.tilbodTekst(true) : "";
    return "Hei " + fornavn(k.navn) + "! Det nærmar seg fyringssesongen. Eg har tørr " + vedtypar() + " klar" + pris + tilbod +
      ".\nBestill her: " + nettside() +
      " – eller berre svar på denne SMS-en.\nVil du ikkje ha fleire påminningar, svar NEI.\nHelsing " + C.selgerFornavn + ", " + C.navn;
  }

  function paaminningSide() {
    settTittel("Påminning", true);
    const kundar = paaminningsKundar();
    vis(h("div", { class: "stabel" },
      h("p", { text: "Desse kundane har sagt ja til ein SMS når det er tid for ved. Trykk «Send», så opnar det seg ein ferdig SMS." }),
      kundar.length ? kundar.map((k) => h("article", { class: "ordre kort" },
        h("div", { class: "ordre-topp" },
          h("h3", { class: "ordre-navn", text: k.navn || "Kunde" }),
          h("span", { class: "ordre-dato", text: Ved.visTelefon(k.telefon) })),
        h("p", { class: "hint", text: k.sendtIAar ? "Sendt " + dato(k.sendt) + " ✔"
          : k.handlaNyleg ? "Handla " + dato(k.sist) + " – vent til neste haust" : "Klar for påminning" }),
        h("div", { class: "knapp-rad" },
          h("a", { class: "knapp primar", href: Ved.smsLenke(k.telefon, paaminningsTekst(k)),
            onclick: () => { merkKunde(k.nr, "paaminningSendt", new Date().toISOString()); setTimeout(paaminningSide, 800); } },
            ikon("💬"), k.sendtIAar ? "Send igjen" : "Send"),
          h("button", { class: "knapp", type: "button", onclick: () => {
            if (!confirm((k.navn || "Kunden") + " vil ikkje ha fleire påminningar?")) return;
            if (merkKunde(k.nr, "paaminningNei", true)) { Ved.visMelding("Teke bort ✔"); paaminningSide(); }
          } }, "Vil ikkje ha")))) : h("p", { class: "tom", text: "Ingen kundar har bede om påminning enno. Kryss av for «påminning neste haust» når kunden seier ja." }),
      h("p", { class: "boks-gronn", text: "Send berre til dei som har sagt ja. Svarar nokon NEI, trykk «Vil ikkje ha» – då får dei ikkje fleire." })));
  }

  /* ---------- Tryggingskopi (for Benjamin) ---------- */

  async function sendKopi() {
    const filnavn = "vedsal-" + new Date().toISOString().slice(0, 10) + ".json";
    const json = JSON.stringify({ app: "vedsal", versjon: VERSJON, laget: new Date().toISOString(), ordre: data.ordre }, null, 1);
    const fil = new File([json], filnavn, { type: "application/json" });
    const ferdig = () => {
      data.sistKopi = new Date().toISOString();
      lagreData();
      if (paaFramsida()) hjem();
    };
    if (navigator.canShare && navigator.canShare({ files: [fil] })) {
      try {
        await navigator.share({ files: [fil], title: filnavn });
        ferdig();
        Ved.visMelding("Tryggingskopien er send ✔");
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    const a = h("a", { href: URL.createObjectURL(fil), download: filnavn });
    document.body.append(a);
    a.click();
    a.remove();
    ferdig();
    Ved.visMelding("Tryggingskopien er lasta ned.");
  }

  function benjaminSide() {
    settTittel("Tryggingskopi", true);
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
        const foer = kopi(data);
        nye.forEach(erstatt);
        if (!lagreData()) { data = foer; return; }
        Ved.visMelding("Henta inn " + nye.length + " bestillingar ✔");
      } catch (e) {
        Ved.visMelding("Fila kunne ikkje lesast.");
      }
    });

    vis(h("div", { class: "stabel" },
      h("p", { text: "Alt i Vedsal ligg berre på denne telefonen. Send ein tryggingskopi til Benjamin av og til." }),
      h("p", { class: "hint", text: data.ordre.length + " bestillingar lagra · Vedsal versjon " + VERSJON + " · © 2026 Benjamin Bruflot Teigen · 913 47 058" }),
      status,
      h("p", { class: "hint", text: "Sist send: " + (data.sistKopi ? new Date(data.sistKopi).toLocaleDateString("nn-NO") : "aldri") }),
      h("button", { class: "knapp primar", type: "button", onclick: sendKopi }, ikon("📤"), "Send tryggingskopi"),
      h("button", { class: "knapp", type: "button", onclick: () => velgFil.click() }, ikon("📥"), "Hent inn tryggingskopi"),
      velgFil,
      h("button", { class: "knapp fare", type: "button", style: "margin-top:30px", onclick: () => {
        if (!confirm("Slette ALLE bestillingar på denne telefonen?")) return;
        if (!confirm("Er du heilt sikker? Dette kan ikkje angrast.")) return;
        data = { ordre: [] };
        lagreData();
        slettUtkast();
        location.replace("#/");
      } }, ikon("🗑"), "Slett alle data")));
  }

  /* ---------- Start ---------- */

  ryddGamle();
  rute();
  Ved.registrerOffline(paaFramsida);
})();
