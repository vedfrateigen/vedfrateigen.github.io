/* Felles for kundesida og pappa-appen: priser, avstand, adressesøk og bestillingsskjemaet. */
(function () {
  "use strict";
  const C = window.VED;
  const tallformat = new Intl.NumberFormat("nn-NO", { maximumFractionDigits: 1 });

  /* ---------- Tall og tekst ---------- */

  const tall = (n) => tallformat.format(n);
  const kr = (n) => tallformat.format(Math.round(n)) + " kr";
  const rund1 = (n) => Math.round(n * 10) / 10;
  const produkt = (id) => C.produkter.find((p) => p.id === id);

  function tomtAntall() {
    return Object.fromEntries(C.produkter.map((p) => [p.id, 0]));
  }

  function naaPriser() {
    return Object.fromEntries(C.produkter.map((p) => [p.id, p.pris]));
  }

  // "10 sekkar bjørk og 1,5 m³ laus bjørk"
  function beskrivAntall(antall) {
    const deler = C.produkter
      .filter((p) => antall[p.id] > 0)
      .map((p) => tall(antall[p.id]) + " " + (antall[p.id] === 1 ? p.eintal : p.fleirtal));
    return deler.join(" og ") || "ingenting valt";
  }

  function varesum(antall, priser) {
    return C.produkter.reduce(
      (sum, p) => sum + (Number(antall[p.id]) || 0) * (priser && priser[p.id] != null ? priser[p.id] : p.pris), 0);
  }

  // Frakt for én levering. null = avtales (ukjent avstand eller for langt).
  function leveringspris(kmEnVei) {
    const L = C.levering;
    if (kmEnVei == null || !isFinite(kmEnVei) || kmEnVei < 0 || kmEnVei > L.maksKm) return null;
    const ore = Math.round((L.startpris + kmEnVei * 2 * L.krPerKm) * 100);
    return Math.max(L.minimum, Math.ceil(ore / (L.rundOppTil * 100)) * L.rundOppTil);
  }

  // Hele regnestykket for en bestilling. s.priser = prisene som gjaldt da bestillingen ble lagret.
  function beregn(s) {
    const ved = varesum(s.antall, s.priser);
    let frakt = 0;
    if (s.levering === true) frakt = s.manuellFrakt != null ? s.manuellFrakt : leveringspris(s.km);
    return { ved, frakt, total: ved + (frakt || 0), fraktUkjent: frakt == null };
  }

  function nyId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------- Telefon, SMS og kart ---------- */

  const bareSiffer = (t) => String(t || "").replace(/[^\d+]/g, "");

  function telefonLenke(t) {
    const n = bareSiffer(t);
    return /^\d{8}$/.test(n) ? "+47" + n : n;
  }

  function visTelefon(t) {
    const n = bareSiffer(t);
    return /^\d{8}$/.test(n) ? n.replace(/(\d{3})(\d{2})(\d{3})/, "$1 $2 $3") : String(t || "");
  }

  // «?&body=» virker både på Android og iPhone.
  function smsLenke(nummer, tekst) {
    return "sms:" + (nummer ? telefonLenke(nummer) : "") + "?&body=" + encodeURIComponent(tekst);
  }

  function kartLenke(o) {
    const maal = o.punkt ? o.punkt.lat + "," + o.punkt.lon : o.adresse;
    return "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(maal);
  }

  /* ---------- Bestilling i en lenke (kundesida → SMS → pappa-appen) ---------- */

  function klamp(n, min, maks, steg) {
    n = Number(n);
    if (!isFinite(n)) return 0;
    n = Math.min(maks, Math.max(min, n));
    return steg ? Math.round(n / steg) * steg : n;
  }

  function ordreTilParam(o) {
    const p = new URLSearchParams();
    p.set("i", o.id);
    if (o.navn) p.set("n", o.navn);
    if (o.telefon) p.set("t", o.telefon);
    for (const pr of C.produkter) if (o.antall[pr.id] > 0) p.set(pr.id, o.antall[pr.id]);
    if (o.levering === true) {
      p.set("l", "1");
      if (o.adresse) p.set("a", o.adresse);
      if (o.punkt) { p.set("la", o.punkt.lat.toFixed(5)); p.set("lo", o.punkt.lon.toFixed(5)); }
      if (o.km != null) p.set("k", o.km);
    } else if (o.levering === false) p.set("l", "0");
    if (o.notat) p.set("x", o.notat);
    return p.toString();
  }

  // Leser en bestilling fra lenka. Tekst kortes ned og tall holdes innenfor fornuftige grenser.
  function paramTilOrdre(tekst) {
    const p = new URLSearchParams(tekst);
    const id = (p.get("i") || "").replace(/[^a-z0-9]/gi, "").slice(0, 20);
    if (!id) return null;
    const kort = (k, maks) => (p.get(k) || "").trim().slice(0, maks);
    const antall = tomtAntall();
    for (const pr of C.produkter) antall[pr.id] = klamp(p.get(pr.id) || 0, 0, pr.maks, pr.steg);
    const la = Number(p.get("la")), lo = Number(p.get("lo"));
    const punkt = p.has("la") && isFinite(la) && isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180
      ? { lat: la, lon: lo } : null;
    const k = Number(p.get("k"));
    return {
      id, navn: kort("n", 80), telefon: kort("t", 20), antall,
      levering: p.get("l") === "1" ? true : p.get("l") === "0" ? false : null,
      adresse: kort("a", 150), punkt, km: p.has("k") && isFinite(k) && k >= 0 && k < 2000 ? rund1(k) : null,
      notat: kort("x", 300),
    };
  }

  /* ---------- Avstand ---------- */

  function luftlinjeKm(a, b) {
    const rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(x));
  }

  async function hentJson(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 8000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally {
      clearTimeout(t);
    }
  }

  const avstandsminne = new Map();

  // Kjøreavstand én vei fra henteadressen. Svarer ikke kartserveren, brukes luftlinje × veiFaktor.
  async function kjoreavstand(punkt) {
    const nokkel = punkt.lat.toFixed(5) + "," + punkt.lon.toFixed(5);
    if (avstandsminne.has(nokkel)) return avstandsminne.get(nokkel);
    const s = C.start;
    let svar = null;
    try {
      const d = await hentJson("https://router.project-osrm.org/route/v1/driving/" +
        `${s.lon},${s.lat};${punkt.lon},${punkt.lat}?overview=false`);
      if (d.code === "Ok" && d.routes && d.routes.length) svar = { km: rund1(d.routes[0].distance / 1000), omtrent: false };
    } catch (e) { /* bruker luftlinje under */ }
    if (!svar) svar = { km: rund1(luftlinjeKm(s, punkt) * C.veiFaktor), omtrent: true };
    else avstandsminne.set(nokkel, svar);
    return svar;
  }

  /* ---------- Adressesøk (Kartverket) ---------- */

  const STEDSTYPER = new Set(["Tettsted", "Tettbebyggelse", "Tettsteddel", "Bygdelag (bygd)", "Grend",
    "Gard", "Bruk (gardsbruk)", "Boligfelt", "By", "Kirke", "Skole"]);
  const MAKS_AVSTAND_KM = 300;

  const storForbokstav = (s) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

  // «storehagen 1a, førde» → { gate: "storehagen", nr: "1a", sted: "førde" }
  function tolkAdresse(tekst) {
    const renset = tekst.replace(/\s+/g, " ").trim();
    const [forKomma, etterKomma] = renset.split(",").map((d) => d.trim());
    const m = forKomma.match(/^(.*?\p{L}.*?)\s+(\d+\s?[a-zA-Z]?)(?:\s+(\p{L}[\p{L} -]*))?$/u);
    if (m) return { gate: m[1], nr: m[2].replace(/\s/g, ""), sted: etterKomma || m[3] || "" };
    return { gate: forKomma, nr: "", sted: etterKomma || "" };
  }

  async function sokAdresser(t) {
    const hent = async (sok, ekstra) => {
      const d = await hentJson("https://ws.geonorge.no/adresser/v1/sok?utkoordsys=4258&treffPerSide=40&sok=" +
        encodeURIComponent(sok) + (ekstra || ""));
      return (d.adresser || []).filter((a) => a.representasjonspunkt).map((a) => ({
        tekst: `${a.adressetekst}, ${a.postnummer} ${storForbokstav(a.poststed)}`,
        punkt: { lat: a.representasjonspunkt.lat, lon: a.representasjonspunkt.lon },
        gate: (a.adressenavn || "") + "|" + a.postnummer,
        nr: parseInt(a.nummer, 10) || 0,
      }));
    };
    const poststed = t.sted ? "&poststed=" + encodeURIComponent(t.sted) : "";
    const forsok = [];
    if (t.nr) forsok.push([t.gate + " " + t.nr, poststed], [t.gate + " " + t.nr, ""]);
    // Fant vi ikke nummeret, viser vi resten av gata – nærmeste husnummer først.
    forsok.push([t.gate, poststed], [t.gate + "*", poststed], [t.gate, ""], [t.gate + "*", ""], [t.gate, "&fuzzy=true"]);
    const provd = new Set();
    for (const [sok, ekstra] of forsok) {
      if (provd.has(sok + ekstra)) continue;
      provd.add(sok + ekstra);
      const treff = await hent(sok, ekstra);
      if (treff.length) return treff;
    }
    return [];
  }

  async function sokSteder(t) {
    if (t.nr) return [];
    const d = await hentJson("https://ws.geonorge.no/stedsnavn/v1/navn?utkoordsys=4258&treffPerSide=40&sok=" +
      encodeURIComponent(t.gate + "*"));
    return (d.navn || []).filter((n) => STEDSTYPER.has(n.navneobjekttype) && n.representasjonspunkt).map((n) => ({
      tekst: n.skrivemåte + " (" + n.navneobjekttype.replace(" (bygd)", "").replace(" (gardsbruk)", "").toLowerCase() +
        (n.kommuner && n.kommuner[0] ? ", " + n.kommuner[0].kommunenavn : "") + ")",
      navn: n.skrivemåte,
      punkt: { lat: n.representasjonspunkt.nord, lon: n.representasjonspunkt.øst },
    }));
  }

  // Forslag sortert slik at det nærmeste kommer først. Ukjente steder langt unna tas bort.
  async function sokAdresse(tekst) {
    const t = tolkAdresse(tekst);
    if (t.gate.length < 3) return [];
    const [adresser, steder] = await Promise.all([
      sokAdresser(t).catch(() => []), sokSteder(t).catch(() => []),
    ]);
    const avstand = (x) => luftlinjeKm(C.start, x.punkt);
    const naer = (x) => avstand(x) <= MAKS_AVSTAND_KM;
    const lik = (x) => Boolean(x.navn && x.navn.toLowerCase() === t.gate.toLowerCase());
    // Samme gatenavn finnes mange steder i landet: nærmeste gate først, så nærmeste husnummer.
    const adrNaer = adresser.filter(naer);
    const gateAvstand = new Map();
    for (const a of adrNaer) gateAvstand.set(a.gate, Math.min(gateAvstand.get(a.gate) ?? Infinity, avstand(a)));
    const nr = parseInt(t.nr, 10) || 0;
    adrNaer.sort((a, b) => (gateAvstand.get(a.gate) - gateAvstand.get(b.gate)) ||
      (Math.abs(a.nr - nr) - Math.abs(b.nr - nr)) || a.tekst.localeCompare(b.tekst, "nn"));
    const stedNaer = steder.filter(naer).sort((a, b) => (lik(b) - lik(a)) || avstand(a) - avstand(b));
    const fremst = stedNaer.filter(lik).slice(0, 2);
    const sett = new Set();
    return [...fremst, ...adrNaer.slice(0, 6), ...stedNaer.filter((s) => !lik(s)).slice(0, 3)]
      .filter((x) => !sett.has(x.tekst) && sett.add(x.tekst))
      .slice(0, 8);
  }

  /* ---------- Små DOM-hjelpere ---------- */

  // h("button", { class: "knapp", onclick: fn }, "Tekst") – all tekst settes som tekst, aldri som HTML.
  function h(tag, props, ...barn) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "value") el.value = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const b of barn.flat()) if (b != null && b !== false) el.append(b instanceof Node ? b : String(b));
    return el;
  }

  let meldingTimer = null;
  function visMelding(tekst, handling) {
    let boks = document.getElementById("melding");
    if (!boks) {
      boks = h("div", { id: "melding", class: "melding", role: "status", "aria-live": "polite" });
      document.body.append(boks);
    }
    boks.replaceChildren(h("span", { text: tekst }));
    if (handling) {
      boks.append(h("button", { class: "melding-knapp", onclick: () => { skjul(); handling.gjor(); } }, handling.tekst));
    }
    boks.classList.add("synlig");
    const skjul = () => boks.classList.remove("synlig");
    clearTimeout(meldingTimer);
    meldingTimer = setTimeout(skjul, handling ? 8000 : 3500);
  }

  async function kopier(tekst) {
    try {
      await navigator.clipboard.writeText(tekst);
      return true;
    } catch (e) {
      const ta = h("textarea", { value: tekst, readonly: true, style: "position:fixed;opacity:0" });
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e2) { /* ikke støttet */ }
      ta.remove();
      return ok;
    }
  }

  // Deler tekst via telefonens «Del»-meny (Messenger, SMS …). Faller tilbake til kopiering.
  async function del(tekst) {
    if (navigator.share) {
      try {
        await navigator.share({ text: tekst });
        return "delt";
      } catch (e) {
        if (e && e.name === "AbortError") return "avbrutt";
      }
    }
    return (await kopier(tekst)) ? "kopiert" : "feil";
  }

  /* ---------- Bestillingsskjemaet (brukes av begge sidene) ---------- */

  // modus "kunde": kunden regner ut pris selv. modus "pappa": pappa legger inn en bestilling.
  function lagSkjema({ modus, start, vedEndring }) {
    const pappa = modus === "pappa";
    const s = Object.assign({
      antall: tomtAntall(), levering: null, adresse: "", punkt: null, km: null, omtrent: false,
      manuellFrakt: null, navn: "", telefon: "", notat: "", priser: null,
    }, start ? JSON.parse(JSON.stringify(start)) : {});
    s.antall = Object.assign(tomtAntall(), s.antall);
    let sokNr = 0, avstandNr = 0, sokTimer = null, laster = false;

    const endret = () => { tegnOppsummering(); if (vedEndring) vedEndring(s); };

    // 1. Hva
    const tellere = C.produkter.map((p) => {
      const verdi = h("output", { class: "teller-verdi", "aria-live": "polite" });
      const oppdater = () => {
        verdi.textContent = tall(s.antall[p.id]);
        rad.classList.toggle("valgt", s.antall[p.id] > 0);
      };
      const endre = (retning) => {
        s.antall[p.id] = klamp(s.antall[p.id] + retning * p.steg, 0, p.maks, p.steg);
        oppdater();
        endret();
      };
      const rad = h("div", { class: "vare" },
        h("div", { class: "vare-tekst" },
          h("div", { class: "vare-navn", text: p.navn }),
          h("div", { class: "vare-detalj", text: kr(p.pris) + " per " + p.eining })),
        h("div", { class: "teller" },
          h("button", { type: "button", class: "teller-knapp", "aria-label": "Færre " + p.fleirtal, onclick: () => endre(-1) }, "−"),
          verdi,
          h("button", { type: "button", class: "teller-knapp", "aria-label": "Fleire " + p.fleirtal, onclick: () => endre(1) }, "+")));
      oppdater();
      return rad;
    });

    // 2. Levering eller henting
    const knappLevering = h("button", { type: "button", class: "valg", "aria-pressed": "false", onclick: () => velgLevering(true) },
      h("span", { class: "valg-ikon", "aria-hidden": "true" }, "🚚"), "Levering");
    const knappHenting = h("button", { type: "button", class: "valg", "aria-pressed": "false", onclick: () => velgLevering(false) },
      h("span", { class: "valg-ikon", "aria-hidden": "true" }, "🏠"), pappa ? "Hentar sjølv" : "Eg hentar sjølv");

    // 3. Adresse
    const adresseFelt = h("input", {
      type: "text", id: modus + "-adresse", class: "felt", autocomplete: "street-address",
      placeholder: "T.d. Storehagen 1, Førde", enterkeyhint: "search", value: s.adresse,
    });
    const forslagListe = h("ul", { class: "forslag", role: "listbox", hidden: true });
    const avstandLinje = h("div", { class: "avstand", "aria-live": "polite" });
    const fraktFelt = h("input", { type: "number", inputmode: "numeric", min: "0", step: "50", class: "felt felt-kort", id: "pappa-frakt" });
    const fraktRad = h("div", { class: "frakt-rad", hidden: true },
      h("label", { for: "pappa-frakt", text: "Frakt i kroner:" }), fraktFelt,
      h("button", { type: "button", class: "lenkeknapp", onclick: () => { s.manuellFrakt = null; fraktFelt.value = ""; tegnAvstand(); endret(); } }, "Rekn ut på nytt"));
    const adresseBoks = h("div", { class: "adresse-boks", hidden: true },
      h("label", { for: modus + "-adresse", class: "etikett", text: pappa ? "Kvar skal veden?" : "Kvar skal veden leverast?" }),
      adresseFelt, forslagListe, avstandLinje, pappa ? fraktRad : null);

    // 4. Kontakt
    const felt = (id, etikett, attrs, nokkel) => {
      const inp = h(attrs.tag || "input", Object.assign({ id: modus + "-" + id, class: "felt", value: s[nokkel] }, attrs, { tag: null }));
      inp.addEventListener("input", () => { s[nokkel] = inp.value; if (vedEndring) vedEndring(s); });
      return h("div", { class: "felt-gruppe" }, h("label", { for: modus + "-" + id, class: "etikett", text: etikett }), inp);
    };
    const kontakt = h("div", { class: "kontakt" },
      felt("navn", pappa ? "Namn på kunden" : "Namnet ditt", { type: "text", autocomplete: pappa ? "off" : "name", maxlength: "80" }, "navn"),
      felt("telefon", pappa ? "Telefonnummer (viss du har det)" : "Mobilnummeret ditt", { type: "tel", inputmode: "tel", autocomplete: pappa ? "off" : "tel", maxlength: "20" }, "telefon"),
      felt("notat", pappa ? "Notat (når, kvar, anna)" : "Når passar det? Anna vi bør vite?",
        { tag: "textarea", rows: "2", maxlength: "300", placeholder: "T.d. laurdag føremiddag, legg ved garasjen" }, "notat"));

    // 5. Oppsummering
    const oppsummering = h("div", { class: "oppsummering", "aria-live": "polite" });

    const steg = (nr, tittel, ...innhold) => h("section", { class: "steg" },
      h("h3", { class: "steg-tittel" }, h("span", { class: "steg-nr", "aria-hidden": "true" }, String(nr)), tittel), ...innhold);

    const el = h("div", { class: "skjema" },
      steg(1, pappa ? "Kva vil kunden ha?" : "Kva vil du ha?", ...tellere),
      steg(2, "Levering eller henting?", h("div", { class: "valg-rad" }, knappLevering, knappHenting), adresseBoks),
      steg(3, pappa ? "Kven er kunden?" : "Kven er du?", kontakt),
      oppsummering);

    function velgLevering(ja) {
      s.levering = ja;
      knappLevering.setAttribute("aria-pressed", String(ja === true));
      knappHenting.setAttribute("aria-pressed", String(ja === false));
      adresseBoks.hidden = ja !== true;
      if (ja && !s.adresse) setTimeout(() => adresseFelt.focus(), 50);
      tegnAvstand();
      endret();
    }

    function tegnAvstand() {
      avstandLinje.replaceChildren();
      fraktRad.hidden = true;
      if (s.levering !== true) return;
      if (laster) {
        avstandLinje.append(h("span", { class: "laster" }, "Reknar ut køyreavstand …"));
        return;
      }
      const manuell = pappa && s.manuellFrakt != null;
      if (s.km != null) {
        const pris = leveringspris(s.km);
        avstandLinje.append(h("span", { class: "avstand-km", text: "📍 " + (s.omtrent ? "ca. " : "") + tall(s.km) + " km " + (pappa ? "frå deg" : "å køyre") }),
          " → ", h(manuell ? "span" : "strong", { text: (manuell ? "utrekna frakt " : "frakt ") + (pris != null ? kr(pris) : "etter avtale") }));
        if (s.omtrent) avstandLinje.append(h("div", { class: "hint", text: "Omtrentleg avstand (fekk ikkje svar frå kartet)." }));
        if (pappa && !manuell) {
          avstandLinje.append(" ", h("button", { type: "button", class: "lenkeknapp", onclick: () => {
            s.manuellFrakt = pris != null ? pris : 0; tegnAvstand(); endret(); fraktFelt.focus(); fraktFelt.select();
          } }, "Endre frakt"));
        }
      } else if (s.adresse.trim()) {
        avstandLinje.append(h("span", { class: "hint", text: pappa
          ? "Vel adressa frå lista – eller skriv frakt sjølv:"
          : "Vel adressa frå lista for å sjå frakt. Finn du ho ikkje, send likevel – så reknar vi ut frakt og svarar deg." }));
      }
      if (pappa && (manuell || (s.km == null && s.adresse.trim()))) {
        fraktRad.hidden = false;
        fraktFelt.value = s.manuellFrakt != null ? s.manuellFrakt : "";
      }
    }

    fraktFelt.addEventListener("input", () => {
      const v = fraktFelt.value.trim();
      s.manuellFrakt = v === "" ? null : klamp(v, 0, 100000);
      endret();
    });

    function visForslag(liste, sokeTekst) {
      forslagListe.replaceChildren();
      if (!liste.length) {
        forslagListe.append(h("li", { class: "forslag-tom", text: "Fann inga adresse for «" + sokeTekst + "». Prøv gatenamn og nummer, t.d. «Storehagen 1»." }));
      }
      for (const f of liste) {
        const li = h("li", { role: "option" },
          h("button", { type: "button", class: "forslag-knapp", onclick: () => velgSted(f) }, f.tekst));
        forslagListe.append(li);
      }
      forslagListe.hidden = false;
    }

    async function velgSted(f) {
      forslagListe.hidden = true;
      s.adresse = f.tekst;
      adresseFelt.value = f.tekst;
      s.punkt = f.punkt;
      s.km = null;
      s.manuellFrakt = null;
      laster = true;
      tegnAvstand();
      endret();
      const mitt = ++avstandNr;
      const svar = await kjoreavstand(f.punkt);
      if (mitt !== avstandNr) return;
      laster = false;
      s.km = svar.km;
      s.omtrent = svar.omtrent;
      tegnAvstand();
      endret();
    }

    adresseFelt.addEventListener("input", () => {
      s.adresse = adresseFelt.value;
      s.punkt = null;
      s.km = null;
      s.omtrent = false;
      avstandNr++;
      laster = false;
      clearTimeout(sokTimer);
      const tekst = adresseFelt.value.trim();
      if (tekst.length < 3) { forslagListe.hidden = true; tegnAvstand(); endret(); return; }
      forslagListe.replaceChildren(h("li", { class: "forslag-tom laster", text: "Søkjer …" }));
      forslagListe.hidden = false;
      tegnAvstand();
      endret();
      sokTimer = setTimeout(async () => {
        const mitt = ++sokNr;
        const liste = await sokAdresse(tekst).catch(() => []);
        if (mitt === sokNr && adresseFelt.value.trim() === tekst) visForslag(liste, tekst);
      }, 400);
    });
    adresseFelt.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const forste = forslagListe.querySelector(".forslag-knapp");
        if (forste && !forslagListe.hidden) forste.click();
      }
    });

    function tegnOppsummering() {
      const b = beregn(s);
      const rader = [];
      for (const p of C.produkter) {
        if (s.antall[p.id] > 0) {
          const pris = s.priser && s.priser[p.id] != null ? s.priser[p.id] : p.pris;
          rader.push([tall(s.antall[p.id]) + " " + (s.antall[p.id] === 1 ? p.eintal : p.fleirtal) + " à " + kr(pris), kr(s.antall[p.id] * pris)]);
        }
      }
      if (s.levering === true) rader.push(["Frakt", b.fraktUkjent ? "etter avtale" : kr(b.frakt)]);
      if (s.levering === false) rader.push([pappa ? "Hentar sjølv" : "Du hentar sjølv", "0 kr"]);
      oppsummering.replaceChildren();
      if (!rader.length) {
        oppsummering.append(h("p", { class: "oppsummering-tom", text: pappa ? "Trykk + for å velje kor mange." : "Trykk + for å velje kor mykje ved du vil ha." }));
        return;
      }
      const tabell = h("table", { class: "sum-tabell" });
      for (const [a, b2] of rader) tabell.append(h("tr", {}, h("td", { text: a }), h("td", { text: b2 })));
      tabell.append(h("tr", { class: "sum-total" }, h("td", { text: "Totalt" + (b.fraktUkjent ? " (utan frakt)" : "") }), h("td", { text: kr(b.total) })));
      oppsummering.append(tabell);
      if (!pappa && s.levering === null) oppsummering.append(h("p", { class: "hint", text: "Vel levering eller henting over." }));
    }

    if (s.levering !== null) velgLevering(s.levering); else tegnOppsummering();
    tegnAvstand();

    return {
      el,
      tilstand: () => s,
      beregn: () => beregn(s),
      // Regn ut avstand for bestillinger som har kartpunkt men mangler km (f.eks. fra kundesida).
      async fyllAvstand() {
        if (s.levering === true && s.punkt && s.km == null && s.manuellFrakt == null) {
          await velgSted({ tekst: s.adresse, punkt: s.punkt });
        }
      },
    };
  }

  /* ---------- Service worker (gjør at appen virker uten dekning) ---------- */

  function registrerOffline() {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  window.Ved = {
    C, tall, kr, rund1, produkt, tomtAntall, naaPriser, beskrivAntall, varesum, leveringspris, beregn, nyId,
    telefonLenke, visTelefon, smsLenke, kartLenke, klamp, ordreTilParam, paramTilOrdre,
    luftlinjeKm, kjoreavstand, tolkAdresse, sokAdresse, h, visMelding, kopier, del, lagSkjema, registrerOffline,
  };
})();
