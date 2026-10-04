// © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
/* Felles for kundesida og pappa-appen: priser, avstand, adressesøk og bestillingsskjemaet. */
(function () {
  "use strict";
  const C = window.VED;
  const tallformat = new Intl.NumberFormat("nn-NO", { maximumFractionDigits: 1 });

  /* ---------- Tall og tekst ---------- */

  const tall = (n) => tallformat.format(n);
  const kr = (n) => tallformat.format(Math.round(n)) + " kr";
  const rund1 = (n) => Math.round(n * 10) / 10;

  function tomtAntall() {
    return Object.fromEntries(C.produkter.map((p) => [p.id, 0]));
  }

  function naaPriser() {
    return Object.fromEntries(C.produkter.map((p) => [p.id, p.pris]));
  }

  // "10 sekkar bjørk og 1,5 m³ stabla bjørk"
  // gratis (valfritt): det kunden får med på kjøpet, t.d. { gran: 1 } → «… + 1 sekk gran gratis».
  function beskrivAntall(antall, gratis) {
    const tekst = (n, p) => tall(n) + " " + (n === 1 ? p.eintal : p.fleirtal);
    const deler = C.produkter.filter((p) => antall[p.id] > 0).map((p) => tekst(antall[p.id], p));
    const gaver = gratis ? C.produkter.filter((p) => gratis[p.id] > 0).map((p) => tekst(gratis[p.id], p) + " gratis") : [];
    return (deler.join(" og ") || "ingenting valt") + (gaver.length ? " + " + gaver.join(" og ") : "");
  }

  // Pris per enhet. Kjøper kunden rabatt.fraAntal eller flere av rabattproduktet, gjelder rabattprisen for alle.
  const harRabatt = (p, antall, rabatt) => Boolean(rabatt && rabatt.produkt === p.id && (Number(antall[p.id]) || 0) >= rabatt.fraAntal);

  function einingspris(p, antall, priser, rabatt) {
    if (harRabatt(p, antall, rabatt)) return rabatt.pris;
    return priser && priser[p.id] != null ? priser[p.id] : p.pris;
  }

  function varesum(antall, priser, rabatt) {
    return C.produkter.reduce((sum, p) => sum + (Number(antall[p.id]) || 0) * einingspris(p, antall, priser, rabatt), 0);
  }

  // Bestillinger lagret før rabatten fantes, har priser men ingen rabatt – de regnes uten rabatt.
  const rabattFor = (s) => (s.priser ? s.rabatt || null : C.rabatt);

  // Tilbud: for hver «per» kjøpte av «kjop» får kunden «antal» av «gratis» uten å betale.
  // Lagrede bestillinger beholder tilbudet slik det var da de ble laget. Er gratisvaren utsolgt, er tilbudet på pause.
  const tilbodNaa = () => (C.tilbod && !(C.utselt || []).includes(C.tilbod.gratis) ? C.tilbod : null);
  const tilbodFor = (s) => (s.priser ? s.tilbod || null : tilbodNaa());
  // «Kvar 10. sekk bjørk gir 1 sekk granved gratis» – tom streng når det ikkje er noko tilbod (eller det er på pause).
  // fast = slik det står i annonsar og SMS: «Fast tilbod: …» med vilkåret (Forbrukertilsynet om betingede tilbud).
  function tilbodTekst(fast) {
    const t = tilbodNaa();
    const kp = t && C.produkter.find((p) => p.id === t.kjop), gp = t && C.produkter.find((p) => p.id === t.gratis);
    if (!kp || !gp) return "";
    const vare = gp.vedtype || gp.fleirtal;
    const tekst = "Kvar " + t.per + ". " + kp.eintal + " gir " + t.antal + " sekk " + vare + " gratis";
    return fast ? "Fast tilbod: k" + tekst.slice(1) + " – så lenge det er " + vare + " att" : tekst;
  }

  function gratisFor(s) {
    const g = {};
    const t = tilbodFor(s);
    if (t) {
      const n = Math.floor((Number(s.antall && s.antall[t.kjop]) || 0) / t.per) * t.antal;
      if (n > 0) g[t.gratis] = n;
    }
    return g;
  }

  // Hvor mange sekker bestillingen tilsvarer (kubikk regnes om etter volum, se sekkPerEining i config.js).
  function sekkEkvivalent(antall) {
    return C.produkter.reduce((sum, p) =>
      sum + (Number(antall[p.id]) || 0) * (p.sekkPerEining != null ? p.sekkPerEining : p.eining === "m³" ? 1000 / C.literPerSekk : 1), 0);
  }

  const leveringOk = (antall) => sekkEkvivalent(antall) >= C.levering.minstSekkar - 1e-9;

  // Frakt for én levering. null = avtales (ukjent avstand eller for langt).
  function leveringspris(kmEnVei) {
    const L = C.levering;
    if (kmEnVei == null || !isFinite(kmEnVei) || kmEnVei < 0 || kmEnVei > L.maksKm) return null;
    const ore = Math.round((L.startpris + kmEnVei * 2 * L.krPerKm) * 100);
    return Math.max(L.minimum, Math.ceil(ore / (L.rundOppTil * 100)) * L.rundOppTil);
  }

  // Hele regnestykket for en bestilling. s.priser = prisene som gjaldt da bestillingen ble lagret.
  function beregn(s) {
    let ved = varesum(s.antall, s.priser, rabattFor(s));
    let frakt = 0;
    if (s.levering === true) frakt = s.manuellFrakt != null ? s.manuellFrakt : leveringspris(s.km);
    let total = ved + (frakt || 0);
    // Pappa kan avtale en annen totalpris (vennepris o.l.). Veden får resten, så summene i oversikten går opp.
    const avtalt = s.manuellTotal != null && isFinite(s.manuellTotal);
    if (avtalt) { total = s.manuellTotal; ved = total - (frakt || 0); }
    return { ved, frakt, total, fraktUkjent: frakt == null, avtalt, gratis: gratisFor(s) };
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
    if (o.paaminning) p.set("p", "1");
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
      notat: kort("x", 300), paaminning: p.get("p") === "1",
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
        encodeURIComponent(sok) + (ekstra || ""), 4000);
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
    const start = Date.now();
    let nettfeil = 0, forsokt = 0;
    for (const [sok, ekstra] of forsok) {
      if (provd.has(sok + ekstra)) continue;
      if (Date.now() - start > 9000) break;
      provd.add(sok + ekstra);
      forsokt++;
      try {
        const treff = await hent(sok, ekstra);
        if (treff.length) return treff;
      } catch (e) {
        nettfeil++;
      }
    }
    const tom = [];
    tom.nettfeil = forsokt > 0 && nettfeil === forsokt;
    return tom;
  }

  async function sokSteder(t) {
    if (t.nr) return [];
    const d = await hentJson("https://ws.geonorge.no/stedsnavn/v1/navn?utkoordsys=4258&treffPerSide=40&sok=" +
      encodeURIComponent(t.gate + "*"), 4000);
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
    let stedFeil = false;
    const [adresser, steder] = await Promise.all([
      sokAdresser(t), sokSteder(t).catch(() => { stedFeil = true; return []; }),
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
    const liste = [...fremst, ...adrNaer.slice(0, 6), ...stedNaer.filter((s) => !lik(s)).slice(0, 3)]
      .filter((x) => !sett.has(x.tekst) && sett.add(x.tekst))
      .slice(0, 8);
    liste.nettfeil = !liste.length && Boolean(adresser.nettfeil) && (stedFeil || Boolean(t.nr));
    return liste;
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
  function skjulMelding() {
    const boks = document.getElementById("melding");
    if (boks) boks.classList.remove("synlig");
  }

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
  // kundar: tidligere kunder (bare i pappa-appen) – foreslås når han skriver navnet.
  function lagSkjema({ modus, start, vedEndring, kundar }) {
    const pappa = modus === "pappa";
    const s = Object.assign({
      antall: tomtAntall(), levering: null, adresse: "", punkt: null, km: null, omtrent: false,
      manuellFrakt: null, manuellTotal: null, navn: "", telefon: "", notat: "", priser: null, paaminning: false,
    }, start ? JSON.parse(JSON.stringify(start)) : {});
    s.antall = Object.assign(tomtAntall(), s.antall);
    let sokNr = 0, avstandNr = 0, sokTimer = null, laster = false;
    // vedEndring kalles bare etter at brukeren selv har trykket eller skrevet noe (ikke ved oppstart).
    let brukar = false;

    const endret = () => { tegnOppsummering(); tegnMinste(); if (vedEndring && brukar) vedEndring(s); };

    // 1. Hva
    const tellere = C.produkter.map((p) => {
      const utselt = !pappa && (C.utselt || []).includes(p.id);
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
      const rad = h("div", { class: "vare" + (utselt ? " utselt" : "") },
        h("div", { class: "vare-tekst" },
          h("div", { class: "vare-navn", text: p.navn }),
          h("div", { class: "vare-detalj", text: utselt ? "Utselt no – kjem att" : kr(p.pris) + " per " + p.eining })),
        h("div", { class: "teller" },
          h("button", { type: "button", class: "teller-knapp", disabled: utselt, "aria-label": "Færre " + p.fleirtal, onclick: () => endre(-1) }, "−"),
          verdi,
          h("button", { type: "button", class: "teller-knapp", disabled: utselt, "aria-label": "Fleire " + p.fleirtal, onclick: () => endre(1) }, "+")));
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
    const minsteLinje = h("p", { class: "boks-gul", role: "status", hidden: true, style: "margin:12px 0 0" });
    const adresseBoks = h("div", { class: "adresse-boks", hidden: true },
      h("label", { for: modus + "-adresse", class: "etikett", text: pappa ? "Kvar skal veden?" : "Kvar skal veden leverast?" }),
      adresseFelt, forslagListe, avstandLinje, pappa ? fraktRad : null);

    // 4. Kontakt
    const felt = (id, etikett, attrs, nokkel) => {
      const inp = h(attrs.tag || "input", Object.assign({ id: modus + "-" + id, class: "felt", value: s[nokkel] }, attrs, { tag: null }));
      inp.addEventListener("input", () => { s[nokkel] = inp.value; if (vedEndring && brukar) vedEndring(s); });
      return h("div", { class: "felt-gruppe" }, h("label", { for: modus + "-" + id, class: "etikett", text: etikett }), inp);
    };
    const kontakt = h("div", { class: "kontakt" },
      felt("navn", pappa ? "Namn på kunden" : "Namnet ditt", { type: "text", autocomplete: pappa ? "off" : "name", maxlength: "80" }, "navn"),
      felt("telefon", pappa ? "Telefonnummer (viss du har det)" : "Mobilnummeret ditt", { type: "tel", inputmode: "tel", autocomplete: pappa ? "off" : "tel", maxlength: "20" }, "telefon"),
      felt("notat", pappa ? "Notat (når, kvar, anna)" : "Når passar det? Anna vi bør vite?",
        { tag: "textarea", rows: "2", maxlength: "300", placeholder: "T.d. laurdag føremiddag, legg ved garasjen" }, "notat"));

    // Samtykke til éin SMS neste haust (marknadsføringslova § 15: aldri førehandsavkryssa).
    const paaminningBoks = h("input", { type: "checkbox", id: modus + "-paaminning", class: "avkryss" });
    paaminningBoks.checked = Boolean(s.paaminning);
    paaminningBoks.addEventListener("change", () => { s.paaminning = paaminningBoks.checked; if (vedEndring && brukar) vedEndring(s); });
    kontakt.append(h("label", { class: "avkryss-rad", for: modus + "-paaminning" }, paaminningBoks,
      h("span", { text: pappa
        ? "Kunden vil ha ein SMS når det er tid for ved neste haust (spør først)."
        : "Ja takk, send meg ein SMS når det er tid for ved neste haust. Du kan seie nei takk når som helst." })));

    // Tidlegare kundar: skriv dei første bokstavane i namnet, trykk på forslaget.
    const kundeForslag = h("div", { class: "kunde-forslag", hidden: true });
    if (pappa && kundar && kundar.length) {
      const navnFelt = kontakt.querySelector("#pappa-navn");
      navnFelt.parentElement.append(kundeForslag);
      navnFelt.addEventListener("input", () => {
        const q = navnFelt.value.trim().toLowerCase();
        const treff = q.length < 2 ? [] : kundar.filter((k) => k.navn.toLowerCase().includes(q) && k.navn.toLowerCase() !== q).slice(0, 3);
        kundeForslag.replaceChildren();
        kundeForslag.hidden = !treff.length;
        if (!treff.length) return;
        kundeForslag.append(h("div", { class: "hint", text: "Tidlegare kunde? Trykk for å fylle inn resten:" }));
        for (const k of treff) {
          kundeForslag.append(h("button", { type: "button", class: "forslag-knapp kunde-knapp", onclick: () => brukKunde(k) },
            h("strong", { text: k.navn }), " · " + (k.levering && k.adresse ? k.adresse : "hentar sjølv") +
            (k.telefon ? " · " + visTelefon(k.telefon) : "")));
        }
      });
    }
    function brukKunde(k) {
      kundeForslag.hidden = true;
      s.navn = k.navn;
      s.telefon = k.telefon || "";
      kontakt.querySelector("#pappa-navn").value = s.navn;
      kontakt.querySelector("#pappa-telefon").value = s.telefon;
      if (k.levering === true && k.adresse) {
        Object.assign(s, { adresse: k.adresse, punkt: k.punkt || null, km: k.km != null ? k.km : null, omtrent: Boolean(k.omtrent), manuellFrakt: null });
        adresseFelt.value = k.adresse;
        velgLevering(true);
        if (s.km == null && s.punkt) velgSted({ tekst: s.adresse, punkt: s.punkt });
      } else if (k.levering === false) {
        velgLevering(false);
      } else {
        endret();
      }
    }

    // 5. Oppsummering
    const oppsummering = h("div", { class: "oppsummering", "aria-live": "polite" });

    // Avtalt totalpris (berre pappa). Feltet ligg utanfor oppsummeringa, så det ikkje blir teikna på nytt medan han skriv.
    const totalFelt = h("input", { type: "number", inputmode: "numeric", min: "0", step: "10", class: "felt felt-kort", id: "pappa-total" });
    const totalRad = h("div", { class: "frakt-rad", hidden: true },
      h("label", { for: "pappa-total", text: "Avtalt totalpris i kroner:" }), totalFelt,
      h("button", { type: "button", class: "lenkeknapp", onclick: () => {
        s.manuellTotal = null; totalFelt.value = ""; totalRad.hidden = true; totalKnapp.hidden = false; endret();
      } }, "Bruk vanleg pris"));
    const totalKnapp = h("button", { type: "button", class: "lenkeknapp", onclick: () => {
      totalKnapp.hidden = true; totalRad.hidden = false;
      s.manuellTotal = Math.round(beregn(Object.assign({}, s, { manuellTotal: null })).total);
      totalFelt.value = s.manuellTotal; endret(); totalFelt.focus(); totalFelt.select();
    } }, "Avtalt ein annan pris? Endre totalprisen");
    totalFelt.addEventListener("input", () => {
      const v = totalFelt.value.trim();
      s.manuellTotal = v === "" ? null : klamp(v, 0, 1000000);
      tegnOppsummering();
      if (vedEndring && brukar) vedEndring(s);
    });
    if (s.manuellTotal != null) { totalKnapp.hidden = true; totalRad.hidden = false; totalFelt.value = s.manuellTotal; }

    const steg = (nr, tittel, ...innhold) => h("section", { class: "steg" },
      h("h3", { class: "steg-tittel" }, h("span", { class: "steg-nr", "aria-hidden": "true" }, String(nr)), tittel), ...innhold);

    const el = h("div", { class: "skjema" },
      steg(1, pappa ? "Kva vil kunden ha?" : "Kva vil du ha?", ...tellere),
      steg(2, "Levering eller henting?", h("div", { class: "valg-rad" }, knappLevering, knappHenting), minsteLinje, adresseBoks),
      steg(3, pappa ? "Kven er kunden?" : "Kven er du?", kontakt),
      oppsummering,
      pappa ? h("div", { class: "total-endre" }, totalKnapp, totalRad) : null);

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
        forslagListe.append(h("li", { class: "forslag-tom", text: liste.nettfeil
          ? "Fekk ikkje kontakt med kartet. Sjekk dekninga og prøv igjen" + (pappa ? " – eller skriv frakt sjølv." : ", eller send bestillinga likevel.")
          : "Fann inga adresse for «" + sokeTekst + "». Prøv gatenamn og nummer, t.d. «Storehagen 1»." }));
        if (pappa && liste.nettfeil) { fraktRad.hidden = false; }
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
        const liste = await sokAdresse(tekst).catch(() => Object.assign([], { nettfeil: true }));
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
      const rabatt = rabattFor(s);
      for (const p of C.produkter) {
        if (s.antall[p.id] > 0) {
          const pris = einingspris(p, s.antall, s.priser, rabatt);
          rader.push([tall(s.antall[p.id]) + " " + (s.antall[p.id] === 1 ? p.eintal : p.fleirtal) + " à " + kr(pris) +
            (harRabatt(p, s.antall, rabatt) ? " (rabatt)" : ""), kr(s.antall[p.id] * pris)]);
        }
      }
      for (const p of C.produkter) {
        const n = b.gratis[p.id];
        if (n > 0) rader.push([tall(n) + " " + (n === 1 ? p.eintal : p.fleirtal) + " – tilbod", "gratis", "gratis-rad"]);
      }
      if (s.levering === true) rader.push(["Frakt", b.fraktUkjent ? "etter avtale" : kr(b.frakt)]);
      if (s.levering === false) rader.push([pappa ? "Hentar sjølv" : "Du hentar sjølv", "0 kr"]);
      oppsummering.replaceChildren();
      if (!rader.length) {
        oppsummering.append(h("p", { class: "oppsummering-tom", text: pappa ? "Trykk + for å velje kor mange." : "Trykk + for å velje kor mykje ved du vil ha." }));
        return;
      }
      const tabell = h("table", { class: "sum-tabell" });
      for (const [a, b2, klasse] of rader) tabell.append(h("tr", { class: klasse }, h("td", { text: a }), h("td", { text: b2 })));
      tabell.append(h("tr", { class: "sum-total" }, h("td", { text: "Totalt" + (b.avtalt ? " (avtalt pris)" : b.fraktUkjent ? " (utan frakt)" : "") }), h("td", { text: kr(b.total) })));
      oppsummering.append(tabell);
      if (pappa && C.tilbod && !tilbodNaa() && !tilbodFor(s)) {
        oppsummering.append(h("p", { class: "hint", text: "Tilbodet er på pause fordi granveden er utselt." }));
      }
      if (!pappa && s.levering === null) oppsummering.append(h("p", { class: "hint", text: "Vel levering eller henting over." }));
      const t = tilbodFor(s);
      const kp = t && C.produkter.find((p) => p.id === t.kjop);
      const gp = t && C.produkter.find((p) => p.id === t.gratis);
      const n = kp ? Number(s.antall[kp.id]) || 0 : 0;
      const neste = t ? (Math.floor(n / t.per) + 1) * t.per : 0;
      if (!pappa && kp && gp && n > 0 && neste - n <= 3) {
        const fleire = (neste / t.per) * t.antal;
        oppsummering.append(h("p", { class: "hint tilbod-tips", text: "Tips: Kjøper du " + neste + " " + kp.fleirtal + ", får du " +
          fleire + " " + (fleire === 1 ? gp.eintal.replace("sekk gran", "sekk granved") : gp.fleirtal.replace("sekkar gran", "sekkar granved")) + " gratis." }));
      }
    }

    // Minstebestilling for levering: kunden må leggje til meir eller hente sjølv; pappa får berre ei åtvaring.
    function tegnMinste() {
      const forLite = s.levering === true && C.produkter.some((p) => s.antall[p.id] > 0) && !leveringOk(s.antall);
      minsteLinje.hidden = !forLite;
      minsteLinje.textContent = pappa
        ? "Obs: Minstebestilling for levering er " + C.levering.minstSekkar + " sekkar (eller ½ m³). Du kan lagre likevel."
        : "Levering krev minst " + C.levering.minstSekkar + " sekkar (eller ½ m³). Legg til fleire – eller vel «Eg hentar sjølv».";
    }

    if (s.levering !== null) velgLevering(s.levering); else tegnOppsummering();
    tegnAvstand();
    tegnMinste();
    for (const hending of ["click", "input"]) el.addEventListener(hending, () => { brukar = true; }, true);

    return {
      el,
      tilstand: () => s,
      beregn: () => beregn(s),
      settLevering: (ja) => velgLevering(ja),
      // Regn ut avstand for bestillinger som har kartpunkt men mangler km (f.eks. fra kundesida).
      async fyllAvstand() {
        if (s.levering === true && s.punkt && s.km == null && s.manuellFrakt == null) {
          await velgSted({ tekst: s.adresse, punkt: s.punkt });
        }
      },
    };
  }

  /* ---------- Service worker (gjør at appen virker uten dekning) ---------- */

  // kanLasteNaa(): true når siden kan lastes på nytt uten at noe går tapt (f.eks. på framsida).
  const oppdatering = { venter: false };
  function registrerOffline(kanLasteNaa) {
    if (!("serviceWorker" in navigator) || !(location.protocol === "https:" || location.hostname === "localhost")) return;
    const haddeEldre = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.register("sw.js").then((reg) => {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!haddeEldre) return;
      if (kanLasteNaa && kanLasteNaa()) location.reload();
      else oppdatering.venter = true;
    });
  }

  window.Ved = {
    C, tall, kr, rund1, tomtAntall, naaPriser, beskrivAntall, harRabatt, einingspris, varesum, sekkEkvivalent, leveringOk,
    rabattFor, tilbodNaa, tilbodFor, tilbodTekst, gratisFor, leveringspris, beregn, nyId,
    telefonLenke, visTelefon, smsLenke, kartLenke, klamp, ordreTilParam, paramTilOrdre,
    luftlinjeKm, kjoreavstand, tolkAdresse, sokAdresse, h, visMelding, skjulMelding, kopier, del, lagSkjema,
    registrerOffline, oppdatering,
  };
})();
