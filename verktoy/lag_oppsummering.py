#!/usr/bin/env python3
# © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
"""Lager «Vedsal – kva vi har gjort» (nynorsk): oppsummering til pappa etter Facebook-runden 4. oktober 2026."""
import os
from reportlab.lib.colors import white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import config as k
from lag_veiledning import BROD, DEMPET, GRONN, GRONN_L, GUL, GUL_K, KORT, KREM, M, TEKST, H, W, boks, para, stil

UT = os.path.join(k.ROT, "leveranse", "Vedsal – kva vi har gjort.pdf")


def tittel(c, y, t, farge=GRONN):
    c.setFillColor(farge)
    c.roundRect(M, y - 26, W - 2 * M, 26, 8, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Av-B", 13.5)
    c.drawString(M + 12, y - 18, t)
    return y - 36


def punkt(c, y, linjer):
    for t in linjer:
        c.setFillColor(GRONN)
        c.circle(M + 8, y - 7, 3.5, fill=1, stroke=0)
        y = para(c, t, M + 20, y, W - 2 * M - 24, stil("p", fontSize=11.5, leading=15.5)) - 5
    return y - 6


def main():
    c = canvas.Canvas(UT, pagesize=A4)
    c.setTitle("Vedsal – kva vi har gjort")
    c.setAuthor("Benjamin Bruflot Teigen")
    c.setFillColor(GRONN)
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)
    c.setFont("Av-D", 8.5)
    c.setFillColor(DEMPET)
    c.drawString(M, H - 32, "VEDSAL  ·  OPPSUMMERING 4. OKTOBER 2026")
    c.setFont("Av-H", 25)
    c.setFillColor(TEKST)
    c.drawString(M, H - 74, "Kva vi har gjort – og kva som skjer no")
    y = para(c, "Hei pappa! Her er alt på eitt ark. <b>Du treng ikkje gjere noko på Facebook.</b> "
             "Svar på telefon og SMS når folk tek kontakt – resten tek Benjamin.", M, H - 88, W - 2 * M,
             stil("i", fontSize=13, leading=18)) - 12

    y = tittel(c, y, "Dette er gjort")
    y = punkt(c, y, [
        "<b>Annonsen er lagd ut</b> på profilen din og i fire grupper: «Du veit du er i frå Naustdal», "
        "«Norsk Vedproduksjon», «Ved og vedutstyr» og «Ved til salgs» (den siste ventar på godkjenning frå administrator).",
        "Annonsen har prisane, det faste tilbodet, levering (Naustdal, Førde og Florø) og ei blå lenkje folk kan trykke på.",
        "<b>Nettsida er oppdatert:</b> fast tilbod (kvar 10. sekk bjørk gir 1 sekk granved gratis), stabla kubikk, "
        "levering til Florø, og at gratissekken kjem med av seg sjølv.",
        "Appen din er oppdatert med same annonsetekst. Han oppdaterer seg sjølv.",
    ])

    y = tittel(c, y, "Dette skjer vidare")
    y = punkt(c, y, [
        "<b>Éin gong i månaden</b> legg Benjamin ut annonsen på nytt for deg (første søndag kvelden).",
        "Bestillingar frå nettsida kjem på SMS med ei blå lenkje – trykk på henne, så kjem bestillinga inn i Vedsal.",
        "Ringjer eller skriv nokon: trykk «Ny bestilling» i Vedsal, som før.",
        "Svarar nokon på annonsen i Messenger eller i kommentarane, kan du svare: «Ring eller send SMS til 917 50 205».",
    ])

    y = tittel(c, y, "Dette gjekk ikkje – kan gjerast for hand", farge=GUL_K)
    y = punkt(c, y, [
        "«Kjøpe - Selge … Sunnfjord og omegn», «Kjøpe - Selge … Florø og omegn» og «Kjøp og salg i Førde og omegn» "
        "tek berre salsannonsar med bilete («Selg noe»). Der kan du eller Benjamin leggje ut ein sjølv: "
        "ta eit bilete av veden, skriv pris, og lim inn teksten.",
        "«Du veit du e frå Førde når …» forbyd reklame i reglane sine, så der er det ikkje lagt ut noko.",
    ])

    y = tittel(c, y, "Rydd opp: slett dei gamle annonsane", farge=GUL_K)
    y = punkt(c, y, [
        "Dei gamle annonsane med skjermbilde og gamle prisar ligg framleis ute i «Du veit du er i frå Naustdal» (2), "
        "«Norsk Vedproduksjon» (2), «Ved og vedutstyr» (2) og Sunnfjord-gruppa (1).",
        "Slik slettar du: opne gruppa › trykk på dei tre prikkane <b>…</b> på den gamle annonsen › <b>«Slett innlegg»</b>. "
        "Benjamin kan òg gjere det saman med deg. I «Ved til salgs» har administratorane alt fjerna dei gamle.",
    ])

    boks(c, M, y, W - 2 * M, "<b>Hugs:</b> Viser nokon til ein gammal pris (120 kr frå ein gammal plakat eller annonse), "
         "gir du dei den prisen – trykk «Endre totalprisen». Lurer du på noko? Ring Benjamin – 913&nbsp;47&nbsp;058.",
         bg=GRONN_L, st=KORT)
    c.setFont("Av-R", 8)
    c.setFillColor(DEMPET)
    c.drawString(M, 20, "Vedsal © 2026 Benjamin Bruflot Teigen · tlf. 913 47 058")
    c.showPage()
    c.save()
    print("Laget:", UT)


if __name__ == "__main__":
    main()
