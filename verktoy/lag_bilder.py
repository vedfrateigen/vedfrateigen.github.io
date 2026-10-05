# © 2026 Benjamin Bruflot Teigen. Alle rettigheter forbeholdt – se LICENSE.
"""Lager nettbildene fra Benjamins foto (verktoy/foto/). GPS og annen EXIF blir IKKE med.
Kjør: python3 verktoy/lag_bilder.py"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageOps

import config as k

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOTO = os.path.join(ROT, "verktoy", "foto")
UT = os.path.join(ROT, "bilder")
os.makedirs(UT, exist_ok=True)
AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
font = lambda storrelse, nr: ImageFont.truetype(AVENIR, storrelse, index=nr)  # 0=Bold 2=DemiBold 7=Regular 8=Heavy


def apne(navn):
    return ImageOps.exif_transpose(Image.open(os.path.join(FOTO, navn))).convert("RGB")


def beskjaer(im, forhold, fokus_y=0.5):
    w, h = im.size
    if w / h > forhold:
        nw = int(h * forhold)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = int(w / forhold)
    y = int((h - nh) * fokus_y)
    return im.crop((0, y, w, y + nh))


# Toppbilde (vedstabel) og produktbilde (sekkar)
stabel = beskjaer(apne("IMG_4142.jpg"), 16 / 9, 0.55).resize((1600, 900), Image.LANCZOS)
stabel.save(os.path.join(UT, "stabel.jpg"), quality=80, optimize=True, progressive=True)
sekkar = beskjaer(apne("IMG_4145.jpg"), 4 / 3, 0.5).resize((1200, 900), Image.LANCZOS)
sekkar.save(os.path.join(UT, "sekkar.jpg"), quality=80, optimize=True, progressive=True)

# Forhåndsbilde når lenka deles på Facebook (1200 × 630)
og = beskjaer(apne("IMG_4145.jpg"), 1200 / 630, 0.45).resize((1200, 630), Image.LANCZOS)
overlegg = Image.new("RGBA", og.size, (0, 0, 0, 0))
d = ImageDraw.Draw(overlegg)
for x in range(1200):
    a = int(max(0, min(1, (760 - x) / 520)) * 235)
    d.line([(x, 0), (x, 630)], fill=(36, 84, 47, a))
og = Image.alpha_composite(og.convert("RGBA"), overlegg)
d = ImageDraw.Draw(og)
ikon = Image.open(os.path.join(ROT, "ikon-192.png")).convert("RGBA").resize((72, 72), Image.LANCZOS)
og.alpha_composite(ikon, (60, 56))
d.text((148, 72), "VED FRÅ TEIGEN", font=font(30, 0), fill="white")
d.text((58, 170), "Tørr ved", font=font(92, 8), fill="white")
d.text((58, 268), "frå Naustdal", font=font(92, 8), fill="white")
for i, p in enumerate(k.C["produkter"][:3]):
    d.text((62, 400 + i * 46), p["kortnavn"] + "   " + k.kr(p["pris"]), font=font(36, 2), fill="white")
d.text((62, 560), "Levering i Naustdal, Førde og Florø – eller hent sjølv", font=font(26, 7), fill=(225, 238, 227))
T = k.C.get("tilbod")
if T and "gran" not in (k.C.get("utselt") or []):
    # Raud tilbodsmerke oppe til høgre
    cx, cy, r = 1048, 152, 126
    d.ellipse([cx - r + 4, cy - r + 6, cx + r + 4, cy + r + 6], fill=(0, 0, 0, 70))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(198, 40, 40, 255))
    d.ellipse([cx - r + 9, cy - r + 9, cx + r - 9, cy + r - 9], outline="white", width=3)
    # «Fast tilbod» – Forbrukertilsynet: faste tilbod skal merkast som faste overalt der dei blir marknadsførte.
    for tekst, storrelse, nr, dy in [("FAST TILBOD", 24, 8, -86), (f"Kvar {T['per']}. sekk", 22, 0, -52),
                                     (f"bjørk gir {T['antal']} sekk", 22, 0, -26), ("granved gratis", 22, 0, 0),
                                     ("så lenge det er", 16, 0, 34), ("granved att", 16, 0, 54)]:
        fnt = font(storrelse, nr)
        b = d.textlength(tekst, font=fnt)
        d.text((cx - b / 2, cy + dy), tekst, font=fnt, fill="white")
og.convert("RGB").save(os.path.join(ROT, "og-bilde.jpg"), quality=86, optimize=True)
for f in ("bilder/stabel.jpg", "bilder/sekkar.jpg", "og-bilde.jpg"):
    print(f, os.path.getsize(os.path.join(ROT, f)) // 1024, "kB")
