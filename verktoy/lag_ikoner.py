"""Lager app-ikonene (PNG) fra samme tegning som ikon.svg. Kjør: python3 verktoy/lag_ikoner.py"""
from PIL import Image, ImageDraw

GRONN, NEVER, SVART, VED, RING, KJERNE = "#2f6b3f", "#f5f2ea", "#2a241f", "#e7b570", "#c4843f", "#a8672c"
S = 4  # tegner i 4x størrelse og skalerer ned for glatte kanter


def tegn(storrelse, maskable=False, avrunding=True):
    n = 512 * S
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if maskable or not avrunding:
        d.rectangle([0, 0, n, n], fill=GRONN)
    else:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=112 * S, fill=GRONN)
    k = 256 * S
    sirkel = lambda r, **kw: d.ellipse([k - r * S, k - r * S, k + r * S, k + r * S], **kw)
    sirkel(172, fill=NEVER)
    for (x1, y1, x2, y2) in [(210, 92, 244, 92), (300, 96, 322, 96), (398, 190, 398, 220), (404, 286, 404, 306),
                             (300, 418, 330, 418), (196, 416, 218, 416), (110, 300, 110, 328), (106, 196, 106, 218)]:
        d.line([x1 * S, y1 * S, x2 * S, y2 * S], fill=SVART, width=12 * S)
        for (x, y) in [(x1, y1), (x2, y2)]:
            d.ellipse([(x - 6) * S, (y - 6) * S, (x + 6) * S, (y + 6) * S], fill=SVART)
    sirkel(146, fill=VED)
    for r in (116, 84, 52):
        sirkel(r + 4.5, outline=RING, width=9 * S)
    sirkel(13, fill=KJERNE)
    return im.resize((storrelse, storrelse), Image.LANCZOS)


tegn(512).save("ikon-512.png")
tegn(192).save("ikon-192.png")
tegn(180, avrunding=False).save("ikon-180.png")  # iPhone runder hjørnene selv
tegn(512, maskable=True).save("ikon-maskable-512.png")
print("Ikoner laget")
