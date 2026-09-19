"""Renders assets/brand/og-image.png in the white canvas pop art theme.

Mirrors the hero: pure white canvas with a halftone dot matrix, one violet panel
carrying a vector comic burst, the headline in Rubik Black, and the three
verification labels as solid pill badges with hard offset shadows.
"""
import os
from PIL import Image, ImageDraw, ImageFont
import math

S = 2  # supersample, downscaled at the end for clean edges
W, H = 1200 * S, 630 * S

INK = (11, 14, 23)
WHITE = (255, 255, 255)
VIOLET = (109, 40, 217)
VIOLET_LT = (139, 92, 246)
YELLOW = (255, 230, 0)
MINT = (0, 255, 133)
PURPLE = (168, 85, 247)
PINK = (255, 0, 122)

FONT = os.path.join(os.environ["TEMP"], "rubik.ttf")


def rubik(size, style="Black"):
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


def halftone(img, box, radius, step, colour, alpha):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    y = y0
    while y < y1:
        x = x0
        while x < x1:
            d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=colour + (alpha,))
            x += step
        y += step
    img.alpha_composite(layer)


base = Image.new("RGBA", (W, H), WHITE + (255,))

# Canvas halftone, same crisp dot matrix the page uses
halftone(base, (0, 0, W, H), 1.5 * S, 26 * S, INK, 33)

# ---- the panel -------------------------------------------------------------
M = 40 * S                       # margin
R = 32 * S                       # corner radius
px0, py0, px1, py1 = M, M, W - M, H - M - 10 * S
pw, ph = px1 - px0, py1 - py0

panel = Image.new("RGBA", (pw, ph), VIOLET + (255,))
pd = ImageDraw.Draw(panel)

# Sunburst wedges from a centre right of the headline
cx, cy, rad = int(pw * 0.87), int(ph * 0.46), pw * 2
n = 26
for i in range(0, n, 2):
    a0 = math.radians(i * (360 / n) - 90)
    a1 = math.radians((i + 1) * (360 / n) - 90)
    pd.polygon(
        [(cx, cy),
         (cx + rad * math.cos(a0), cy + rad * math.sin(a0)),
         (cx + rad * math.cos(a1), cy + rad * math.sin(a1))],
        fill=VIOLET_LT + (255,),
    )

# Fine yellow speed lines between them
rays = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
rd = ImageDraw.Draw(rays)
n2 = 60
for i in range(0, n2, 2):
    a0 = math.radians(i * (360 / n2) - 90 + 3)
    a1 = math.radians((i + 1) * (360 / n2) - 90 + 3)
    rd.polygon(
        [(cx, cy),
         (cx + rad * math.cos(a0), cy + rad * math.sin(a0)),
         (cx + rad * math.cos(a1), cy + rad * math.sin(a1))],
        fill=(255, 255, 255, 55),
    )
panel.alpha_composite(rays)

# Impact rings around the burst centre
for r, wdt, col in ((int(ph * 0.26), 4 * S, (255, 255, 255, 85)),
                    (int(ph * 0.35), 3 * S, (255, 255, 255, 50))):
    pd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=wdt)

# Halftone shading ramp, dots step down in size left to right
halftone(panel, (0, 0, int(pw * 0.34), ph), 5.0 * S, 20 * S, INK, 120)
halftone(panel, (int(pw * 0.34), 0, int(pw * 0.60), ph), 3.2 * S, 20 * S, INK, 100)
halftone(panel, (int(pw * 0.60), 0, int(pw * 0.80), ph), 1.9 * S, 20 * S, INK, 75)

# Round the panel corners
mask = Image.new("L", (pw, ph), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, pw - 1, ph - 1], radius=R, fill=255)

# Hard 2D offset shadow, no blur
shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle([px0 + 9 * S, py0 + 9 * S, px1 + 9 * S, py1 + 9 * S], radius=R, fill=INK + (255,))
base.alpha_composite(shadow)

base.paste(panel, (px0, py0), mask)
ImageDraw.Draw(base).rounded_rectangle([px0, py0, px1, py1], radius=R, outline=INK + (255,), width=4 * S)

d = ImageDraw.Draw(base)

# ---- wordmark --------------------------------------------------------------
f_mark = rubik(30, "Black")
mx, my = px0 + 46 * S, py0 + 40 * S
w_re = d.textlength("RE", font=f_mark)
d.text((mx, my), "RE", font=f_mark, fill=WHITE)
d.text((mx + w_re, my), "LL", font=f_mark, fill=YELLOW)

# ---- eyebrow ---------------------------------------------------------------
f_eyebrow = rubik(15, "Bold")
ey = my + 62 * S
d.line([mx, ey + 9 * S, mx + 26 * S, ey + 9 * S], fill=YELLOW, width=3 * S)
tracked(d, (mx + 38 * S, ey), "RIGHTS INTELLIGENCE", f_eyebrow, YELLOW, tracking=2.4)

# ---- headline --------------------------------------------------------------
f_h = rubik(66, "Black")
line_h = 78 * S
ty = ey + 56 * S

d.text((mx, ty), "KNOW WHAT YOUR", font=f_h, fill=WHITE)

# second line carries the highlighted word
ty2 = ty + line_h
x = mx
d.text((x, ty2), "TOKEN ", font=f_h, fill=WHITE)
x += d.textlength("TOKEN ", font=f_h)

pad_x, pad_top, pad_bot = 16 * S, 2 * S, 12 * S
wl = d.textlength("REALLY", font=f_h)
asc, desc = f_h.getmetrics()
box = [x, ty2 - pad_top, x + wl + pad_x * 2, ty2 + asc + pad_bot]
d.rounded_rectangle([box[0] + 6 * S, box[1] + 6 * S, box[2] + 6 * S, box[3] + 6 * S], radius=10 * S, fill=INK)
d.rounded_rectangle(box, radius=10 * S, fill=YELLOW, outline=INK, width=3 * S)
d.text((x + pad_x, ty2), "REALLY", font=f_h, fill=INK)

d.text((mx, ty2 + line_h), "GIVES YOU.", font=f_h, fill=WHITE)

# ---- verification pills ----------------------------------------------------
f_pill = rubik(17, "Black")
pill_y = py1 - 86 * S
px = mx
for label, fill, fg in (("ONCHAIN", MINT, INK), ("ISSUER", PURPLE, WHITE), ("REPORTED", YELLOW, INK)):
    tw = tracked_width(d, label, f_pill, tracking=1.6)
    pad = 20 * S
    a_, de_ = f_pill.getmetrics()
    h = a_ + 22 * S
    d.rounded_rectangle([px + 5 * S, pill_y + 5 * S, px + tw + pad * 2 + 5 * S, pill_y + h + 5 * S],
                        radius=9 * S, fill=INK)
    d.rounded_rectangle([px, pill_y, px + tw + pad * 2, pill_y + h],
                        radius=9 * S, fill=fill, outline=INK, width=3 * S)
    tracked(d, (px + pad, pill_y + 10 * S), label, f_pill, fg, tracking=1.6)
    px += tw + pad * 2 + 22 * S

out = base.convert("RGB").resize((1200, 630), Image.LANCZOS)
dest = r"D:\project-work\claimmap-web\assets\brand\og-image.png"
out.quantize(colors=128, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(dest, "PNG", optimize=True)
print("wrote", dest, os.path.getsize(dest), "bytes")
