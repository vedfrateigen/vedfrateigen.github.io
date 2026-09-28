// Tester for regnestykkene og bestillingslenka. Kjør: node tester/test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const rot = new URL("..", import.meta.url);
const kontekst = { window: {}, URLSearchParams, Intl, Math, Number, Object, Date, isFinite, encodeURIComponent };
kontekst.window = kontekst;
vm.createContext(kontekst);
for (const fil of ["config.js", "felles.js"]) vm.runInContext(readFileSync(new URL(fil, rot), "utf8"), kontekst);
const V = kontekst.Ved;
const nbsp = " ";
let ok = 0;
const test = (navn, fn) => { fn(); ok++; console.log("✔", navn); };

test("frakt: 3,50 kr per km tur/retur, rundet opp til 50, minst 100", () => {
  assert.equal(V.leveringspris(20.5), 150);   // Naustdal sentrum: 143,50 → 150
  assert.equal(V.leveringspris(32.5), 250);   // Førde sentrum: 227,50 → 250
  assert.equal(V.leveringspris(62.4), 450);   // Florø: 436,80 → 450
  assert.equal(V.leveringspris(1), 100);      // minstepris
  assert.equal(V.leveringspris(0), 100);
  assert.equal(V.leveringspris(100 / 7), 100); // nøyaktig 100 kr skal ikke rundes opp til 150
});

test("frakt: ukjent eller for lang avstand gir «etter avtale» (null)", () => {
  assert.equal(V.leveringspris(null), null);
  assert.equal(V.leveringspris(150), null);
  assert.equal(V.leveringspris(-3), null);
  assert.equal(V.leveringspris(NaN), null);
});

test("varesum og totalsum med bjørk, gran og kubikk", () => {
  const s = { antall: { sekk: 10, gran: 2, m3: 1.5 }, levering: true, km: 32.9, manuellFrakt: null };
  const b = V.beregn(s);
  assert.equal(b.ved, 10 * 125 + 2 * 79 + 1.5 * 2000);
  assert.equal(b.frakt, 250);
  assert.equal(b.total, 4408 + 250);
  assert.equal(b.fraktUkjent, false);
});

test("henting gir 0 i frakt, manuell frakt overstyrer", () => {
  assert.equal(V.beregn({ antall: { sekk: 4 }, levering: false }).total, 500);
  assert.equal(V.beregn({ antall: { sekk: 4 }, levering: true, km: 32.9, manuellFrakt: 0 }).total, 500);
  assert.equal(V.beregn({ antall: { sekk: 4 }, levering: true, km: null, manuellFrakt: null }).fraktUkjent, true);
});

test("gamle priser i en lagret bestilling brukes, ikke dagens", () => {
  assert.equal(V.varesum({ sekk: 2, gran: 0, m3: 0 }, { sekk: 100, gran: 70, m3: 1800 }), 200);
});

test("rabatt: 20 sekkar bjørk eller fleire kostar 120 kr per sekk", () => {
  assert.equal(V.beregn({ antall: { sekk: 19 }, levering: false }).ved, 19 * 125);
  assert.equal(V.beregn({ antall: { sekk: 20 }, levering: false }).ved, 20 * 120);
  assert.equal(V.beregn({ antall: { sekk: 25, gran: 5 }, levering: false }).ved, 25 * 120 + 5 * 79);
  assert.equal(V.beregn({ antall: { sekk: 10, gran: 15 }, levering: false }).ved, 10 * 125 + 15 * 79); // gran tel ikkje
});

test("rabatt: gamle bestillingar utan rabatt blir ikkje endra, nye får rabatten", () => {
  const gamal = { antall: { sekk: 25 }, levering: false, priser: { sekk: 125, gran: 79, m3: 2000 } };
  assert.equal(V.beregn(gamal).ved, 25 * 125);
  assert.equal(V.beregn({ ...gamal, rabatt: V.C.rabatt }).ved, 25 * 120);
});

test("minstebestilling for levering: 10 sekkar eller 1 m³", () => {
  assert.equal(V.leveringOk({ sekk: 9 }), false);
  assert.equal(V.leveringOk({ sekk: 10 }), true);
  assert.equal(V.leveringOk({ sekk: 6, gran: 4 }), true);
  assert.equal(V.leveringOk({ m3: 0.5 }), false);
  assert.equal(V.leveringOk({ m3: 1 }), true);
  assert.equal(V.leveringOk({ m3: 0.5, gran: 2 }), true);
});

test("tekst på nynorsk", () => {
  assert.equal(V.beskrivAntall({ sekk: 10, gran: 1, m3: 1.5 }), "10 sekkar bjørk og 1 sekk gran og 1,5 m³ laus bjørk");
  assert.equal(V.kr(1658), "1" + nbsp + "658" + nbsp + "kr");
});

test("telefon og SMS-lenke", () => {
  assert.equal(V.telefonLenke("917 50 205"), "+4791750205");
  assert.equal(V.visTelefon("91750205"), "917 50 205");
  assert.ok(V.smsLenke("91750205", "Hei å").startsWith("sms:+4791750205?&body=Hei%20%C3%A5"));
});

test("bestilling tur/retur gjennom lenka", () => {
  const o = { id: "abc123", navn: "Kari Nordmann", telefon: "000 00 000", antall: { sekk: 10, gran: 2, m3: 0 },
    levering: true, adresse: "Storehagen 1A, 6800 Førde", punkt: { lat: 61.45191, lon: 5.85663 }, km: 32.9, notat: "Laurdag" };
  const tilbake = V.paramTilOrdre(V.ordreTilParam(o));
  assert.equal(tilbake.navn, o.navn);
  assert.equal(tilbake.adresse, o.adresse);
  assert.equal(tilbake.antall.sekk, 10);
  assert.equal(tilbake.antall.gran, 2);
  assert.equal(tilbake.km, 32.9);
  assert.equal(tilbake.levering, true);
  assert.deepEqual({ ...tilbake.punkt }, { lat: 61.45191, lon: 5.85663 });
});

test("lenka tåler juks: grenser på antall, tekstlengde og id", () => {
  const o = V.paramTilOrdre("i=<script>x&n=" + "a".repeat(500) + "&sekk=99999&m3=-4&gran=abc&la=999&lo=5&k=-1");
  assert.equal(o.id, "scriptx");
  assert.equal(o.navn.length, 80);
  assert.equal(o.antall.sekk, 300);
  assert.equal(o.antall.m3, 0);
  assert.equal(o.antall.gran, 0);
  assert.equal(o.punkt, null);
  assert.equal(o.km, null);
  assert.equal(V.paramTilOrdre("n=utan+id"), null);
});

test("adressetolking", () => {
  const t = (s) => ({ ...V.tolkAdresse(s) });
  assert.deepEqual(t("storehagen 1a førde"), { gate: "storehagen", nr: "1a", sted: "førde" });
  assert.deepEqual(t("Storehagen 1, Førde"), { gate: "Storehagen", nr: "1", sted: "Førde" });
  assert.deepEqual(t("vevring"), { gate: "vevring", nr: "", sted: "" });
  assert.deepEqual(t("Teigavegen 131"), { gate: "Teigavegen", nr: "131", sted: "" });
});

console.log(`\n${ok} tester OK`);
