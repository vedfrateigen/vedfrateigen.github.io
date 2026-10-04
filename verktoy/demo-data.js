// © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
/* Kun for skjermbilder/demo: eksempelbestillinger med fiktive kunder. Brukes ikke i appen. */
(function () {
  // Test av «utselt»: side#utselt=gran setter config.utselt før sida starter.
  const utselt = (location.hash.match(/utselt=([\w,]+)/) || [])[1];
  if (utselt) {
    let ved;
    Object.defineProperty(window, "VED", { configurable: true, get() { return ved; }, set(x) { x.utselt = utselt.split(","); ved = x; } });
  }

  window.__v = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__knapp = (tekst, n) => {
    const k = [...document.querySelectorAll("button, a")].filter((b) => b.textContent.includes(tekst));
    k[n || 0].click();
  };
  window.__skriv = (sel, verdi) => {
    const e = document.querySelector(sel);
    e.value = verdi;
    e.dispatchEvent(new Event("input", { bubbles: true }));
  };
  window.__venterPaa = async (sel, ms) => {
    const t = Date.now();
    while (!document.querySelector(sel)) {
      if (Date.now() - t > (ms || 10000)) throw new Error("fant ikke " + sel);
      await window.__v(100);
    }
  };

  if (localStorage.getItem("vedsalg.v1")) return;
  const dag = (n, t) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(t || 12, 0, 0, 0); return d.toISOString(); };
  const dato = (y, m, d) => new Date(y, m - 1, d, 12).toISOString();
  const priser = { sekk: 125, gran: 79, m3: 2000 };
  const tilbod = { kjop: "sekk", per: 10, gratis: "gran", antal: 1 };
  const o = (x) => {
    x.antall = Object.assign({ sekk: 0, gran: 0, m3: 0 }, x.antall);
    const ved = x.antall.sekk * 125 + x.antall.gran * 79 + x.antall.m3 * 2000;
    return Object.assign({
      kilde: "app", navn: "", telefon: "", notat: "", adresse: "", punkt: null, km: null, omtrent: false,
      manuellFrakt: null, fraktUkjent: false, priser, tilbod, levering: x.frakt > 0, frakt: 0, status: "ferdig",
      betalt: "vipps", betaltDato: x.ferdig, ved, total: ved + (x.frakt || 0),
    }, x, { opprettet: x.opprettet || x.ferdig });
  };
  const ordre = [
    o({ id: "demo1", opprettet: dag(2, 18), navn: "Kari Nordmann", telefon: "00000000", antall: { sekk: 10, m3: 0 },
      levering: true, adresse: "Storehagen 1A, 6800 Førde", punkt: { lat: 61.45191, lon: 5.85663 }, km: 32.9, frakt: 250,
      notat: "Laurdag føremiddag, legg ved garasjen", status: "aapen", ferdig: null, betalt: null, betaltDato: null }),
    o({ id: "demo2", opprettet: dag(1, 9), navn: "Ola Nordmann", telefon: "00000000", antall: { sekk: 0, gran: 2, m3: 1.5 },
      levering: false, frakt: 0, notat: "Kjem med hengar torsdag", status: "aapen", ferdig: null, betalt: null, betaltDato: null }),
    o({ id: "demo3", opprettet: dag(8), navn: "Per Hansen", telefon: "00000000", antall: { sekk: 5, gran: 1, m3: 0 },
      levering: true, adresse: "Naustdal sentrum", punkt: { lat: 61.51108, lon: 5.71694 }, km: 20.5, frakt: 150,
      ferdig: dag(5), betalt: null, betaltDato: null }),
  ];
  const historikk = [
    [2025, 10, 12, 15, 0, 250, 2], [2025, 11, 3, 0, 2, 250], [2025, 11, 20, 10, 0, 150], [2025, 12, 10, 20, 0, 250],
    [2026, 1, 8, 10, 0, 250], [2026, 1, 15, 20, 0, 250, 3], [2026, 1, 22, 0, 1, 0], [2026, 2, 3, 8, 0, 150],
    [2026, 2, 19, 0, 2, 250], [2026, 3, 5, 6, 0, 0], [2026, 3, 20, 10, 0, 250], [2026, 9, 10, 12, 0, 150],
    [2026, 9, 18, 0, 1, 250], [2026, 9, 21, 15, 0, 250, 2],
  ];
  historikk.forEach(([y, m, d, sekk, m3, frakt, gran], i) => ordre.push(o({
    id: "hist" + i, navn: ["Anne", "Jon", "Silje", "Arne", "Marit", "Knut", "Ingrid"][i % 7] + " (døme)",
    antall: { sekk, m3, gran: gran || 0 }, frakt, ferdig: dato(y, m, d), betalt: i % 3 === 0 ? "kontant" : "vipps",
  })));
  localStorage.setItem("vedsalg.v1", JSON.stringify({ ordre }));
})();
