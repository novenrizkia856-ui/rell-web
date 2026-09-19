"""Renders assets/brand/og-image.png.

The share card mirrors the page hero: white canvas, a quiet first line, a black
second line, and the chrome form on the right.

Needs Pillow and the Geist variable font at %TEMP%/geist.ttf:
  curl -sL -o %TEMP%/geist.ttf \
    "https://github.com/vercel/geist-font/raw/main/packages/next/dist/fonts/geist-sans/Geist-Variable.ttf"

Falls back to Segoe UI when that font is missing, so the card always renders.
"""
import os
import tempfile

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 2
W, H = 1200 * S, 630 * S

WHITE = (255, 255, 255)
BLACK = (22, 24, 26)
QUIET = (188, 192, 195)
MUTED = (106, 117, 127)
ACCENT = (124, 92, 255)


def font(size, weight="regular"):
    """Geist when it is available, Segoe UI otherwise."""
    geist = os.path.join(tempfile.gettempdir(), "geist.ttf")
    if os.path.exists(geist):
        f = ImageFont.truetype(geist, size)
        try:
            f.set_variation_by_axes([300 if weight == "light" else 500])
        except Exception:
            pass
        return f
    name = "segoeuil.ttf" if weight == "light" else "segoeui.ttf"
    return ImageFont.truetype("C:/Windows/Fonts/" + name, size)


def chrome(size):
    """A metal sphere: one light point, a dark falloff and a rim highlight."""
    img = Image.new("RGB", (size, size), (176, 181, 188))
    d = ImageDraw.Draw(img)

    # light falls from the upper left, so shade outward from that point
    lx, ly = size * 0.36, size * 0.30
    steps = 220
    reach = size * 1.15
    for i in range(steps, 0, -1):
        t = i / steps
        r = reach * t
        v = int(252 - 112 * (t ** 1.15))
        v = max(128, min(252, v))
        d.ellipse((lx - r, ly - r, lx + r, ly + r), fill=(v, v + 2, v + 6))

    # rim light along the lower right edge keeps it reading as metal
    rim = Image.new("RGB", (size, size), (0, 0, 0))
    rd = ImageDraw.Draw(rim)
    rd.ellipse((size * 0.04, size * 0.04, size * 0.99, size * 0.99), fill=(210, 214, 220))
    rd.ellipse((0, 0, size * 0.93, size * 0.93), fill=(0, 0, 0))
    rim = rim.filter(ImageFilter.GaussianBlur(size * 0.02))
    img = ImageChops.screen(img, rim)

    # specular blob
    gloss = Image.new("RGB", (size, size), (0, 0, 0))
    g = ImageDraw.Draw(gloss)
    g.ellipse((size * 0.19, size * 0.13, size * 0.47, size * 0.30), fill=(255, 255, 255))
    gloss = gloss.filter(ImageFilter.GaussianBlur(size * 0.035))
    img = ImageChops.screen(img, gloss)

    img = img.filter(ImageFilter.GaussianBlur(size * 0.006))

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    return img, mask


def main():
    img = Image.new("RGB", (W, H), WHITE)

    # accent wash behind the metal
    wash = Image.new("RGB", (W, H), WHITE)
    ImageDraw.Draw(wash).ellipse((W * 0.52, -H * 0.3, W * 1.15, H * 1.2), fill=(238, 233, 255))
    img = Image.blend(img, wash.filter(ImageFilter.GaussianBlur(120 * S)), 0.85)

    size = int(H * 0.72)
    ball, mask = chrome(size)
    img.paste(ball, (int(W * 0.66), int(H * 0.2)), mask)

    d = ImageDraw.Draw(img)
    x = 72 * S
    d.text((x, 96 * S), "RELL", font=font(34 * S), fill=BLACK)
    d.text((x, 150 * S), "RIGHTS INTELLIGENCE", font=font(17 * S), fill=MUTED)

    d.text((x, 236 * S), "A token can look", font=font(58 * S, "light"), fill=QUIET)
    d.text((x, 306 * S), "like ownership.", font=font(58 * S, "light"), fill=QUIET)
    d.text((x, 376 * S), "RELL shows what", font=font(58 * S, "light"), fill=BLACK)
    d.text((x, 446 * S), "it really gives you.", font=font(58 * S, "light"), fill=BLACK)

    d.rounded_rectangle((x, 530 * S, x + 232 * S, 570 * S), radius=20 * S, fill=BLACK)
    d.text((x + 28 * S, 540 * S), "ROBINHOOD CHAIN", font=font(15 * S), fill=WHITE)
    d.ellipse((x + 262 * S, 544 * S, x + 274 * S, 556 * S), fill=ACCENT)
    d.text((x + 286 * S, 540 * S), "STOCK TOKENS", font=font(15 * S), fill=MUTED)

    out = os.path.join(ROOT, "assets", "brand", "og-image.png")
    img.resize((1200, 630), Image.LANCZOS).save(out, optimize=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
