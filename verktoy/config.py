# © 2026 Benjamin Teigen. Alle rettigheter forbeholdt – se LICENSE.
"""Leser config.js (de samme prisene som nettsida og appen bruker) inn i Python-verktøyene."""
import json
import math
import os
import subprocess

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://vedfrateigen.github.io/"


def last():
    kode = "global.window = {}; require(process.argv[1]); console.log(JSON.stringify(window.VED));"
    ut = subprocess.run(["node", "-e", kode, os.path.join(ROT, "config.js")], capture_output=True, text=True, check=True)
    return json.loads(ut.stdout)


C = last()


def kr(n):
    return f"{round(n):,}".replace(",", " ") + " kr"


def tal(n):
    return (f"{n:.1f}" if n % 1 else f"{int(n)}").replace(".", ",")


def frakt(km):
    """Samme regel som leveringspris() i felles.js."""
    L = C["levering"]
    if km is None or km < 0 or km > L["maksKm"]:
        return None
    ore = round((L["startpris"] + km * 2 * L["krPerKm"]) * 100)
    return max(L["minimum"], math.ceil(ore / (L["rundOppTil"] * 100)) * L["rundOppTil"])


def telefon():
    t = C["telefon"]
    return f"{t[:3]} {t[3:5]} {t[5:]}" if len(t) == 8 else t
