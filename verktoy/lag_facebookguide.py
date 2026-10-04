#!/usr/bin/env python3
# © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
"""Lager «Vedsal – Facebook-guide».pdf (1 side, nynorsk): korleis pappa legg ut annonsen i ei Facebook-gruppe.

Kjør:  python3 verktoy/lag_facebookguide.py
"""
import os

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

import config as k
from lag_veiledning import (BROD, DEMPET, GRONN, GRONN_L, GUL, GUL_K, KORT, KREM, LINJE, M, TEKST, H, W,
                            boks, hoyde, knapp, nummer, para, stil)

UT = os.path.join(k.ROT, "leveranse", "Vedsal – Facebook-guide.pdf")
RAUD = HexColor("#c62828")
FB_BLAA = HexColor("#1877f2")


def kryss(c, x, y, r=10):
    c.setFillColor(RAUD)
    c.circle(x, y, r, fill=1, stroke=0)
    c.setStrokeColor(white)
    c.setLineWidth(2.2)
    c.line(x - r * 0.42, y - r * 0.42, x + r * 0.42, y + r * 0.42)
    c.line(x - r * 0.42, y + r * 0.42, x + r * 0.42, y - r * 0.42)


STEG = stil("t", fontSize=12, leading=16.5)
TB = 282  # tekstbreidd i stega


def steg(c, y, nr, tittel, tekst, hogd, teikn):
    """Éin blokk: nummer, tittel og tekst til venstre, ein enkel illustrasjon til høgre. Blir høgare om teksten krev det."""
    hogd = max(hogd, 48 + hoyde(tekst, TB, STEG) + 12)
    c.setFillColor(KREM)
    c.roundRect(M, y - hogd, W - 2 * M, hogd, 16, fill=1, stroke=0)
    nummer(c, M + 30, y - 32, nr, r=19)
    c.setFillColor(TEKST)
    c.setFont("Av-H", 17)
    c.drawString(M + 60, y - 38, tittel)
    para(c, tekst, M + 60, y - 48, TB, STEG)
    teikn(c, M + 72 + TB, y - hogd + 14, W - 2 * M - 86 - TB, hogd - 28)
    return y - hogd - 8


def teikn_kopier(c, x, y, w, h):
    knapp(c, x, y + h / 2 - 24, w, 48, "Kopier annonsen", True, None, fs=13.5)


def teikn_skriv(c, x, y, w, h):
    # Skrivefeltet øvst i gruppa (Facebook på bokmål: «Skriv noe …») – og «Selg noe» med kryss over.
    c.setFillColor(white)
    c.setStrokeColor(LINJE)
    c.setLineWidth(1)
    c.roundRect(x, y + h - 44, w, 40, 20, fill=1, stroke=1)
    c.setFillColor(DEMPET)
    c.setFont("Av-R", 13.5)
    c.drawString(x + 16, y + h - 29, "Skriv noe …")
    c.setFillColor(GRONN)
    c.setFont("Av-H", 11)
    c.drawString(x + 16, y + h - 58, "Trykk her")
    c.setFillColor(HexColor("#e4e6eb"))
    c.roundRect(x, y + 2, 92, 28, 14, fill=1, stroke=0)
    c.setFillColor(DEMPET)
    c.setFont("Av-D", 11.5)
    c.drawCentredString(x + 46, y + 12, "Selg noe")
    c.setStrokeColor(RAUD)
    c.setLineWidth(1.6)
    c.line(x + 14, y + 16, x + 78, y + 16)
    kryss(c, x + 92, y + 26, r=9)
    c.setFillColor(RAUD)
    c.setFont("Av-H", 11)
    c.drawString(x + 106, y + 12, "Nei")


def teikn_lim(c, x, y, w, h):
    c.setFillColor(white)
    c.setStrokeColor(LINJE)
    c.roundRect(x, y + 8, w, 40, 10, fill=1, stroke=1)
    c.setFillColor(RAUD)
    c.setFont("Av-H", 12)
    c.drawCentredString(x + w / 2, y + 23, "Trykk éin gong!")
    c.setFillColor(HexColor("#2b2b2b"))
    c.roundRect(x + w / 2 - 55, y + 50, 110, 32, 10, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Av-B", 14)
    c.drawCentredString(x + w / 2, y + 60, "Lim inn")


def teikn_publiser(c, x, y, w, h):
    bilete = os.path.join(k.ROT, "og-bilde.jpg")
    bh = min((w - 4) * 630 / 1200, h - 64)  # behald forholdet 1200 × 630
    bw = bh * 1200 / 630
    c.setStrokeColor(LINJE)
    c.setFillColor(white)
    c.roundRect(x, y + 34, w, bh + 30, 8, fill=1, stroke=1)
    c.drawImage(bilete, x + (w - bw) / 2, y + 62, bw, bh)
    c.setFillColor(DEMPET)
    c.setFont("Av-R", 9)
    c.drawString(x + 8, y + 50, "VEDFRATEIGEN.GITHUB.IO")
    c.setFillColor(TEKST)
    c.setFont("Av-D", 10)
    c.drawString(x + 8, y + 38, "Tørr ved – Ved frå Teigen")
    c.setFillColor(FB_BLAA)
    c.roundRect(x + w - 92, y, 92, 28, 8, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Av-B", 12.5)
    c.drawCentredString(x + w - 46, y + 9, "Publiser")


def main():
    c = canvas.Canvas(UT, pagesize=A4)
    c.setTitle("Vedsal – Facebook-guide")
    c.setAuthor("Benjamin Bruflot Teigen")
    c.setFillColor(white)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GRONN)
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)
    c.setFont("Av-D", 8.5)
    c.setFillColor(DEMPET)
    c.drawString(M, H - 32, "VEDSAL  ·  FACEBOOK-GUIDE")
    c.setFont("Av-H", 25)
    c.setFillColor(TEKST)
    c.drawString(M, H - 76, "Slik legg du ut annonsen på Facebook")
    c.setFont("Av-D", 13)
    c.setFillColor(DEMPET)
    c.drawString(M, H - 98, "Fire steg. Gjer dei i rekkjefølgje – då verkar lenkja, så folk kan trykke og bestille.")
    y = H - 110

    y = steg(c, y, 1, "Kopier annonsen", "Opne <b>Vedsal</b> og trykk <b>«Facebook-annonse»</b>. Trykk den store grøne knappen "
             "<b>«Kopier annonsen»</b>.", 96, teikn_kopier)
    y = steg(c, y, 2, "Opne gruppa", "Opne <b>Facebook</b> og gå inn i gruppa (t.d. kjøp og sal for Førde eller Naustdal). "
             "Trykk på <b>skrivefeltet øvst</b> – der det står «Skriv noe …». <b>Ikkje vel «Selg noe»</b>: der verkar ikkje lenkja.",
             110, teikn_skriv)
    y = steg(c, y, 3, "Lim inn éin gong", "Er det alt tekst i feltet, tøm det først. <b>Hald fingeren</b> i feltet til «Lim inn» "
             "kjem opp. Trykk <b>«Lim inn» éin gong</b>.", 96, teikn_lim)
    y = steg(c, y, 4, "Vent – og publiser", "Vent nokre sekund til det kjem eit <b>bilete av veden med prisane</b>. Trykk <b>«Publiser»</b>. "
             "Ferdig! Kjem det ikkje noko bilete, er det greitt – lenkja verkar likevel.", 150, teikn_publiser)

    # Ikkje gjer dette
    punkt = ["Ikkje ta <b>skjermbilde</b> av annonsen – då kan ikkje folk trykke på lenkja.",
             "Ikkje trykk <b>«Lim inn» fleire gonger</b> – då blir teksten dobbel.",
             "Ikkje legg ut i <b>meir enn 2–3 grupper</b> same dag – då kan Facebook stoppe innlegga."]
    pst = stil("n", fontSize=11.5, leading=14.5)
    hh = 38 + sum(hoyde(t, W - 2 * M - 60, pst) + 5 for t in punkt)
    c.setFillColor(HexColor("#fdecea"))
    c.setStrokeColor(RAUD)
    c.setLineWidth(1.2)
    c.roundRect(M, y - hh, W - 2 * M, hh, 14, fill=1, stroke=1)
    c.setFillColor(RAUD)
    c.setFont("Av-H", 15)
    c.drawString(M + 16, y - 22, "Ikkje gjer dette")
    yy = y - 34
    for t in punkt:
        kryss(c, M + 26, yy - 7, r=8)
        yy = para(c, t, M + 44, yy, W - 2 * M - 60, pst) - 5
    y -= hh + 8
    y = boks(c, M, y, W - 2 * M, "<b>Kom teksten dobbelt?</b> Hald inne sletteknappen på tastaturet (pila med kryss i, til høgre) "
             "til feltet er heilt tomt. Lim så inn éin gong. <b>Står det at innlegget ventar på godkjenning?</b> Då er alt i orden – "
             "ikkje legg det ut på nytt. Lurer du på noko? Ring Benjamin – 913&nbsp;47&nbsp;058.", bg=GRONN_L, st=KORT)
    assert y >= 34, f"Facebook-guiden går over arket (y = {y:.0f})"
    c.setFont("Av-R", 8)
    c.setFillColor(DEMPET)
    c.drawString(M, 20, "Vedsal © 2026 Benjamin Bruflot Teigen · tlf. 913 47 058")
    c.showPage()
    c.save()
    print("Laget:", UT)


if __name__ == "__main__":
    main()
