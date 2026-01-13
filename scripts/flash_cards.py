#!/usr/bin/env python3
import os
import sys
import csv
import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

import httpx
from jinja2 import Template

# -------------------------------------------------
# Ensure working directory = script directory
# -------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
os.chdir(SCRIPT_DIR)

DATA = SCRIPT_DIR / "data"
DATA.mkdir(exist_ok=True)

# Set NLTK_DATA path so it uses our local directory
NLTK_DIR = DATA / "nltk_data"
NLTK_DIR.mkdir(exist_ok=True)
os.environ["NLTK_DATA"] = str(NLTK_DIR)

# -------------------------------------------------
# Paths
# -------------------------------------------------
F_NLTK_OK = DATA / "01_nltk_ok.json"
F_FREQ_RAW = DATA / "02_es_freq_raw.txt"
F_FREQ_MAP = DATA / "03_es_freq_map.json"
F_OMW = DATA / "04_omw_candidates.json"
F_FINAL = DATA / "05_final.json"
F_CSV = DATA / "labels.csv"
F_HTML = DATA / "labels.html"

# -------------------------------------------------
# Config
# -------------------------------------------------
FREQ_URL = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt"
UA = "omw-home-flashcards/1.0"

RANK_MAX = int(os.environ.get("RANK_MAX", "10000"))  # Allow less common words
KEEP_MAX = int(os.environ.get("KEEP_MAX", "500"))   # Keep more words
ALLOW_MULTIWORD = int(os.environ.get("ALLOW_MULTIWORD", "0"))

WORD_RE = re.compile(r"^([^\s]+)\s+(\d+)\s*$")

# -------------------------------------------------
# Curated vocabulary lists with Finnish translations and secondary meanings
# Format: (spanish, finnish_primary, finnish_secondary_or_none)
# -------------------------------------------------
VOCABULARY = {
    "fruits": [
        ("manzana", "omena", None), ("naranja", "appelsiini", "oranssi"), ("plátano", "banaani", None), 
        ("uva", "rypäle", None), ("fresa", "mansikka", None), ("pera", "päärynä", None), ("limón", "sitruuna", None),
        ("sandía", "vesimeloni", None), ("melón", "meloni", None), ("melocotón", "persikka", None), 
        ("cereza", "kirsikka", None), ("piña", "ananas", None), ("kiwi", "kiivi", None), ("mango", "mango", None),
        ("papaya", "papaja", None), ("aguacate", "avokado", None), ("frambuesa", "vadelma", None), 
        ("arándano", "mustikka", None), ("ciruela", "luumu", None), ("albaricoque", "aprikoosi", None),
        ("granada", "granaattiomena", None), ("higo", "viikuna", None), ("coco", "kookos", None), 
        ("mandarina", "mandariini", None), ("fruta", "hedelmä", None)
    ],
    "vegetables": [
        ("tomate", "tomaatti", None), ("cebolla", "sipuli", None), ("ajo", "valkosipuli", None), 
        ("patata", "peruna", None), ("zanahoria", "porkkana", None), ("lechuga", "salaatti", None),
        ("pepino", "kurkku", None), ("pimiento", "paprika", "pippuri"), ("berenjena", "munakoiso", None), 
        ("calabacín", "kesäkurpitsa", None), ("brócoli", "parsakaali", None), ("coliflor", "kukkakaali", None),
        ("espinaca", "pinaatti", None), ("champiñón", "herkkusieni", None), ("seta", "sieni", None), 
        ("guisante", "herne", None), ("judía", "papu", None), ("maíz", "maissi", None),
        ("apio", "selleri", None), ("rábano", "retiisi", None), ("calabaza", "kurpitsa", None), 
        ("col", "kaali", None), ("repollo", "kaali", None), ("verdura", "vihannes", None)
    ],
    "ingredients": [
        ("sal", "suola", None), ("pimienta", "pippuri", None), ("azúcar", "sokeri", None), 
        ("aceite", "öljy", None), ("vinagre", "etikka", None), ("harina", "jauho", None), ("arroz", "riisi", None),
        ("pasta", "pasta", "taikina"), ("pan", "leipä", None), ("leche", "maito", None), 
        ("mantequilla", "voi", None), ("queso", "juusto", None), ("huevo", "muna", None), ("yogur", "jogurtti", None),
        ("miel", "hunaja", None), ("café", "kahvi", "kahvila"), ("té", "tee", None), 
        ("chocolate", "suklaa", None), ("vainilla", "vanilja", None), ("canela", "kaneli", None),
        ("especias", "mausteet", None), ("hierba", "yrtti", "ruoho"), ("salsa", "kastike", None), 
        ("caldo", "liemi", None), ("levadura", "hiiva", None)
    ],
    "meats": [
        ("pollo", "kana", None), ("carne", "liha", None), ("cerdo", "sika", "sianliha"),
        ("pescado", "kala", None), ("jamón", "kinkku", None), ("salchicha", "makkara", None), 
        ("chorizo", "chorizo", None), ("bacon", "pekoni", None), ("pavo", "kalkkuna", None), 
        ("cordero", "lammas", "lampaanliha"), ("ternera", "vasikanliha", None), ("atún", "tonnikala", None), 
        ("salmón", "lohi", None)
    ],
    "furniture": [
        ("mesa", "pöytä", None), ("silla", "tuoli", None), ("sofá", "sohva", None), 
        ("cama", "sänky", None), ("armario", "kaappi", "vaatekaappi"), ("estantería", "hylly", None), 
        ("escritorio", "työpöytä", None), ("sillón", "nojatuoli", None), ("cómoda", "lipasto", None),
        ("mesita", "pikkupöytä", None), ("estante", "hylly", None), ("perchero", "naulakko", None),
        ("tocador", "kampauspöytä", None), ("aparador", "kaappi", None), ("librería", "kirjahylly", "kirjakauppa"),
        ("banco", "penkki", "pankki"), ("taburete", "jakkara", None), ("butaca", "nojatuoli", None)
    ],
    "lighting": [
        ("lámpara", "lamppu", None), ("luz", "valo", "sähkö"), ("bombilla", "hehkulamppu", None),
        ("linterna", "taskulamppu", None), ("vela", "kynttilä", "purje"), ("candelabro", "kynttilänjalka", None)
    ],
    "storage": [
        ("cajón", "laatikko", None), ("caja", "laatikko", "kassa"), ("bolsa", "laukku", "pussi"),
        ("cesta", "kori", None), ("baúl", "arkku", None), ("arcón", "arkku", None),
        ("contenedor", "säiliö", None), ("bote", "purkki", "vene"), ("tarro", "purkki", None),
        ("recipiente", "astia", None), ("sobre", "kirjekuori", "päällä"), ("carpeta", "kansio", None)
    ],
    "kitchen": [
        ("cocina", "keittiö", "liesi"), ("horno", "uuni", None), ("nevera", "jääkaappi", None),
        ("microondas", "mikroaaltouuni", None), ("tostadora", "leivänpaahdin", None), 
        ("cafetera", "kahvinkeitin", None), ("batidora", "vatkain", None), ("licuadora", "tehosekoitin", None),
        ("olla", "kattila", None), ("sartén", "paistinpannu", None), ("cazuela", "kattila", None),
        ("tetera", "teepannu", None), ("plato", "lautanen", "ruokalaji"), ("vaso", "lasi", None),
        ("taza", "kuppi", None), ("cuenco", "kulho", None), ("cuchillo", "veitsi", None),
        ("tenedor", "haarukka", None), ("cuchara", "lusikka", None), ("cucharón", "kauha", None),
        ("espátula", "lasta", None), ("tabla", "leikkuulauta", "taulu"), ("bandeja", "tarjotin", None),
        ("jarra", "kannu", None)
    ],
    "rooms_parts": [
        ("puerta", "ovi", None), ("ventana", "ikkuna", None), ("pared", "seinä", None),
        ("suelo", "lattia", "maa"), ("techo", "katto", None), ("escalera", "portaat", "tikapuut"),
        ("pasillo", "käytävä", None), ("rincón", "nurkka", None), ("esquina", "kulma", None),
        ("balcón", "parveke", None), ("terraza", "terassi", None)
    ],
    "home_items": [
        ("cortina", "verho", None), ("alfombra", "matto", None), ("cuadro", "maalaus", "kehys"),
        ("espejo", "peili", None), ("reloj", "kello", None), ("almohada", "tyyny", None),
        ("manta", "peitto", None), ("sábana", "lakana", None), ("toalla", "pyyhe", None),
        ("cojín", "tyyny", None), ("colchón", "patja", None), ("edredón", "untuvapeitto", None),
        ("planta", "kasvi", "tehdas"), ("maceta", "ruukku", None), ("jarrón", "maljakko", None),
        ("florero", "maljakko", None), ("foto", "valokuva", None), ("marco", "kehys", None)
    ],
    "cleaning": [
        ("escoba", "luuta", None), ("fregona", "moppi", None), ("cubo", "ämpäri", "kuutio"),
        ("bayeta", "riepu", None), ("trapo", "riepu", None), ("esponja", "sieni", None),
        ("detergente", "pesuaine", None), ("jabón", "saippua", None), ("papel", "paperi", None),
        ("basura", "roska", None), ("papelera", "roskakori", None)
    ],
}

# Category colors for visual distinction
CATEGORY_COLORS = {
    "fruits": "#FFE5E5",        # light red
    "vegetables": "#E5FFE5",    # light green
    "ingredients": "#FFF5E5",   # cream
    "meats": "#FFE5F0",         # light pink
    "furniture": "#FFE5CC",     # light orange
    "lighting": "#FFFACD",      # light yellow
    "storage": "#F0E5FF",       # light purple
    "kitchen": "#FFE5F0",       # light pink
    "rooms_parts": "#E5F3FF",   # light blue
    "home_items": "#F5F5DC",    # beige
    "cleaning": "#E5FFFF",      # light cyan
}

# -------------------------------------------------
# Print layout
# -------------------------------------------------
COLS = 5
ROWS = 10
PER_PAGE = COLS * ROWS

A4_W_MM = 210
A4_H_MM = 297
MARGIN_MM = 10
GAP_MM = 2

CONTENT_W = A4_W_MM - 2 * MARGIN_MM
CONTENT_H = A4_H_MM - 2 * MARGIN_MM

# -------------------------------------------------
# Helpers
# -------------------------------------------------
def norm(w: str) -> str:
    return w.strip().lower().replace("'", "'")

def load_json(p: Path, default):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else default

def save_json(p: Path, obj: any) -> None:
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

def is_ok_label(s: str) -> bool:
    if not s:
        return False
    if any(ch.isdigit() for ch in s):
        return False
    if not ALLOW_MULTIWORD and " " in s:
        return False
    return True

def freq_band(rank):
    if not rank:
        return "taajuus tuntematon"
    if rank <= 200:
        return f"#{rank} erittäin yleinen"
    if rank <= 1000:
        return f"#{rank} yleinen"
    if rank <= 6000:
        return f"#{rank} vähemmän yleinen"
    return f"#{rank} harvinainen"

# -------------------------------------------------
def step1_nltk():
    if F_NLTK_OK.exists():
        return

    import nltk

    nltk.download("wordnet", download_dir=NLTK_DIR, quiet=True)
    nltk.download("omw-1.4", download_dir=NLTK_DIR, quiet=True)

    save_json(F_NLTK_OK, {"ok": True})

# -------------------------------------------------
# Step 2: Download frequency list
# -------------------------------------------------
async def step2_freq():
    if F_FREQ_RAW.exists():
        return
    async with httpx.AsyncClient(timeout=60, headers={"User-Agent": UA}) as client:
        r = await client.get(FREQ_URL)
        r.raise_for_status()
        F_FREQ_RAW.write_text(r.text, encoding="utf-8")

def step3_freq_map():
    if F_FREQ_MAP.exists():
        return
    if not F_FREQ_RAW.exists():
        raise SystemExit("Missing frequency raw file.")

    rank = 0
    freq: Dict[str, Dict[str, int]] = {}
    for line in F_FREQ_RAW.read_text(encoding="utf-8").splitlines():
        m = WORD_RE.match(line)
        if not m:
            continue
        rank += 1
        w = norm(m.group(1))
        c = int(m.group(2))
        if w not in freq:
            freq[w] = {"rank": rank, "count": c}

    save_json(F_FREQ_MAP, freq)

# -------------------------------------------------
def step4_build_candidates():
    """Build candidates from curated vocabulary list with Finnish translations"""
    if F_OMW.exists():
        return

    # Flatten vocabulary into list with categories
    candidates = []
    for category, words in VOCABULARY.items():
        for es, fi, fi2 in words:
            candidates.append({
                "category": category,
                "es": norm(es),
                "fi": fi,
                "fi2": fi2 or "",
            })

    save_json(F_OMW, candidates)

# -------------------------------------------------
# Step 5: Join with frequency data and filter
# -------------------------------------------------
def step5_join():
    if F_FINAL.exists():
        return

    items = load_json(F_OMW, [])
    freq = load_json(F_FREQ_MAP, {})

    # Deduplicate by Spanish word (keep first occurrence)
    seen_es = set()
    joined = []
    for it in items:
        es = it["es"]
        if es in seen_es:
            continue
        seen_es.add(es)
        
        f = freq.get(es)
        if f:
            joined.append({
                **it,
                "rank": f["rank"],
            })
        else:
            # Include words even without frequency data
            joined.append({
                **it,
                "rank": 99999,  # Low priority
            })

    # Sort by category first, then alphabetically by Spanish word
    joined.sort(key=lambda x: (x["category"], x["es"]))
    
    # Limit to 100 words
    filtered = joined[:100]

    save_json(F_FINAL, filtered)

    with F_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["category", "es", "fi", "fi2", "rank"])
        for r in filtered:
            w.writerow([r["category"], r["es"], r["fi"], r.get("fi2", ""), r.get("rank") or ""])

# -------------------------------------------------
# Step 6: HTML output
# -------------------------------------------------
HTML = Template("""
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { 
  size: A4; 
  margin: 0; 
}
@media print {
  body { 
    margin: 0; 
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
body { 
  margin: 0; 
  font-family: Arial, sans-serif; 
}
.page {
  width: 210mm;
  height: 297mm;
  padding: {{ margin }}mm;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat({{ cols }}, 1fr);
  grid-template-rows: repeat({{ rows }}, 1fr);
  gap: {{ gap }}mm;
  page-break-after: always;
}
.card {
  border: 0.5mm solid #333;
  border-radius: 2mm;
  padding: 1.5mm;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.word { 
  font-weight: bold; 
  font-size: 4.5mm; 
  margin: 0.5mm 0;
  line-height: 1.2;
}
.meaning { 
  font-size: 3mm; 
  margin: 0.5mm 0;
  line-height: 1.2;
}
.meaning2 { 
  font-size: 2mm; 
  opacity: 0.7; 
  margin: 0.3mm 0; 
  font-style: italic;
  line-height: 1.2;
}
.small { 
  font-size: 1.8mm; 
  opacity: 0.7;
  line-height: 1.1;
}
.freq { 
  font-size: 2mm; 
  font-weight: 600; 
  margin-top: 0.5mm;
  line-height: 1.1;
}
</style>
</head>
<body>
{% for page in pages %}
<div class="page">
{% for c in page %}
<div class="card" style="background-color: {{ c.color }};">
<div class="small">{{ c.category }}</div>
<div class="word">{{ c.es }}</div>
<div class="meaning">{{ c.fi }}</div>
{% if c.fi2 %}
<div class="meaning2">{{ c.fi2 }}</div>
{% endif %}
<div class="freq">{{ c.freq }}</div>
</div>
{% endfor %}
</div>
{% endfor %}
</body>
</html>
""")

def step6_html():
    items = load_json(F_FINAL, [])
    cards = [{
        "es": r["es"],
        "fi": r["fi"],
        "fi2": r.get("fi2", ""),
        "category": r["category"],
        "rank": r["rank"],
        "freq": freq_band(r["rank"]),
        "color": CATEGORY_COLORS.get(r["category"], "#FFFFFF"),
    } for r in items]

    pages = [cards[i:i+PER_PAGE] for i in range(0, len(cards), PER_PAGE)]
    out = HTML.render(
        pages=pages,
        cols=COLS,
        rows=ROWS,
        margin=MARGIN_MM,
        gap=GAP_MM,
    )
    F_HTML.write_text(out, encoding="utf-8")

# -------------------------------------------------
# Main
# -------------------------------------------------
async def main():
    await step2_freq()
    step3_freq_map()
    step4_build_candidates()
    step5_join()
    step6_html()

    print("Done. Files in ./data:")
    print(" - labels.html (print this)")
    print(" - labels.csv")
    print(" - cached intermediate JSONs")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
