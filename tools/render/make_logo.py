"""Génère le logo d'agrandir-image.fr : icône (petit carré + flèche d'agrandissement) + « AGRANDIR IMAGE »
en Geist très gras, converti en tracés (pas de dépendance à une police). Même principe que le logo d'optimiser-image.fr :
icône carrée colorée + nom en capitales grasses."""
import os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = "/data/workspace/agrandir-image"
WOFF2 = ROOT + "/node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"
TTF = "/tmp/geist-logo.ttf"
WGHT = 850
TEXT = "AGRANDIR IMAGE"
INK = "#0F172A"
C1, C2 = "#AD40ED", "#7E1FB8"   # violet Coelus (clair -> foncé)

src = TTFont(WOFF2)
inst = instancer.instantiateVariableFont(src, {"wght": WGHT})
inst.flavor = None
inst.save(TTF)

tt = TTFont(TTF)
gs = tt.getGlyphSet()
order = tt.getGlyphOrder()
upm = tt["head"].unitsPerEm
cap = tt["OS/2"].sCapHeight or int(upm * 0.7)

face = hb.Face(hb.Blob.from_file_path(TTF))
font = hb.Font(face)
buf = hb.Buffer()
buf.add_str(TEXT)
buf.guess_segment_properties()
hb.shape(font, buf, {"kern": True, "liga": False})

ICON = 240               # icône 240 x 240
CAP_TARGET = 120         # hauteur des capitales dans le logo
GAP = 54                 # espace icône -> texte
scale = CAP_TARGET / cap
baseline = (ICON + CAP_TARGET) / 2
tracking = -0.012 * upm
x0 = ICON + GAP
x = 0.0
cmds = []
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]
    pen = SVGPathPen(gs, ntos=lambda v: ("%.1f" % v).rstrip("0").rstrip("."))
    t = TransformPen(pen, (scale, 0, 0, -scale, x0 + (x + pos.x_offset) * scale, baseline - pos.y_offset * scale))
    gs[name].draw(t)
    c = pen.getCommands()
    if c:
        cmds.append(c)
    x += pos.x_advance + tracking
width = x0 + (x - tracking) * scale
W = int(round(width + 4))

def icon(prefix=""):
    gid = prefix + "g"
    return (
        f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{C1}"/><stop offset="1" stop-color="{C2}"/></linearGradient></defs>'
        f'<rect width="240" height="240" rx="58" fill="url(#{gid})"/>'
        '<rect x="50" y="122" width="68" height="68" rx="13" fill="#fff"/>'
        '<path d="M132 108 182 58M144 58h38v38" fill="none" stroke="#fff" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>'
    )

word = "".join(f'<path d="{c}"/>' for c in cmds)
logo = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 240" role="img" aria-label="Agrandir Image">'
        + icon("lg") + f'<g fill="{INK}">{word}</g></svg>\n')
fav = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">' + icon("fv") + '</svg>\n'
os.makedirs(ROOT + "/public", exist_ok=True)
open(ROOT + "/public/logo.svg", "w").write(logo)
open(ROOT + "/public/favicon.svg", "w").write(fav)
# composant Astro (SVG en ligne, ids uniques)
astro = ('---\ninterface Props { class?: string }\nconst { class: cls } = Astro.props;\n---\n'
         + logo.replace('<svg ', '<svg class={cls} ').replace('aria-label="Agrandir Image"', 'aria-hidden="true"').replace('role="img" ', ''))
open(ROOT + "/src/components/Logo.astro", "w").write(astro)
print("logo", W, "x 240 ; caps", cap, "upm", upm, "bytes", len(logo))
