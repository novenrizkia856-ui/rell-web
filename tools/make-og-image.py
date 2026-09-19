"""Renders assets/brand/og-image.png.

Reuses the hero field from assets/bg/hero.jpg and lays the same two tone
heading over it, so the share card and the page hero are the same artwork.

Run make-backgrounds.py first. Needs Pillow and the Rubik variable font at
%TEMP%/rubik.ttf:
  curl -sL -o %TEMP%/rubik.ttf \
    "https://github.com/google/fonts/raw/main/ofl/rubik/Rubik%5Bwght%5D.ttf"
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 2
W, H = 1200 * S, 630 * S

PAPER = (250, 250, 249)
DIM = (250, 250, 249, 92)
ONCHAIN = (126, 214, 180)
ISSUER = (168, 158, 240)
REPORTED = (226, 188, 116)

FONT = os.path.join(os.environ["TEMP"], "rubik.ttf")


def rubik(size, style="Regular"):
    f = ImageFont.truetype(FONT, size * S)
    f.set_variation_by_name(style)
    return f


def tracked(draw, xy, text, font, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking * S
    return x


# ---- the field, cropped to card proportions ---------------------------------
src = Image.open(os.path.join(ROOT, "assets", "bg", "hero.jpg")).convert("RGB")
scale = max(W / src.width, H / src.height)
src = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
left = (src.width - W) // 2
top = (src.height - H) // 2
base = src.crop((left, top, left + W, top + H)).convert("RGBA")

# Same legibility wash the page panel uses
wash = Image.new("RGBA", (W, H), (0, 0, 0, 0))
wd = ImageDraw.Draw(wash)
for x in range(W):
    f = x / W
    a = int(200 * max(0.0, 1 - f * 1.45) + 30)
    wd.line([(x, 0), (x, H)], fill=(10, 12, 18, a))
base = Image.alpha_composite(base, wash)
d = ImageDraw.Draw(base, "RGBA")

M = 80 * S

# ---- corner frame -----------------------------------------------------------
fi = 40 * S
d.rounded_rectangle([fi, fi, W - fi, H - fi], radius=14 * S,
                    outline=(250, 250, 249, 46), width=max(1, S))
sq = 9 * S
d.rectangle([fi - sq // 2, H - fi - sq // 2, fi + sq // 2, H - fi + sq // 2], fill=PAPER)
d.rectangle([W - fi - sq // 2, fi - sq // 2, W - fi + sq // 2, fi + sq // 2], fill=PAPER)

# ---- wordmark ---------------------------------------------------------------
my = M + 10 * S
hex_r = 13 * S
hx, hy = M + hex_r, my + hex_r
pts = [(hx + hex_r * math.cos(math.radians(a)), hy + hex_r * math.sin(math.radians(a)))
       for a in (-90, -30, 30, 90, 150, 210)]
d.polygon(pts, outline=PAPER, width=int(1.8 * S))
d.ellipse([hx - 3.6 * S, hy - 3.6 * S, hx + 3.6 * S, hy + 3.6 * S], fill=PAPER)
d.text((M + hex_r * 2 + 11 * S, my - 2 * S), "RELL", font=rubik(23, "Medium"), fill=PAPER)

# ---- eyebrow ----------------------------------------------------------------
ey = my + 214 * S
tracked(d, (M, ey), "RIGHTS INTELLIGENCE", rubik(13, "Regular"), (250, 250, 249, 150), tracking=2.2)

# ---- two tone heading -------------------------------------------------------
f_h = rubik(66, "Regular")
ty = ey + 44 * S
gap = 70 * S
d.text((M, ty), "Know what your token", font=f_h, fill=PAPER)
d.text((M, ty + gap), "really gives you.", font=f_h, fill=DIM)

# ---- verification pills -----------------------------------------------------
# Drawn on their own layer and composited, so the translucent fill blends
# reliably rather than replacing the pixels underneath.
pills = Image.new("RGBA", (W, H), (0, 0, 0, 0))
pd = ImageDraw.Draw(pills, "RGBA")
f_pill = rubik(16, "Regular")
py_ = ty + 2 * gap + 34 * S
px = M
for label, fg in (("Verified Onchain", ONCHAIN),
                  ("Verified From Issuer", ISSUER),
                  ("Reported Inferred", REPORTED)):
    tw = pd.textlength(label, font=f_pill)
    pad, dot, h = 18 * S, 6 * S, 36 * S
    w = pad * 2 + dot + 9 * S + tw
    pd.rounded_rectangle([px, py_, px + w, py_ + h], radius=h / 2,
                         fill=(250, 250, 249, 28), outline=(250, 250, 249, 60), width=max(1, S))
    pd.ellipse([px + pad, py_ + h / 2 - dot / 2, px + pad + dot, py_ + h / 2 + dot / 2], fill=fg)
    pd.text((px + pad + dot + 9 * S, py_ + 8 * S), label, font=f_pill, fill=PAPER)
    px += w + 12 * S
base = Image.alpha_composite(base, pills)

out = base.convert("RGB").resize((1200, 630), Image.LANCZOS)
dest = os.path.join(ROOT, "assets", "brand", "og-image.png")
out.save(dest, "PNG", optimize=True)
print("wrote", os.path.relpath(dest, ROOT), os.path.getsize(dest), "bytes")
