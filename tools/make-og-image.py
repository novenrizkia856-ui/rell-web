"""Renders assets/brand/og-image.png in the calm infrastructure theme.

Mirrors the hero: paper canvas, a faint measuring grid, the headline in Inter
Medium, and the three verification labels as quiet pills.

Needs Pillow and the Inter variable font at %TEMP%/inter.ttf:
  curl -sL -o %TEMP%/inter.ttf \
    "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf"
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

S = 2  # supersample, downscaled at the end for clean edges
W, H = 1200 * S, 630 * S

PAPER = (251, 251, 250)
INK = (18, 16, 15)
TEXT_2 = (92, 88, 84)
TEXT_3 = (138, 133, 128)
LINE = (232, 231, 228)

ONCHAIN, ONCHAIN_SOFT = (31, 122, 77), (231, 242, 236)
ISSUER, ISSUER_SOFT = (91, 75, 196), (236, 235, 249)
REPORTED, REPORTED_SOFT = (154, 107, 18), (247, 239, 223)

FONT = os.path.join(os.environ["TEMP"], "inter.ttf")


def inter(size, style="Medium"):
    f = ImageFont.truetype(FONT, size * S)
    f.set_variation_by_name(style)
    return f


def tracked(draw, xy, text, font, fill, tracking=0):
    """Pillow has no letter spacing, so step the pen manually."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking * S
    return x


def tracked_width(draw, text, font, tracking=0):
    return sum(draw.textlength(c, font=font) + tracking * S for c in text)


base = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(base)

# ---- measuring grid, uniform and faint ---------------------------------------
grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(grid)
step = 96 * S
for x in range(step, W, step):
    gd.line([(x, 0), (x, H)], fill=LINE + (170,), width=S)
for y in range(step, H, step):
    gd.line([(0, y), (W, y)], fill=LINE + (170,), width=S)
base = Image.alpha_composite(base.convert("RGBA"), grid).convert("RGB")
d = ImageDraw.Draw(base)

# The colour on this card comes from the pills alone. A washed gradient banded
# into a visible arc once the PNG was palettised, and paper reads cleaner.

M = 84 * S  # left margin

# ---- wordmark ---------------------------------------------------------------
my = 74 * S
hex_r = 15 * S
hx, hy = M + hex_r, my + hex_r
pts = [
    (hx + hex_r * math.cos(math.radians(a)), hy + hex_r * math.sin(math.radians(a)))
    for a in (-90, -30, 30, 90, 150, 210)
]
d.polygon(pts, outline=INK, width=int(2.2 * S))
d.ellipse([hx - 4.2 * S, hy - 4.2 * S, hx + 4.2 * S, hy + 4.2 * S], fill=INK)
d.text((M + hex_r * 2 + 12 * S, my - 1 * S), "RELL", font=inter(25, "SemiBold"), fill=INK)

# ---- eyebrow ----------------------------------------------------------------
f_eyebrow = inter(13, "Medium")
ey = my + 84 * S
d.line([M, ey + 8 * S, M + 26 * S, ey + 8 * S], fill=TEXT_3, width=int(1.4 * S))
tracked(d, (M + 38 * S, ey), "RIGHTS INTELLIGENCE", f_eyebrow, TEXT_3, tracking=1.9)

# ---- headline ---------------------------------------------------------------
f_h = inter(72, "Medium")
ty = ey + 54 * S
line_gap = 82 * S
for i, line in enumerate(("Know what your token", "really gives you.")):
    d.text((M, ty + i * line_gap), line, font=f_h, fill=INK)

# ---- supporting line --------------------------------------------------------
f_sub = inter(22, "Regular")
sy = ty + 2 * line_gap + 26 * S
d.text((M, sy), "Six categories, three levels of proof, sources always shown.", font=f_sub, fill=TEXT_2)

# ---- verification pills -----------------------------------------------------
f_pill = inter(17, "Medium")
py_ = sy + 62 * S
px = M
for label, fg, bg in (
    ("Verified Onchain", ONCHAIN, ONCHAIN_SOFT),
    ("Verified From Issuer", ISSUER, ISSUER_SOFT),
    ("Reported Inferred", REPORTED, REPORTED_SOFT),
):
    tw = d.textlength(label, font=f_pill)
    pad = 20 * S
    dot = 7 * S
    h = 40 * S
    w = pad * 2 + dot + 9 * S + tw
    d.rounded_rectangle([px, py_, px + w, py_ + h], radius=h / 2, fill=bg)
    d.ellipse(
        [px + pad, py_ + h / 2 - dot / 2, px + pad + dot, py_ + h / 2 + dot / 2],
        fill=fg,
    )
    d.text((px + pad + dot + 9 * S, py_ + 9 * S), label, font=f_pill, fill=fg)
    px += w + 14 * S

out = base.resize((1200, 630), Image.LANCZOS)
dest = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "assets", "brand", "og-image.png")
out.quantize(colors=255, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(
    dest, "PNG", optimize=True
)
print("wrote", dest, os.path.getsize(dest), "bytes")
