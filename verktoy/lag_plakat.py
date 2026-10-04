#!/usr/bin/env python3
# © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
"""Lager A4-plakaten (med QR-kode og avrivingslappar) og ark med små kort til å leggje i leveransane.

Kjør:  python3 verktoy/lag_plakat.py https://<adressa-til-nettsida>/
Utan adresse blir det eit utkast der QR-koden manglar.
"""
import os
import sys

from PIL import Image, ImageOps
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

import config as k

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BYGG = os.path.join(ROT, "verktoy", "bygg")
UT = os.path.join(ROT, "leveranse")
os.makedirs(BYGG, exist_ok=True)
os.makedirs(UT, exist_ok=True)

AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
for navn, nr in [("R", 7), ("M", 5), ("D", 2), ("B", 0), ("H", 8)]:
    pdfmetrics.registerFont(TTFont("Av-" + navn, AVENIR, subfontIndex=nr))

GRONN, GRONN_M, BRUN, RAUD = HexColor("#2f6b3f"), HexColor("#24542f"), HexColor("#8b4a1c"), HexColor("#c62828")
TEKST, DEMPET, LINJE, KREM = HexColor("#231c15"), HexColor("#6a5c4d"), HexColor("#e2d8c9"), HexColor("#f6f1e9")
W, H = A4
M = 40

URL = sys.argv[1] if len(sys.argv) > 1 else None
TELEFON = k.telefon()
SELGER = k.C["selger"]
FORNAVN = k.C["selgerFornavn"]
PRISAR = [(p["kortnavn"], p["detalj"].lower(), k.kr(p["pris"])) for p in k.C["produkter"]]
R = k.C.get("rabatt")
if R:
    PRISAR.append((f"{R['fraAntal']} sekkar bjørk eller fleire", "TILBOD – pris per sekk", k.kr(R["pris"])))
MINST = k.C["levering"]["minstSekkar"]


def foto(navn, forhold, fokus=0.5, bredde=2400):
    im = ImageOps.exif_transpose(Image.open(os.path.join(ROT, "verktoy", "foto", navn))).convert("RGB")
    w, h = im.size
    nh = int(w / forhold)
    y = int((h - nh) * fokus)
    im = im.crop((0, y, w, y + nh)).resize((bredde, int(bredde / forhold)), Image.LANCZOS)
    sti = os.path.join(BYGG, "plakat-" + navn)
    im.save(sti, quality=88)  # utan EXIF/GPS
    return sti


def qr(c, x, y, storrelse, tekst):
    w = QrCodeWidget(tekst, barLevel="M")
    x0, y0, x1, y1 = w.getBounds()
    d = Drawing(storrelse, storrelse, transform=[storrelse / (x1 - x0), 0, 0, storrelse / (y1 - y0), 0, 0])
    d.add(w)
    renderPDF.draw(d, c, x, y)


def qr_eller_plass(c, x, y, s):
    if URL:
        qr(c, x, y, s, URL)
    else:
        c.setFillColor(HexColor("#eeeeee"))
        c.rect(x, y, s, s, fill=1, stroke=0)
        c.setFillColor(DEMPET)
        c.setFont("Av-D", s * 0.075)
        c.drawCentredString(x + s / 2, y + s / 2 + 4, "QR-koden kjem")
        c.drawCentredString(x + s / 2, y + s / 2 - s * 0.09, "når sida er ute")


def plakat():
    sti = os.path.join(UT, "Plakat A4 – Ved frå Teigen.pdf")
    c = canvas.Canvas(sti, pagesize=A4)
    c.setTitle("Tørr ved til sals – Ved frå Teigen")
    c.setAuthor("Ved frå Teigen")

    # Foto øvst
    fh = 250
    c.drawImage(foto("IMG_4145.jpg", W / fh, 0.42), 0, H - fh, W, fh)
    c.setFillColor(GRONN)  # rein, grøn kant under fotoet
    c.rect(0, H - fh - 5, W, 5, fill=1, stroke=0)
    c.setFillColor(GRONN)
    c.roundRect(M, H - 62, 196, 36, 18, fill=1, stroke=0)
    c.drawImage(os.path.join(ROT, "ikon-192.png"), M + 6, H - 58, 28, 28, mask="auto")
    c.setFillColor(white)
    c.setFont("Av-B", 14)
    c.drawString(M + 42, H - 49, "VED FRÅ TEIGEN")
    if not URL:
        c.setFillColor(Color(0.55, 0.29, 0.11, alpha=0.9))
        c.roundRect(W - M - 70, H - 58, 70, 26, 13, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Av-B", 11)
        c.drawCentredString(W - M - 35, H - 49, "UTKAST")

    # Overskrift
    y = H - fh - 60
    c.setFillColor(TEKST)
    c.setFont("Av-H", 54)
    c.drawString(M - 2, y, "Tørr ved til sals")
    c.setFont("Av-M", 18)
    c.setFillColor(DEMPET)
    c.drawString(M, y - 30, "Bjørk til fyring  ·  Gran til opptenning")

    # Prisar (venstre) og QR (høgre)
    y -= 66
    kol = 300
    for i, (namn, detalj, pris) in enumerate(PRISAR):
        rabattrad = R and i == len(PRISAR) - 1
        c.setFillColor(RAUD if rabattrad else TEKST)
        c.setFont("Av-D", 17)
        c.drawString(M, y, namn)
        c.setFont("Av-B" if rabattrad else "Av-R", 12)
        c.setFillColor(RAUD if rabattrad else DEMPET)
        c.drawString(M, y - 17, detalj)
        c.setFillColor(RAUD if rabattrad else BRUN)
        c.setFont("Av-H", 25)
        c.drawRightString(M + kol, y - 6, pris)
        c.setStrokeColor(LINJE)
        c.setLineWidth(1)
        c.line(M, y - 29, M + kol, y - 29)
        y -= 43
    c.setFillColor(TEKST)
    c.setFont("Av-D", 13.5)
    for linje in [f"Levering frå {MINST} sekkar – frakt etter avstand",
                  "Eller hent sjølv: " + k.C["henteadresse"].split(",")[0] + ", Naustdal",
                  "Betal med Vipps eller kontant"]:
        c.setFillColor(GRONN)
        c.circle(M + 5, y + 4.5, 4, fill=1, stroke=0)
        c.setFillColor(TEKST)
        c.drawString(M + 16, y, linje)
        y -= 20

    qs = 168
    qx = W - M - qs - 8
    qy = 282
    c.setFillColor(KREM)
    c.roundRect(qx - 14, qy - 58, qs + 28, qs + 78, 16, fill=1, stroke=0)
    c.setFillColor(white)
    c.rect(qx - 4, qy - 4, qs + 8, qs + 8, fill=1, stroke=0)
    qr_eller_plass(c, qx, qy, qs)
    c.setFillColor(RAUD)
    c.setFont("Av-H", 17)
    c.drawCentredString(qx + qs / 2, qy - 26, "Skann og bestill her!")
    c.setFont("Av-R", 10.5)
    c.setFillColor(DEMPET)
    c.drawCentredString(qx + qs / 2, qy - 43, "Opne kameraet og peik på koden")

    # Raud «Bestill her!»-lapp på hjørnet av QR-boksen
    c.saveState()
    c.translate(qx + qs - 14, qy + qs + 36)  # innanfor utskriftsmargen, klar av sjølve koden
    c.rotate(-12)
    c.setFillColor(Color(0, 0, 0, alpha=0.18))
    c.circle(2, -3, 40, fill=1, stroke=0)
    c.setFillColor(RAUD)
    c.circle(0, 0, 40, fill=1, stroke=0)
    c.setStrokeColor(white)
    c.setLineWidth(1.5)
    c.circle(0, 0, 35, fill=0, stroke=1)
    c.setFillColor(white)
    c.setFont("Av-H", 15)
    c.drawCentredString(0, 3, "Bestill")
    c.drawCentredString(0, -14, "her!")
    c.restoreState()

    # Telefon
    by = 150
    c.setFillColor(GRONN)
    c.roundRect(M, by, W - 2 * M, 62, 18, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Av-M", 14)
    c.drawString(M + 22, by + 34, "Ring eller send SMS til")
    c.setFont("Av-B", 17)
    c.drawString(M + 22, by + 14, SELGER)
    c.setFont("Av-H", 32)
    c.drawRightString(W - M - 22, by + 19, TELEFON)

    # Avrivingslappar
    topp = 128
    c.setStrokeColor(DEMPET)
    c.setLineWidth(0.8)
    c.setDash(4, 3)
    c.line(0, topp, W, topp)
    n = 10
    bw = W / n
    for i in range(1, n):
        c.line(i * bw, 14, i * bw, topp)
    c.setDash()
    c.setFont("Av-R", 7.5)
    c.setFillColor(DEMPET)
    c.drawRightString(W - 8, topp + 4, "Riv av ein lapp")
    for i in range(n):
        c.saveState()
        c.translate(i * bw + bw / 2, 20)
        c.rotate(90)
        c.setFillColor(TEKST)
        c.setFont("Av-H", 14)
        c.drawString(4, 8, TELEFON)
        c.setFont("Av-D", 9.5)
        c.drawString(4, -4, SELGER)
        c.setFont("Av-D", 8.5)
        c.setFillColor(GRONN)
        c.drawString(4, -15, "Ved frå Teigen")
        c.restoreState()
    c.showPage()
    c.save()
    return sti


def kort():
    """Ti kort (85 × 55 mm) på eitt A4-ark – til å leggje i sekken eller dele ut."""
    sti = os.path.join(UT, "Kort til leveransar – Ved frå Teigen.pdf")
    c = canvas.Canvas(sti, pagesize=A4)
    c.setTitle("Kort – Ved frå Teigen")
    mm = 72 / 25.4
    kw, kh = 85 * mm, 55 * mm
    x0 = (W - 2 * kw) / 2
    y0 = (H - 5 * kh) / 2
    for r in range(5):
        for k in range(2):
            x = x0 + k * kw
            y = y0 + r * kh
            c.setFillColor(GRONN)
            c.rect(x, y + kh - 15 * mm, kw, 15 * mm, fill=1, stroke=0)
            c.drawImage(os.path.join(ROT, "ikon-192.png"), x + 4 * mm, y + kh - 12 * mm, 9 * mm, 9 * mm, mask="auto")
            c.setFillColor(white)
            c.setFont("Av-H", 12.5)
            c.drawString(x + 15 * mm, y + kh - 8.2 * mm, "Ved frå Teigen")
            c.setFont("Av-M", 7.5)
            c.drawString(x + 15 * mm, y + kh - 11.8 * mm, "Tørr bjørk og gran · Naustdal")
            c.setFillColor(TEKST)
            c.setFont("Av-H", 12)
            c.drawString(x + 5 * mm, y + 25 * mm, "Takk for handelen!")
            c.setFont("Av-R", 8.5)
            c.setFillColor(DEMPET)
            c.drawString(x + 5 * mm, y + 20.5 * mm, "Bestill igjen – skann koden,")
            c.drawString(x + 5 * mm, y + 16.8 * mm, "eller ring/send SMS:")
            c.setFillColor(TEKST)
            c.setFont("Av-H", 13)
            c.drawString(x + 5 * mm, y + 9.5 * mm, TELEFON)
            c.setFont("Av-D", 8)
            c.setFillColor(DEMPET)
            c.drawString(x + 5 * mm, y + 5.5 * mm, SELGER)
            qr_eller_plass(c, x + kw - 29 * mm, y + 5 * mm, 25 * mm)
            c.setFillColor(RAUD)
            c.setFont("Av-H", 8.5)
            c.drawCentredString(x + kw - 16.5 * mm, y + 31.3 * mm, "Bestill her!")
    c.setStrokeColor(LINJE)
    c.setLineWidth(0.5)
    for r in range(6):
        c.line(x0 - 6 * mm, y0 + r * kh, x0 + 2 * kw + 6 * mm, y0 + r * kh)
    for k in range(3):
        c.line(x0 + k * kw, y0 - 6 * mm, x0 + k * kw, y0 + 5 * kh + 6 * mm)
    c.showPage()
    c.save()
    return sti


if __name__ == "__main__":
    for sti in (plakat(), kort()):
        print("Laget:", sti, "(utkast utan QR)" if not URL else "")
