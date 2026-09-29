#!/usr/bin/env python3
# © 2026 Benjamin Teigen. Alle rettigheter forbeholdt – se LICENSE.
"""Lager «Vedsal – huskeliste» (2 sider, nynorsk): kva pappa gjer i kvar situasjon. Til kjøleskapet.

Kjør:  python3 verktoy/lag_huskeliste.py
"""
import os

from reportlab.lib.colors import white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

import config as k
from lag_veiledning import (BRUN, BRUN_L, BROD, DEMPET, GRONN, GRONN_L, GUL, GUL_K, KORT, KREM, LINJE, M, TEKST,
                            H, W, boks, hoyde, knapp, nummer, para, stil)

UT = os.path.join(k.ROT, "leveranse", "Vedsal – huskeliste.pdf")
FORNAVN = k.C["selgerFornavn"]
R = k.C.get("rabatt") or {}
MINST = k.C["levering"]["minstSekkar"]


def topp(c, nr, tittel, ingress=None):
    c.setFillColor(white)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GRONN)
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)
    c.setFont("Av-D", 8.5)
    c.setFillColor(DEMPET)
    c.drawString(M, H - 32, "VEDSAL  ·  HUSKELISTE")
    c.drawRightString(W - M, H - 32, f"SIDE {nr} AV 2")
    c.setFont("Av-R", 8)
    c.drawString(M, 20, "Vedsal © 2026 Benjamin Teigen")
    c.setFont("Av-H", 26)
    c.setFillColor(TEKST)
    c.drawString(M, H - 80, tittel)
    y = H - 96
    if ingress:
        y = para(c, ingress, M, y, W - 2 * M, stil("ing", fontSize=14, leading=20)) - 10
    return y


def seksjonstittel(c, y, tekst, farge=BRUN):
    c.setFillColor(farge)
    c.roundRect(M, y - 26, W - 2 * M, 26, 8, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Av-B", 13.5)
    c.drawString(M + 12, y - 18, tekst)
    return y - 38


def side1(c):
    y = topp(c, 1, "Når nokon vil kjøpe ved", (
        f"<b>Éin regel: Alt sal skal inn i Vedsal</b> – same om kunden ringjer, skriv på Facebook, sender SMS "
        f"eller kjem innom. Då hugsar appen alt for deg, og oversikta over salet blir rett."))

    # Fire vegar inn – éin knapp
    bw = (W - 2 * M - 3 * 10) / 4
    for i, tekst in enumerate(["Ringjer", "Skriv på Facebook", "Sender vanleg SMS", "Snakkar med deg"]):
        x = M + i * (bw + 10)
        c.setFillColor(KREM)
        c.roundRect(x, y - 38, bw, 38, 10, fill=1, stroke=0)
        c.setFillColor(TEKST)
        c.setFont("Av-D", 11.5)
        c.drawCentredString(x + bw / 2, y - 23, tekst)
    y -= 50
    c.setFillColor(DEMPET)
    c.setFont("Av-D", 11)
    c.drawCentredString(W / 2, y - 4, "Alle desse: opne Vedsal og trykk")
    knapp(c, W / 2 - 125, y - 66, 250, 50, "Ny bestilling", True, "pluss", fs=17)
    y -= 84

    # Spør kunden om dette
    hh = 150
    c.setFillColor(GRONN_L)
    c.roundRect(M, y - hh, W - 2 * M, hh, 14, fill=1, stroke=0)
    c.setFillColor(TEKST)
    c.setFont("Av-H", 14.5)
    c.drawString(M + 16, y - 24, "Spør kunden om dette – og fyll inn medan de snakkar:")
    yy = y - 42
    for n, t in enumerate(["<b>Kor mykje?</b> Sekkar bjørk, sekkar gran eller laus kubikk. Trykk <b>+</b>.",
                           "<b>Levering eller hentar sjølv?</b>",
                           "<b>Adressa</b> (ved levering). Trykk på rett forslag – frakta kjem av seg sjølv.",
                           "<b>Namn og mobilnummer.</b> Så trykkjer du <b>«Lagre bestillinga»</b>."], 1):
        nummer(c, M + 28, yy - 8, n, r=10)
        yy = para(c, t, M + 46, yy, W - 2 * M - 62, stil("s", fontSize=12, leading=16.5)) - 6
    y -= hh + 12

    # To gode tips
    kol = (W - 2 * M - 14) / 2
    t1 = ("<b>Fast kunde?</b> Skriv dei første bokstavane i namnet og trykk på forslaget. "
          "Telefon og adresse kjem av seg sjølv.")
    t2 = ("<b>Har du det travelt?</b> Skriv berre namn og kor mykje, og trykk «Lagre bestillinga». "
          "Resten fyller du inn seinare med «Endre».")
    h1 = max(hoyde(t1, kol - 28, KORT), hoyde(t2, kol - 28, KORT)) + 28
    for i, t in enumerate((t1, t2)):
        x = M + i * (kol + 14)
        c.setFillColor(KREM)
        c.roundRect(x, y - h1, kol, h1, 12, fill=1, stroke=0)
        para(c, t, x + 14, y - 14, kol - 28, KORT)
    y -= h1 + 18

    # Frå nettsida
    y = seksjonstittel(c, y, "Bestillinga kjem på SMS frå nettsida (med ei blå lenkje nedst)", GRONN)
    y = para(c, "Trykk på <b>den blå lenkja</b> nedst i SMS-en. Då opnar bestillinga seg i Vedsal, ferdig utfylt. "
             "Sjekk at alt stemmer og trykk <b>«Lagre bestillinga»</b>. Du treng ikkje skrive noko.",
             M, y, W - 2 * M, BROD) - 16

    # Kunden er der og betalar
    y = seksjonstittel(c, y, "Kunden står der og betalar med ein gong", GRONN)
    y = para(c, "<b>«Ny bestilling»</b> › trykk <b>+</b> › nedst på sida: trykk <b>«Betalt med Vipps»</b> eller "
             "<b>«Betalt kontant»</b>. Ferdig! Salet er ført, og det kjem med i oversikta.",
             M, y, W - 2 * M, BROD) - 14

    boks(c, M, y, W - 2 * M, f"<b>Appen passar på for deg:</b> Frakta blir rekna ut av seg sjølv. "
         f"Rabatten ({R.get('fraAntal', 20)} sekkar bjørk eller fleire: {k.kr(R.get('pris', 120))} per sekk) kjem av seg sjølv. "
         f"Er ei levering under {MINST} sekkar, seier appen frå – men du kan lagre likevel.", bg=GUL, kant=GUL_K, st=KORT)


def side2(c):
    y = topp(c, 2, "Etterpå – kva trykkjer eg på?")
    rader = [
        ("Veden er levert eller henta", "«Ferdig» › «Ja, Vipps» eller «Ja, kontant». Ikkje betalt enno? «Nei, ikkje enno»."),
        ("Pengane kjem seinare", "Kunden står under «Ventar på betaling». Trykk «Betalt» når pengane er komne."),
        ("Kunden har ikkje betalt etter ei stund", "«Minn på» – då går det ein venleg SMS til kunden."),
        ("Kunden vil endre noko", "«Endre» på kunden › rett det › «Lagre bestillinga»."),
        ("Kunden avbestiller", "«Endre» på kunden › «Slett bestillinga» (heilt nedst)."),
        ("Du trykte feil", "«Angre» nedst på skjermen – med ein gong. Elles: «Endre»."),
        ("Du gjekk ut før du lagra", "Ingen fare. Trykk «Hald fram» på framsida."),
        ("Kunden vil ha kvittering", "«Ferdige og betalte» (nedst på framsida) › «Kvittering»."),
        ("Vennepris eller avtalt pris", "Under summen: «Endre totalprisen» › skriv beløpet."),
        ("Du leverer til fleire på same tur", "«Endre frakt» på kvar bestilling › skriv beløpet."),
        ("Ingen dekning", "Appen verkar likevel. Adressa blir ikkje funnen – skriv frakta sjølv."),
        ("Tomt for gran eller bjørk", "Sei frå til Benjamin – då står det «Utselt no» på nettsida."),
        ("Appen minner om tryggingskopi", "«Send tryggingskopi no» › vel Benjamin (SMS eller Messenger)."),
        ("Du vil ha ut ei annonse", "«Facebook-annonse» › vel bilete › «Del på Facebook» › vel Facebook › lim inn teksten."),
        ("Kunden vil ha påminning neste haust", "Kryss av i bestillinga (spør først). Neste haust minner appen deg på å sende SMS."),
    ]
    kol1 = 190
    kol2 = W - 2 * M - kol1 - 16
    for i, (sit, gjer) in enumerate(rader):
        hh = max(hoyde(gjer, kol2, stil("g", fontSize=11.5, leading=15.5)),
                 hoyde(sit, kol1 - 20, stil("s", fontName="Av-D", fontSize=11.5, leading=15.5))) + 12
        if i % 2 == 0:
            c.setFillColor(KREM)
            c.roundRect(M, y - hh, W - 2 * M, hh, 8, fill=1, stroke=0)
        para(c, sit, M + 12, y - 6, kol1 - 20, stil("s", fontName="Av-D", fontSize=11.5, leading=15.5))
        para(c, gjer, M + kol1 + 4, y - 6, kol2, stil("g", fontSize=11.5, leading=15.5))
        y -= hh + 1
    y -= 14

    # Gylne reglar
    hh = 150
    c.setFillColor(GRONN)
    c.roundRect(M, y - hh, W - 2 * M, hh, 16, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Av-H", 17)
    c.drawString(M + 20, y - 30, "Fire gylne reglar")
    hvit = stil("hv", fontSize=12.5, leading=17, textColor=white)
    yy = y - 46
    for n, t in enumerate(["<b>Alt sal inn i Vedsal</b> – òg dei som hentar og betalar med ein gong.",
                           "Trykk <b>«Ferdig»</b> når veden er levert eller henta.",
                           "Trykk <b>«Betalt»</b> når pengane er komne.",
                           "<b>Du kan ikkje øydeleggje noko.</b> Lurer du på noko? Ring Benjamin."], 1):
        nummer(c, M + 32, yy - 8, n, r=10, farge=BRUN)
        yy = para(c, t, M + 52, yy, W - 2 * M - 72, hvit) - 6


def main():
    c = canvas.Canvas(UT, pagesize=A4)
    c.setTitle("Vedsal – huskeliste")
    c.setAuthor("Benjamin Teigen")
    side1(c)
    c.showPage()
    side2(c)
    c.showPage()
    c.save()
    print("Laget:", UT)


if __name__ == "__main__":
    main()
