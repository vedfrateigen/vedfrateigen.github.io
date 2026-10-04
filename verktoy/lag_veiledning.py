#!/usr/bin/env python3
# © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
"""Lager «Vedsal – slik fungerer det» (PDF, nynorsk) med ekte skjermbilder fra appen.

Kjør fra prosjektmappa:  python3 verktoy/lag_veiledning.py
Skjermbildene lages først med verktoy/skjermbilder.swift (se README).
"""
import os
import urllib.parse

from PIL import Image
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

import config as k

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BILDER = os.path.join(ROT, "verktoy", "bilder")
BYGG = os.path.join(ROT, "verktoy", "bygg")
UT = os.path.join(ROT, "leveranse", "Vedsal – slik fungerer det.pdf")
os.makedirs(BYGG, exist_ok=True)
os.makedirs(os.path.dirname(UT), exist_ok=True)

AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
for navn, nr in [("R", 7), ("M", 5), ("D", 2), ("B", 0), ("H", 8), ("I", 4)]:
    pdfmetrics.registerFont(TTFont("Av-" + navn, AVENIR, subfontIndex=nr))
registerFontFamily("Av-R", normal="Av-R", bold="Av-D", italic="Av-I", boldItalic="Av-D")

GRONN, GRONN_M, GRONN_L = HexColor("#2f6b3f"), HexColor("#24542f"), HexColor("#e5efe6")
BRUN, BRUN_L, KREM = HexColor("#8b4a1c"), HexColor("#f3e5d6"), HexColor("#f6f1e9")
TEKST, DEMPET, LINJE = HexColor("#231c15"), HexColor("#6a5c4d"), HexColor("#e2d8c9")
GUL, GUL_K, MORK, BLAA = HexColor("#fff4d4"), HexColor("#e2bb5f"), HexColor("#1c1c1e"), HexColor("#1a5fb4")

W, H = A4
M = 48  # marg


def stil(navn, **kw):
    base = dict(fontName="Av-R", fontSize=12.5, leading=18.5, textColor=TEKST)
    base.update(kw)
    return ParagraphStyle(navn, **base)


BROD = stil("brod")
STOR = stil("stor", fontSize=15, leading=22)
LITEN = stil("liten", fontSize=10.5, leading=15, textColor=DEMPET)
KORT = stil("kort", fontSize=11, leading=15.5)


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def hoyde(html, w, st=BROD):
    return Paragraph(html, st).wrap(w, 10000)[1]


def para(c, html, x, y, w, st=BROD):
    p = Paragraph(html, st)
    _, h = p.wrap(w, 10000)
    p.drawOn(c, x, y - h)
    return y - h


def jpg(navn, boks=None, ut_navn=None):
    kilde = os.path.join(BILDER, navn)
    ut = os.path.join(BYGG, (ut_navn or navn.rsplit(".", 1)[0]) + ".jpg")
    im = Image.open(kilde).convert("RGB")
    if boks:
        im = im.crop(boks)
    im.save(ut, "JPEG", quality=90, optimize=True)
    return ut, im.size


# ---------- Byggeklosser ----------

def nummer(c, x, y, n, r=11, farge=BRUN):
    c.setFillColor(white)
    c.circle(x, y, r + 2, fill=1, stroke=0)
    c.setFillColor(farge)
    c.circle(x, y, r, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Av-B", r * 1.1)
    c.drawCentredString(x, y - r * 0.38, str(n))


def tegn_ikon(c, navn, cx, cy, s, farge):
    c.saveState()
    c.setStrokeColor(farge)
    c.setFillColor(farge)
    c.setLineWidth(s * 0.17)
    c.setLineCap(1)
    c.setLineJoin(1)
    if navn == "pluss":
        c.line(cx - s / 2, cy, cx + s / 2, cy)
        c.line(cx, cy - s / 2, cx, cy + s / 2)
    elif navn == "hake":
        p = c.beginPath()
        p.moveTo(cx - s * 0.45, cy)
        p.lineTo(cx - s * 0.1, cy - s * 0.36)
        p.lineTo(cx + s * 0.5, cy + s * 0.36)
        c.drawPath(p, stroke=1, fill=0)
    elif navn == "sms":
        c.setLineWidth(s * 0.12)
        c.roundRect(cx - s * 0.55, cy - s * 0.3, s * 1.1, s * 0.72, s * 0.2, fill=0, stroke=1)
        p = c.beginPath()
        p.moveTo(cx - s * 0.3, cy - s * 0.3)
        p.lineTo(cx - s * 0.42, cy - s * 0.55)
        p.lineTo(cx - s * 0.05, cy - s * 0.3)
        c.drawPath(p, stroke=1, fill=0)
    elif navn == "kr":
        c.setFont("Av-B", s * 0.8)
        c.drawCentredString(cx, cy - s * 0.28, "kr")
    elif navn == "liste":
        c.setLineWidth(s * 0.13)
        for i, dy in enumerate((0.36, 0, -0.36)):
            c.circle(cx - s * 0.42, cy + dy * s, s * 0.08, fill=1, stroke=0)
            c.line(cx - s * 0.2, cy + dy * s, cx + s * 0.5, cy + dy * s)
    elif navn == "graf":
        for i, hh in enumerate((0.45, 0.75, 1.05)):
            c.rect(cx - s * 0.5 + i * s * 0.38, cy - s * 0.5, s * 0.26, s * hh, fill=1, stroke=0)
    elif navn == "folk":
        c.circle(cx, cy + s * 0.22, s * 0.22, fill=1, stroke=0)
        c.wedge(cx - s * 0.45, cy - s * 0.75, cx + s * 0.45, cy + s * 0.15, 0, 180, fill=1, stroke=0)
    c.restoreState()


def knapp(c, x, y, w, h, tekst, primar=True, ikon=None, fs=15):
    r = h * 0.26
    if primar:
        c.setFillColor(GRONN)
        c.roundRect(x, y, w, h, r, fill=1, stroke=0)
        farge = white
    else:
        c.setFillColor(white)
        c.setStrokeColor(GRONN)
        c.setLineWidth(1.8)
        c.roundRect(x, y, w, h, r, fill=1, stroke=1)
        farge = GRONN
    tw = c.stringWidth(tekst, "Av-B", fs)
    iw = fs * 0.95 if ikon else 0
    gap = fs * 0.5 if ikon else 0
    sx = x + (w - tw - iw - gap) / 2
    cy = y + h / 2
    if ikon:
        tegn_ikon(c, ikon, sx + iw / 2, cy, fs * 0.85, farge)
        sx += iw + gap
    c.setFillColor(farge)
    c.setFont("Av-B", fs)
    c.drawString(sx, cy - fs * 0.35, tekst)


def boks(c, x, y_top, w, html, bg=GRONN_L, st=BROD, pad=15, kant=None):
    h = hoyde(html, w - 2 * pad, st) + 2 * pad
    c.setFillColor(bg)
    c.roundRect(x, y_top - h, w, h, 12, fill=1, stroke=0)
    if kant:
        c.setStrokeColor(kant)
        c.setLineWidth(1)
        c.roundRect(x, y_top - h, w, h, 12, fill=0, stroke=1)
    para(c, html, x + pad, y_top - pad, w - 2 * pad, st)
    return y_top - h


def telefon(c, bilde, x, y_top, w, markorer=(), boks_px=None, side="h"):
    """Telefon med skjermbilde. markorer: [(nr, piksel-y fra toppen av bildet)]."""
    sti, (iw, ih) = jpg(bilde, boks_px, ut_navn=bilde.rsplit(".", 1)[0] + ("-k" if boks_px else ""))
    ramme = w * 0.035
    sw = w - 2 * ramme
    sh = sw * ih / iw
    h = sh + 2 * ramme
    y = y_top - h
    c.setFillColor(Color(0, 0, 0, alpha=0.10))
    c.roundRect(x + 2, y - 5, w, h, w * 0.12, fill=1, stroke=0)
    c.setFillColor(MORK)
    c.roundRect(x, y, w, h, w * 0.12, fill=1, stroke=0)
    c.saveState()
    p = c.beginPath()
    p.roundRect(x + ramme, y + ramme, sw, sh, w * 0.095)
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(sti, x + ramme, y + ramme, sw, sh)
    c.restoreState()
    for n, py in markorer:
        my = y + ramme + sh - py * sh / ih
        nummer(c, x + w + 1 if side == "h" else x - 1, my, n, r=11.5)
    return y


def bildeboks(c, bilde, x, y_top, w, radius=12):
    sti, (iw, ih) = jpg(bilde)
    h = w * ih / iw
    y = y_top - h
    c.saveState()
    p = c.beginPath()
    p.roundRect(x, y, w, h, radius)
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(sti, x, y, w, h)
    c.restoreState()
    c.setStrokeColor(LINJE)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, radius, fill=0, stroke=1)
    return y


def sms_boble(c, x, y_top, w, tekst, overskrift, utgaaende=False):
    c.setFont("Av-D", 9.5)
    c.setFillColor(DEMPET)
    c.drawString(x + 4, y_top - 10, overskrift)
    st = stil("sms", fontSize=11, leading=15.5)
    innerw = w - 28
    h = hoyde(tekst, innerw, st) + 22
    y = y_top - 18 - h
    farge = HexColor("#d8eedb") if utgaaende else HexColor("#ececef")
    c.setFillColor(farge)
    c.roundRect(x, y, w, h, 16, fill=1, stroke=0)
    p = c.beginPath()
    if utgaaende:
        p.moveTo(x + w - 22, y + 2)
        p.curveTo(x + w - 4, y - 2, x + w + 4, y - 4, x + w + 6, y - 6)
        p.curveTo(x + w - 2, y + 4, x + w - 2, y + 10, x + w - 4, y + 16)
    else:
        p.moveTo(x + 22, y + 2)
        p.curveTo(x + 4, y - 2, x - 4, y - 4, x - 6, y - 6)
        p.curveTo(x + 2, y + 4, x + 2, y + 10, x + 4, y + 16)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    para(c, tekst, x + 14, y + h - 11, innerw, st)
    return y - 8


def fordel(c, x, y_top, w, ikon, tittel, tekst):
    r = 18
    cx, cy = x + r, y_top - r
    c.setFillColor(GRONN)
    c.circle(cx, cy, r, fill=1, stroke=0)
    tegn_ikon(c, ikon, cx, cy, 16, white)
    tx = x + 2 * r + 14
    tw = w - (tx - x)
    y = para(c, tittel, tx, y_top + 1, tw, stil("ft", fontName="Av-D", fontSize=14.5, leading=19))
    y = para(c, tekst, tx, y - 1, tw, BROD)
    return min(y, cy - r) - 14


# ---------- Sidene ----------

side_nr = [0]


def ny_side(c, tittel, kapittel=None, ingress=None):
    if side_nr[0] > 0:
        c.showPage()
    side_nr[0] += 1
    c.setFillColor(white)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(GRONN)
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)
    c.setFont("Av-D", 8.5)
    c.setFillColor(DEMPET)
    c.drawString(M, H - 32, "VEDSAL  ·  SLIK FUNGERER DET")
    c.drawRightString(W - M, H - 32, "VED FRÅ TEIGEN")
    c.setFont("Av-M", 9.5)
    c.drawRightString(W - M, 28, str(side_nr[0]))
    y = H - 62
    tx = M
    if kapittel:
        nummer(c, M + 14, y - 13, kapittel, r=14)
        tx = M + 38
    c.setFont("Av-H", 25)
    c.setFillColor(TEKST)
    c.drawString(tx, y - 22, tittel)
    y -= 40
    if ingress:
        y = para(c, ingress, M, y - 4, W - 2 * M, STOR)
    return y - 16


def to_kolonner_steg(c, y, tekster, fs=11.5):
    kol = (W - 2 * M - 24) / 2
    halv = (len(tekster) + 1) // 2
    bunn = y
    for kolonne, del_ in enumerate((tekster[:halv], tekster[halv:])):
        yy = y
        for i, t in enumerate(del_):
            n = kolonne * halv + i + 1
            x = M + kolonne * (kol + 24)
            nummer(c, x + 11, yy - 9, n, r=11)
            yy = para(c, t, x + 30, yy, kol - 30, stil("lg", fontSize=fs, leading=fs * 1.42)) - 10
        bunn = min(bunn, yy)
    return bunn


def forside(c):
    side_nr[0] += 1
    c.setFillColor(KREM)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    # Foto av vedstabelen bak eit grønt slør
    topp_y = H * 0.36
    foto = os.path.join(ROT, "bilder", "stabel.jpg")
    c.saveState()
    p = c.beginPath()
    p.rect(0, topp_y, W, H - topp_y)
    c.clipPath(p, stroke=0, fill=0)
    fh = H - topp_y
    fw = fh * 16 / 9
    c.drawImage(foto, (W - fw) / 2, topp_y, fw, fh)
    c.setFillColor(Color(0.14, 0.33, 0.18, alpha=0.86))
    c.rect(0, topp_y, W, fh, fill=1, stroke=0)
    c.restoreState()
    c.setFillColor(GRONN_M)
    c.rect(0, topp_y, W, 5, fill=1, stroke=0)
    c.drawImage(os.path.join(ROT, "ikon-512.png"), M, H - 118, 54, 54, mask="auto")
    c.setFillColor(white)
    c.setFont("Av-B", 13)
    c.drawString(M + 66, H - 96, "VED FRÅ TEIGEN")
    c.setFont("Av-H", 60)
    c.drawString(M - 2, H - 215, "Vedsal")
    para(c, "Enkel hjelp til vedsalet –<br/>rett på mobilen din", M, H - 232, 270,
         stil("fs", fontName="Av-M", fontSize=21, leading=29, textColor=white))
    para(c, "Ei kort rettleiing: kva det er, kva du får ut av det, og korleis det verkar i praksis.",
         M, H - 312, 255, stil("fs2", fontSize=13, leading=19, textColor=HexColor("#dbe9dd")))
    telefon(c, "02-hjem-skjerm.png", W - M - 212, H - 92, 212)
    y = topp_y - 58
    for tekst in ["Reknar ut pris og frakt for deg", "Hugsar alle som skal ha ved", "Viser kven som har betalt"]:
        c.setFillColor(GRONN)
        c.circle(M + 13, y + 5, 13, fill=1, stroke=0)
        tegn_ikon(c, "hake", M + 13, y + 5, 12, white)
        c.setFillColor(TEKST)
        c.setFont("Av-D", 15.5)
        c.drawString(M + 36, y, tekst)
        y -= 40
    c.setFont("Av-R", 10.5)
    c.setFillColor(DEMPET)
    c.drawString(M, 44, "Laga til " + k.C["selgerFornavn"] + " av Benjamin Bruflot Teigen  ·  © 2026  ·  tlf. 913 47 058")


def side_nytte(c):
    y = ny_side(c, "Kva får du ut av det?", ingress=(
        "Du sel ved akkurat som før – på Facebook, på telefonen og til folk du kjenner. "
        "<b>Vedsal er ein liten hjelpar på mobilen som hugsar og reknar for deg.</b>"))
    bw = W - 2 * M
    for ikon, tittel, tekst in [
        ("kr", "Reknar ut prisen for deg", "Skriv adressa, så reknar appen ut køyreavstand og frakt. Same regel for alle – inga hovudrekning."),
        ("liste", "Du gløymer ingen", "Alle som skal ha ved, står på éi liste – med telefonnummer og veg dit på kartet."),
        ("hake", "Du ser kven som ikkje har betalt", "Eitt trykk når du får betalt. Manglar nokon, kan du sende ei venleg påminning på SMS."),
        ("sms", "Kundane kan bestille sjølve", "Ei eiga nettside der kundane ser prisen og sender deg bestillinga som ein vanleg SMS."),
        ("graf", "Oversikt over salet", "Kor mykje du har selt i år – og kor nær du er grensa for moms."),
    ]:
        y = fordel(c, M, y, bw, ikon, tittel, tekst)
    y -= 6
    y = boks(c, M, y, bw, "<b>Du kan ikkje øydeleggje noko.</b> Alt kan endrast, og det meste kan angrast med eitt trykk. "
             "Du bestemmer sjølv kor mykje du vil bruke det – og du kan framleis gjere alt som før.", bg=GRONN_L)
    y -= 12
    boks(c, M, y, bw, "<b>Ingen passord, ingen abonnement, ingen kostnad.</b> Kundane dine blir lagra berre på din eigen "
         "telefon – ikkje på internett.", bg=BRUN_L)


def side_tre_ting(c):
    y = ny_side(c, "Du treng berre å kunne tre ting", ingress="Resten er ekstra. Heng gjerne denne sida på kjøleskapet.")
    bw = W - 2 * M
    steg = [
        ("Når nokon vil kjøpe ved", [("Ny bestilling", True, "pluss", 250)],
         "Trykk + for kor mange, vel levering eller henting, skriv adressa og trykk «Lagre bestillinga»."),
        ("Når veden er levert eller henta", [("Ferdig", True, "hake", 170)],
         "Trykk «Ferdig» på kunden i lista."),
        ("Når du har fått betalt", [("Ja, Vipps", True, None, 150), ("Ja, kontant", True, None, 160)],
         "Ikkje betalt enno? Trykk «Nei, ikkje enno». Då hamnar kunden under «Ventar på betaling», så du ikkje gløymer det."),
    ]
    for i, (tittel, knapper, hint) in enumerate(steg, 1):
        hh = hoyde(hint, bw - 110, BROD)
        blokk = 36 + 58 + 14 + hh + 26
        c.setFillColor(KREM)
        c.roundRect(M, y - blokk, bw, blokk, 16, fill=1, stroke=0)
        nummer(c, M + 42, y - 44, i, r=24)
        c.setFillColor(TEKST)
        c.setFont("Av-H", 19)
        c.drawString(M + 84, y - 38, tittel)
        kx = M + 84
        for tekst, primar, ikon, kw in knapper:
            knapp(c, kx, y - 108, kw, 54, tekst, primar, ikon, fs=17)
            kx += kw + 12
        para(c, hint, M + 84, y - 122, bw - 110, BROD)
        y -= blokk + 16
    boks(c, M, y, bw, "<b>Ekstra når du vil:</b> Facebook-annonse med ferdig tekst, oversikt over salet, "
         "og å sende prisen til kunden på SMS med eitt trykk.", bg=GRONN_L)


def side_forsiden(c):
    y = ny_side(c, "Slik ser appen ut", kapittel=1,
                ingress="Dette er det første du ser når du opnar Vedsal. Til høgre ser du resten av sida, lenger nede.")
    pw, gap = 196, 64
    x1 = (W - 2 * pw - gap) / 2
    b1 = telefon(c, "02-hjem-skjerm.png", x1, y, pw, [(1, 354), (2, 598), (3, 1606)])
    telefon(c, "17-hjem-nederst.png", x1 + pw + gap, y, pw, [(4, 530), (5, 1361), (6, 1775)])
    to_kolonner_steg(c, b1 - 22, [
        "<b>«Ny bestilling»</b> – trykk her når nokon vil kjøpe ved.",
        "<b>Lista</b> over kven som skal ha ved. Den som bestilte først, står øvst.",
        "<b>Ring</b> kunden, sjå <b>vegen på kartet</b>, eller trykk <b>«Ferdig»</b> når veden er levert.",
        "<b>«Ventar på betaling»</b> – dei som har fått ved, men ikkje betalt enno.",
        "<b>«Minn på»</b> sender ein venleg SMS. <b>«Betalt»</b> når pengane har kome.",
        "<b>Facebook-annonse</b> med ferdig tekst, og <b>«Sal i år»</b> med oversikta.",
    ])


def side_ny_bestilling(c):
    y = ny_side(c, "Når nokon vil kjøpe ved", kapittel=2,
                ingress="Det tek under eitt minutt. Appen reknar ut prisen medan du fyller inn.")
    pw, gap = 152, 64
    x1 = (W - 2 * pw - gap) / 2
    b1 = telefon(c, "13-ny-utfylt-topp.png", x1, y, pw, [(1, 80), (2, 534), (3, 1738), (4, 2190)])
    b2 = telefon(c, "14-ny-utfylt-bunn.png", x1 + pw + gap, y, pw, [(5, 541), (6, 2884), (7, 3122)])
    y = to_kolonner_steg(c, min(b1, b2) - 22, [
        "Trykk «Ny bestilling» på framsida.",
        "Trykk <b>+</b> til rett tal sekkar – bjørk, gran eller stabla kubikk.",
        "Vel «Levering» eller «Hentar sjølv».",
        "Skriv adressa og trykk på rett forslag. <b>Frakta blir rekna ut av seg sjølv.</b>",
        "Skriv namn og telefonnummer. Vil kunden ha SMS neste haust, kryss av.",
        "Trykk <b>«Lagre bestillinga»</b>. Ferdig!",
        "Vil du sende prisen til kunden? Trykk «Send prisen til kunden».",
    ]) - 6
    y = boks(c, M, y, W - 2 * M, "<b>Appen passar på for deg:</b> Gratissekken i tilbodet kjem med av seg sjølv, og appen seier frå "
             "viss ei levering er under 10 sekkar (du kan lagre likevel). Leverer du til fleire på same tur? Trykk «Endre frakt».",
             bg=GRONN_L, st=KORT)
    assert y >= 44, f"Boksen nedst går over sidetalet (y = {y:.0f})"


def side_levert(c, pris_sms):
    y = ny_side(c, "Prisen på SMS – og når du har levert", kapittel=3)
    kol = (W - 2 * M - 30) / 2
    yy = para(c, "Trykkjer du «Send prisen til kunden», skriv appen meldinga for deg. "
              "<b>Du trykkjer berre «Send».</b>", M, y, kol, BROD)
    yy = para(c, "Har du ikkje telefonnummeret, kan du velje Messenger i staden.", M, yy - 8, kol, LITEN)
    sms_boble(c, M + kol + 30, y + 4, kol, pris_sms, "SMS-EN SOM OPNAR SEG – FERDIG SKRIVEN", utgaaende=True)
    y = min(yy, y - 200) - 22
    c.setStrokeColor(LINJE)
    c.setLineWidth(1)
    c.line(M, y, W - M, y)
    y -= 26
    c.setFont("Av-H", 17)
    c.setFillColor(TEKST)
    c.drawString(M, y, "Når veden er levert eller henta")
    y -= 14
    b1 = bildeboks(c, "03-ferdig-sporsmal.png", M, y, kol)
    tx = M + kol + 30
    yy = para(c, "Trykk <b>«Ferdig»</b> på kunden. Appen spør om du har fått betalt:", tx, y, kol, BROD) - 8
    for t in ["<b>Ja, Vipps</b> eller <b>Ja, kontant</b> – då er handelen ferdig.",
              "<b>Nei, ikkje enno</b> – kunden hamnar under «Ventar på betaling»."]:
        c.setFillColor(GRONN)
        c.circle(tx + 5, yy - 8, 3.5, fill=1, stroke=0)
        yy = para(c, t, tx + 16, yy, kol - 16, BROD) - 6
    yy -= 8
    yy = bildeboks(c, "08-ubetalt-kort.png", tx, yy, kol)
    yy = para(c, "Der kan du trykkje <b>«Minn på»</b> for ein venleg SMS, og <b>«Betalt»</b> når pengane kjem.",
              tx, yy - 10, kol, KORT)
    y = min(b1, yy) - 18
    boks(c, M, y, W - 2 * M, "<b>Trykte du feil?</b> Trykk «Angre» nedst på skjermen med ein gong – eller «Endre» på kunden.",
         bg=GUL, kant=GUL_K, st=KORT)


def side_kunder(c, kunde_sms):
    y = ny_side(c, "Kundane kan bestille sjølve", kapittel=4, ingress=(
        "Du får ei eiga nettside med prisar og priskalkulator. Del lenkja på Facebook – "
        "eller la folk skanne QR-koden på plakaten."))
    pw, gap = 172, 64
    x1 = (W - 2 * pw - gap) / 2
    b = telefon(c, "15-kunde-skjema-topp.png", x1, y, pw, [(1, 1736)])
    telefon(c, "16-kunde-skjema-bunn.png", x1 + pw + gap, y, pw, [(2, 1692)])
    y = b - 22
    kol = 228
    yy = y
    for n, t in [(1, "Kunden vel kor mykje og skriv adressa. <b>Prisen kjem opp med ein gong.</b>"),
                 (2, "Kunden trykkjer «Bestill på SMS»."),
                 (3, "<b>Du får ein vanleg SMS</b> med bestillinga (til høgre)."),
                 (4, "Trykk på den blå lenkja nedst i SMS-en. Då opnar bestillinga seg i Vedsal, ferdig utfylt. "
                     "Sjekk og trykk «Lagre bestillinga».")]:
        nummer(c, M + 11, yy - 9, n, r=11)
        yy = para(c, t, M + 30, yy, kol - 30, stil("k", fontSize=11.5, leading=16)) - 10
    boks(c, M, yy - 4, kol, "<b>Du bestemmer.</b> Prisen på nettsida er eit forslag. Du svarar kunden og stadfestar – "
         "akkurat som i dag.", bg=GRONN_L, st=KORT, pad=12)
    sms_boble(c, M + kol + 24, y + 4, W - 2 * M - kol - 24, kunde_sms, "SMS-EN DU FÅR FRÅ KUNDEN")


def side_priser(c):
    y = ny_side(c, "Prisar og frakt", kapittel=5,
                ingress="Prisane står éin stad, og blir brukte både i appen, på nettsida og i Facebook-annonsen.")
    kol = 280
    pw = 180
    telefon(c, "09-kunde-topp.png", W - M - pw, y, pw)

    def rad(yy, venstre, hoyre, under=None):
        c.setFont("Av-R", 12)
        c.setFillColor(TEKST)
        c.drawString(M, yy, venstre)
        c.setFont("Av-B", 12)
        c.drawRightString(M + kol, yy, hoyre)
        if under:
            c.setFont("Av-R", 9.5)
            c.setFillColor(DEMPET)
            c.drawString(M, yy - 12, under)
        c.setStrokeColor(LINJE)
        c.setLineWidth(0.8)
        c.line(M, yy - (20 if under else 8), M + kol, yy - (20 if under else 8))
        return yy - (38 if under else 26)

    c.setFont("Av-H", 15)
    c.setFillColor(TEKST)
    c.drawString(M, y - 10, "Ved")
    yy = y - 36
    for p in k.C["produkter"]:
        yy = rad(yy, p["kortnavn"], k.kr(p["pris"]), p["detalj"])
    T = k.C.get("tilbod")
    if T:
        yy = rad(yy, f"Fast tilbod: kvar {T['per']}. sekk bjørk", f"+{T['antal']} gran gratis",
                 "Appen legg til gratissekken sjølv – han står under namnet til kunden")
    yy -= 16
    c.setFont("Av-H", 15)
    c.setFillColor(TEKST)
    c.drawString(M, yy, "Frakt")
    L = k.C["levering"]
    kmsats = f"{L['krPerKm']:.2f}".replace(".", ",")
    yy = para(c, f"<b>Levering frå {L['minstSekkar']} sekkar</b> (eller ½ m³). Tidspunkt avtalar de på SMS. "
              "Frakta blir rekna ut frå køyrde kilometer tur/retur frå Teigavegen:", M, yy - 10, kol, BROD) - 8
    yy = boks(c, M, yy, kol, f"<b>{kmsats} kr per km</b> · minst {k.kr(L['minimum'])} · "
              f"blir runda opp til næraste {L['rundOppTil']} kr",
              bg=BRUN_L, st=stil("fr", fontSize=12.5, leading=18)) - 20
    for e in k.C["eksempler"]:
        pris = k.frakt(e["km"])
        yy = rad(yy, f"{e['sted']} ({int(e['km'] + 0.5)} km)", k.kr(pris) if pris else "etter avtale")
    yy = para(c, f"<b>Kvifor {kmsats} kr?</b> Det er satsen Skatteetaten reknar som bilkostnad (skattefri kilometersats 2026). "
              "Han dekkjer bil og drivstoff – ikkje tida di. Vil du ha betalt for tida òg, kan vi leggje til eit fast beløp.",
              M, yy - 6, kol, KORT) - 14
    boks(c, M, yy, kol, "Vil du endre ein pris? Sei frå til Benjamin, så blir han endra både i appen og på nettsida.",
         bg=GRONN_L, st=KORT)


def side_facebook_oversikt(c):
    y = ny_side(c, "Facebook-annonse og oversikt", kapittel=6)
    pw, gap = 190, 70
    x1 = (W - 2 * pw - gap) / 2
    b = telefon(c, "06-facebook.png", x1, y, pw)
    telefon(c, "05-oversikt.png", x1 + pw + gap, y, pw, boks_px=(0, 0, 1170, 2532))
    y = b - 24
    kol = (W - 2 * M - 30) / 2
    c.setFont("Av-H", 15)
    c.setFillColor(TEKST)
    c.drawString(M, y, "Facebook-annonse")
    c.drawString(M + kol + 30, y, "Sal i år")
    para(c, "Trykk <b>«Kopier annonsen»</b>. Gå inn i gruppa på Facebook, trykk på skrivefeltet øvst (ikkje «Selg noe»), hald fingeren i "
         "feltet og trykk <b>«Lim inn» éin gong</b>. Biletet med prisane kjem av seg sjølv. <b>Ikkje bruk skjermbilde</b> – då verkar "
         "ikkje lenkja. Sjå Facebook-guiden.",
         M, y - 10, kol, KORT)
    para(c, "Sjå kor mykje du har selt, kor mange sekkar, frakt og kven som ikkje har betalt. Nedst ser du kor nær du er "
         "<b>50 000 kr – grensa for moms</b>. «Send oversikta til Benjamin» sender tala. Her finn du òg "
         "<b>«Påminning neste haust»</b> for kundar som har sagt ja.", M + kol + 30, y - 10, kol, KORT)


def mini_plakat(c, x, y, w):
    h = w * 1.414
    c.setFillColor(Color(0, 0, 0, alpha=0.1))
    c.rect(x + 3, y - 3, w, h, fill=1, stroke=0)
    c.setFillColor(white)
    c.rect(x, y, w, h, fill=1, stroke=0)
    c.setFillColor(GRONN)
    c.rect(x, y + h * 0.66, w, h * 0.34, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Av-H", w * 0.105)
    c.drawString(x + w * 0.08, y + h * 0.88, "TØRR VED")
    c.drawString(x + w * 0.08, y + h * 0.80, "TIL SALS")
    c.setFont("Av-D", w * 0.055)
    c.drawString(x + w * 0.08, y + h * 0.72, "Levert i Førde og Naustdal")
    c.setFillColor(TEKST)
    c.setFont("Av-B", w * 0.058)
    c.drawString(x + w * 0.08, y + h * 0.59, "Bjørk 60 l   125 kr")
    c.drawString(x + w * 0.08, y + h * 0.54, "Gran 60 l    79 kr")
    c.drawString(x + w * 0.08, y + h * 0.49, "Stabla m³  2 000 kr")
    q = w * 0.34
    qx, qy = x + w * 0.58, y + h * 0.30
    import random
    rnd = random.Random(4)
    n = 11
    for i in range(n):
        for j in range(n):
            hjorne = (i < 3 and j < 3) or (i < 3 and j > n - 4) or (i > n - 4 and j < 3)
            if hjorne or rnd.random() < 0.45:
                c.rect(qx + i * q / n, qy + j * q / n, q / n, q / n, fill=1, stroke=0)
    c.setFont("Av-D", w * 0.045)
    c.drawString(x + w * 0.08, y + h * 0.36, "Skann og")
    c.drawString(x + w * 0.08, y + h * 0.32, "bestill her ›")
    c.setStrokeColor(DEMPET)
    c.setLineWidth(0.5)
    c.setDash(2, 2)
    c.line(x, y + h * 0.2, x + w, y + h * 0.2)
    for i in range(1, 8):
        c.line(x + i * w / 8, y, x + i * w / 8, y + h * 0.2)
    c.setDash()
    c.setStrokeColor(LINJE)
    c.rect(x, y, w, h, fill=0, stroke=1)


def side_ideer(c):
    y = ny_side(c, "Idear til marknadsføring", kapittel=7,
                ingress="Ingenting her må gjerast – plukk det du har lyst til. Benjamin kan lage det meste.")
    bw = W - 2 * M
    fh = 178
    c.setFillColor(KREM)
    c.roundRect(M, y - fh, bw, fh, 16, fill=1, stroke=0)
    plakat_bilde = os.path.join(BYGG, "plakat-forhand.png")
    if os.path.exists(plakat_bilde):
        pw_ = 100
        c.setFillColor(Color(0, 0, 0, alpha=0.1))
        c.rect(M + 23, y - fh + 15, pw_, pw_ * 1.414, fill=1, stroke=0)
        c.setFillAlpha(1)  # ellers blir biletet like gjennomsiktig som skuggen
        c.drawImage(plakat_bilde, M + 20, y - fh + 18, pw_, pw_ * 1.414)
        c.setStrokeColor(LINJE)
        c.rect(M + 20, y - fh + 18, pw_, pw_ * 1.414, fill=0, stroke=1)
    else:
        mini_plakat(c, M + 20, y - fh + 18, 100)
    tx = M + 150
    tw = bw - 170
    yy = para(c, "A4-plakat med QR-kode", tx, y - 16, tw, stil("pt", fontName="Av-H", fontSize=16, leading=20))
    yy = para(c, "Heng han på oppslagstavla i butikken, på bensinstasjonen og grendahuset – eller ta han med på bygdetreff og marknader. "
              "Folk skannar koden med mobilkameraet og kjem rett til bestillingssida. Nedst er det lappar med "
              "telefonnummeret som folk kan rive av.", tx, yy - 4, tw, KORT)
    para(c, "<font color='#8b4a1c'><b>Ferdig laga · Gratis å skrive ut · Spør eigaren av tavla først</b></font>",
         tx, yy - 6, tw, stil("tg", fontSize=10, leading=14))
    y -= fh + 14
    ideer = [
        ("Kort i kvar leveranse", "Eit lite kort med QR-kode: «Takk for handelen! Bestill igjen – skann koden». Gjer det lett å kjøpe av deg neste gong.", "Ferdig laga · Billeg å skrive ut"),
        ("Facebook i sesongen", "Legg ut annonsen i lokale kjøp-og-sal-grupper når fyringssesongen startar, og når det blir kaldt.", "Gratis · Ferdig tekst i appen"),
        ("Nemn det faste tilbodet", "Kvar 10. sekk bjørk gir 1 sekk granved gratis. Sei det når folk ringjer – mange tek då 10 sekkar.", "I gang · meir sal per kunde"),
        ("Synleg på Google Maps", "Ei gratis Google-oppføring gjer at du dukkar opp når folk søkjer etter ved i Førde og Naustdal.", "Gratis · Éin gong"),
        ("Samkøyring", "Bestiller to naboar samtidig, køyrer du éin tur. Litt rabatt på frakta – billegare for dei, mindre køyring for deg.", "Sparer tid og diesel"),
        ("Sommarpris", "Litt lågare pris om sommaren gir sal i lågsesongen – og kundane får tørr ved klar til hausten.", "Jamnare sal"),
        ("Annonse på Finn.no", "Mange leitar etter ved på Finn. Der når du folk som ikkje er på Facebook.", "Sjekk pris"),
        ("Skilt ved vegen", "«Ved til sals» ved innkøyrsla. Skilt som vender mot offentleg veg, krev som regel løyve frå Statens vegvesen.", "Krev løyve"),
    ]
    kol = (bw - 14) / 2
    for i in range(0, len(ideer), 2):
        rad = ideer[i:i + 2]
        hh = max(hoyde(t, kol - 28, stil("i", fontSize=10.5, leading=14.5)) for _, t, _ in rad) + 64
        for j, (tittel, tekst, merke) in enumerate(rad):
            x = M + j * (kol + 14)
            c.setStrokeColor(LINJE)
            c.setFillColor(white)
            c.setLineWidth(1)
            c.roundRect(x, y - hh, kol, hh, 12, fill=1, stroke=1)
            yy = para(c, tittel, x + 14, y - 12, kol - 28, stil("it", fontName="Av-D", fontSize=12.5, leading=16))
            para(c, tekst, x + 14, yy - 3, kol - 28, stil("i", fontSize=10.5, leading=14.5))
            c.setFont("Av-D", 9.5)
            c.setFillColor(BRUN)
            c.drawString(x + 14, y - hh + 12, merke)
        y -= hh + 10


def side_sporsmal(c):
    y = ny_side(c, "Spørsmål og svar")
    kol = W - 2 * M
    for sp, sv in [
        ("Kostar det noko?", "Nei. Ingen abonnement, ingen reklame og inga innlogging."),
        ("Kven ser kundane mine?", "Berre du. Alt blir lagra på telefonen din – ikkje på internett."),
        ("Kva om eg går ut før eg har lagra?", "Ingen fare. Det du har skrive, blir teke vare på. På framsida trykkjer du «Hald fram»."),
        ("Kva om eg mistar telefonen?", "Send ein tryggingskopi til Benjamin av og til. Appen minner deg på det – eller gå til «Sal i år» › «Tryggingskopi og innstillingar»."),
        ("Verkar det utan dekning?", "Ja, appen opnar seg. Adressesøk treng nett – utan dekning skriv du frakta sjølv."),
        ("Må eg bruke alt?", "Nei. Bruk det du har nytte av. Du kan framleis ta imot bestillingar på telefon som før."),
        ("Kva med moms og skatt?", "Sel du for mindre enn 50 000 kr i løpet av 12 månader, treng du ikkje registrere deg for moms. "
                                   "Inntekta skal likevel med i skattemeldinga – oversikta i appen gjer det enkelt."),
    ]:
        y = para(c, sp, M, y, kol, stil("sp", fontName="Av-D", fontSize=13.5, leading=18)) - 2
        y = para(c, sv, M, y, kol, BROD) - 14
    y -= 4
    nh = 170
    c.setFillColor(GRONN)
    c.roundRect(M, y - nh, kol, nh, 16, fill=1, stroke=0)
    hvit = stil("hv", fontSize=12.5, leading=18, textColor=white)
    c.setFillColor(white)
    c.setFont("Av-H", 18)
    c.drawString(M + 20, y - 32, "Slik kjem du i gang")
    yy = y - 48
    for n, t in enumerate(["Benjamin legg Vedsal på telefonen din. Det tek fem minutt.",
                           "De legg inn éi bestilling saman, så du ser korleis det verkar.",
                           "Du prøver ei stund – og seier kva du synest."], 1):
        nummer(c, M + 32, yy - 9, n, r=10, farge=BRUN)
        yy = para(c, t, M + 52, yy, kol - 72, hvit) - 8
    yy -= 8
    para(c, "<b>Heng huskelista på kjøleskapet</b> – ho seier kva du gjer i kvar situasjon. "
         "Lurer du på noko? Ring Benjamin – 913 47 058. Du kan ikkje gjere noko gale.",
         M + 20, yy, kol - 40, hvit)


def les_sms(navn, bytt_lenke=None):
    sti = os.path.join(BILDER, navn)
    tekst = urllib.parse.unquote(open(sti, encoding="utf-8").read().split("body=", 1)[1])
    tekst = esc(tekst)
    if bytt_lenke:
        foer, _, _ = tekst.rpartition(": ")
        tekst = foer + ": <font color='#1a5fb4'><u>" + bytt_lenke + "</u></font>"
    return tekst.replace("\n", "<br/>")


def main():
    pris_sms = les_sms("12-ny-utfylt-lenke.txt")
    kunde_sms = les_sms("10-kunde-skjema-lenke.txt", bytt_lenke="Trykk her for å leggje inn")
    c = canvas.Canvas(UT, pagesize=A4)
    c.setTitle("Vedsal – slik fungerer det")
    c.setAuthor("Benjamin Bruflot Teigen")
    c.setSubject("Enkel rettleiing til Vedsal – Ved frå Teigen")
    forside(c)
    side_nytte(c)
    side_tre_ting(c)
    side_forsiden(c)
    side_ny_bestilling(c)
    side_levert(c, pris_sms)
    side_kunder(c, kunde_sms)
    side_priser(c)
    side_facebook_oversikt(c)
    side_ideer(c)
    side_sporsmal(c)
    c.showPage()
    c.save()
    print("Laget:", UT, f"({side_nr[0]} sider, {os.path.getsize(UT) // 1024} kB)")


if __name__ == "__main__":
    main()
