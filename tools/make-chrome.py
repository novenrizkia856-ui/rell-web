"""Renders the floating chrome objects in assets/art/.

The reference site floats photoreal liquid metal forms over a near white page.
Nothing from it is reused here: these are our own renders, made by ray marching
a signed distance field and reflecting a procedural studio environment, which is
what gives chrome its look (a bright sky, a dark horizon band, a soft floor and
a rectangular softbox highlight).

Needs numpy and Pillow.

  python tools/make-chrome.py            renders every object
  python tools/make-chrome.py sphere     renders one
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "art")

SS = 3           # supersampling factor per axis
MAX_STEPS = 96
MAX_DIST = 12.0
SURF = 0.0016


# ----------------------------------------------------------------- sdf helpers
def sphere(p, centre, r):
    return np.linalg.norm(p - centre, axis=-1) - r


def smooth_union(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1.0 - h)


def scene_sphere(p):
    return sphere(p, np.array([0.0, 0.0, 0.0]), 1.0)


def scene_peanut(p):
    """Two merged lobes, the wavy form the reference floats mid page."""
    a = sphere(p, np.array([0.0, 0.62, 0.0]), 0.70)
    b = sphere(p, np.array([0.12, -0.60, 0.05]), 0.78)
    c = sphere(p, np.array([-0.16, 0.02, -0.02]), 0.50)
    return smooth_union(smooth_union(a, b, 0.55), c, 0.45)


def scene_drop(p):
    """A fat teardrop: a large lobe with a smaller one riding on top."""
    a = sphere(p, np.array([0.0, -0.18, 0.0]), 0.92)
    b = sphere(p, np.array([0.30, 0.62, 0.10]), 0.46)
    return smooth_union(a, b, 0.5)


def scene_hourglass(p):
    """Two round lobes pinched in the middle, the tall form in the centre."""
    a = sphere(p, np.array([0.02, 0.78, 0.0]), 0.62)
    b = sphere(p, np.array([-0.04, -0.72, 0.0]), 0.72)
    return smooth_union(a, b, 0.62)


def scene_stack(p):
    """Two discs resting on each other, the stacked form on the left."""
    a = sphere(p, np.array([0.0, 0.34, 0.0]), 0.78)
    b = sphere(p, np.array([0.06, -0.36, 0.06]), 0.80)
    return smooth_union(a, b, 0.22)


def scene_blob(p):
    """A soft rounded mass, wider than it is tall."""
    a = sphere(p, np.array([-0.26, 0.0, 0.0]), 0.74)
    b = sphere(p, np.array([0.28, 0.06, 0.04]), 0.70)
    c = sphere(p, np.array([0.0, -0.22, -0.05]), 0.66)
    return smooth_union(smooth_union(a, b, 0.55), c, 0.5)


SCENES = {
    "sphere": (scene_sphere, 2.9),
    "peanut": (scene_peanut, 4.0),
    "drop": (scene_drop, 3.3),
    "hourglass": (scene_hourglass, 4.2),
    "stack": (scene_stack, 3.6),
    "blob": (scene_blob, 3.4),
}


# ----------------------------------------------------------------- environment
def environment(d):
    """Procedural studio: sky, horizon band, floor, plus two softboxes."""
    y = d[..., 1]

    sky_t = np.clip((y + 0.15) / 0.9, 0.0, 1.0)
    sky = np.stack([
        0.95 + 0.05 * sky_t,
        0.96 + 0.04 * sky_t,
        0.97 + 0.03 * sky_t,
    ], axis=-1)

    # The floor stays bright. A dark floor turned these into charcoal balls;
    # the reference forms are light silver nearly all the way round.
    floor_t = np.clip((-y) / 0.8, 0.0, 1.0)
    floor = np.stack([
        0.90 - 0.30 * floor_t,
        0.91 - 0.30 * floor_t,
        0.93 - 0.29 * floor_t,
    ], axis=-1)

    col = np.where((y > 0)[..., None], sky, floor)

    # a soft horizon, just enough to read as metal rather than plastic
    band = np.exp(-((y / 0.055) ** 2)) * 0.30
    col = col * (1.0 - band[..., None])

    # key softbox, upper left
    key_dir = np.array([-0.45, 0.72, 0.52])
    key_dir = key_dir / np.linalg.norm(key_dir)
    key = np.clip((d * key_dir).sum(-1), 0, 1) ** 28
    col = col + key[..., None] * 1.05

    # fill softbox, lower right, keeps the shadow side alive
    fill_dir = np.array([0.66, -0.34, 0.62])
    fill_dir = fill_dir / np.linalg.norm(fill_dir)
    fill = np.clip((d * fill_dir).sum(-1), 0, 1) ** 14
    col = col + fill[..., None] * 0.42

    return col


def normal_at(sdf, p):
    e = 0.0012
    dx = np.array([e, 0, 0])
    dy = np.array([0, e, 0])
    dz = np.array([0, 0, e])
    n = np.stack([
        sdf(p + dx) - sdf(p - dx),
        sdf(p + dy) - sdf(p - dy),
        sdf(p + dz) - sdf(p - dz),
    ], axis=-1)
    return n / (np.linalg.norm(n, axis=-1, keepdims=True) + 1e-9)


def render(name, size):
    sdf, dist = SCENES[name]
    w = h = size * SS

    # camera, slightly above and in front, gentle perspective
    origin = np.array([0.0, 0.35, dist])
    px = (np.arange(w) + 0.5) / w * 2 - 1
    py = 1 - (np.arange(h) + 0.5) / h * 2
    gx, gy = np.meshgrid(px, py)
    span = 1.55
    target = np.stack([gx * span, gy * span + 0.1, np.zeros_like(gx)], axis=-1)
    rd = target - origin
    rd = rd / np.linalg.norm(rd, axis=-1, keepdims=True)

    p = np.broadcast_to(origin, rd.shape).copy()
    travelled = np.zeros(rd.shape[:2])
    alive = np.ones(rd.shape[:2], dtype=bool)
    hit = np.zeros(rd.shape[:2], dtype=bool)

    for _ in range(MAX_STEPS):
        d = sdf(p)
        d = np.where(alive, d, 0.0)
        newly = alive & (d < SURF)
        hit |= newly
        alive &= ~newly
        alive &= travelled < MAX_DIST
        if not alive.any():
            break
        step = np.clip(d, 0.0, 0.35)
        p = p + rd * step[..., None]
        travelled = travelled + step

    n = normal_at(sdf, p)
    view = -rd
    refl = rd - 2.0 * (n * rd).sum(-1)[..., None] * n
    env = environment(refl)

    # fresnel lifts the rim, the way a polished edge catches the sky
    cos_t = np.clip((n * view).sum(-1), 0, 1)
    fres = (0.04 + 0.96 * (1 - cos_t) ** 4)[..., None]
    col = env * (0.86 + 0.14 * fres) + fres * 0.30

    # a touch of contrast so the form reads on a white page, pivoted high so
    # it brightens rather than crushing the shadow side
    col = np.clip((col - 0.62) * 1.08 + 0.66, 0, 1)

    rgb = (col ** (1 / 1.05) * 255).astype(np.uint8)
    alpha = np.where(hit, 255, 0).astype(np.uint8)
    rgba = np.dstack([rgb, alpha])

    img = Image.fromarray(rgba, "RGBA").resize((size, size), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    # WebP is what the page loads; the PNG stays as the lossless master.
    png = os.path.join(OUT, "chrome-%s.png" % name)
    webp = os.path.join(OUT, "chrome-%s.webp" % name)
    img.save(png, optimize=True)
    img.save(webp, quality=92, method=6)
    print("wrote", webp, img.size, os.path.getsize(webp) // 1024, "KB")


def main():
    wanted = sys.argv[1:] or list(SCENES)
    sizes = {"sphere": 640, "peanut": 800, "drop": 800,
             "hourglass": 820, "stack": 760, "blob": 780}
    for name in wanted:
        render(name, sizes.get(name, 720))


if __name__ == "__main__":
    main()
