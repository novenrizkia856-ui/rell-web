"""Generates the abstract panel backgrounds in assets/bg/.

The reference layout leans on large rounded panels filled with soft, out of
focus photography. RELL has no photo library, so these stand in: multi point
colour fields, blurred hard, with a little grain so they do not band. They read
as depth rather than as a picture of anything.

  python tools/make-backgrounds.py
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "bg"
)
os.makedirs(OUT, exist_ok=True)

# Each field is a list of (x, y, radius, colour) blobs in unit coordinates.
FIELDS = {
    # Hero: deep, cool, with a lift toward the upper right
    "hero": {
        "size": (1800, 1100),
        "base": (26, 31, 46),
        "blobs": [
            (0.12, 0.20, 0.62, (38, 52, 86)),
            (0.78, 0.12, 0.55, (86, 104, 158)),
            (0.95, 0.55, 0.50, (140, 160, 206)),
            (0.45, 0.85, 0.60, (22, 26, 38)),
            (0.62, 0.42, 0.34, (60, 74, 120)),
        ],
    },
    # Verification: lighter, steel and haze
    "proof": {
        "size": (1600, 900),
        "base": (118, 136, 160),
        "blobs": [
            (0.10, 0.25, 0.60, (168, 188, 208)),
            (0.85, 0.20, 0.52, (92, 110, 138)),
            (0.55, 0.90, 0.58, (58, 70, 92)),
            (0.30, 0.60, 0.40, (146, 162, 182)),
        ],
    },
    # Onchain: near black with a cold edge
    "onchain": {
        "size": (1600, 900),
        "base": (17, 17, 17),
        "blobs": [
            (0.15, 0.30, 0.55, (34, 38, 48)),
            (0.80, 0.25, 0.48, (58, 66, 88)),
            (0.60, 0.85, 0.50, (14, 14, 14)),
        ],
    },
    # Closing call to action: warmer, brighter, optimistic
    "cta": {
        "size": (1800, 800),
        "base": (58, 66, 92),
        "blobs": [
            (0.08, 0.30, 0.58, (96, 108, 148)),
            (0.72, 0.15, 0.52, (158, 172, 212)),
            (0.95, 0.80, 0.48, (72, 84, 116)),
            (0.40, 0.90, 0.50, (34, 38, 54)),
        ],
    },
}


def field(spec, seed):
    w, h = spec["size"]
    # Build small, then blur and upscale. Far cheaper and smoother than
    # painting thousands of ellipses at full size.
    sw, sh = w // 6, h // 6
    img = Image.new("RGB", (sw, sh), spec["base"])
    d = ImageDraw.Draw(img, "RGBA")

    for (cx, cy, rad, colour) in spec["blobs"]:
        px, py = cx * sw, cy * sh
        steps = 46
        for i in range(steps, 0, -1):
            f = i / steps
            a = int(150 * (1 - f) ** 1.5)
            if a <= 0:
                continue
            r = rad * sw * f
            d.ellipse([px - r, py - r * 0.9, px + r, py + r * 0.9], fill=colour + (a,))

    img = img.filter(ImageFilter.GaussianBlur(radius=sw * 0.055))
    img = img.resize((w, h), Image.LANCZOS)
    img = img.filter(ImageFilter.GaussianBlur(radius=3))

    # A little grain stops the gradients banding once they are compressed
    rnd = random.Random(seed)
    grain = Image.new("L", (w // 2, h // 2))
    grain.putdata([128 + rnd.randint(-13, 13) for _ in range((w // 2) * (h // 2))])
    grain = grain.resize((w, h), Image.BILINEAR)
    img = Image.blend(img, Image.merge("RGB", (grain, grain, grain)), 0.045)
    return img


for i, (name, spec) in enumerate(FIELDS.items()):
    img = field(spec, seed=1000 + i)
    path = os.path.join(OUT, name + ".jpg")
    img.save(path, "JPEG", quality=82, optimize=True, progressive=True)
    print("wrote", os.path.relpath(path), os.path.getsize(path), "bytes",
          "%dx%d" % img.size)
