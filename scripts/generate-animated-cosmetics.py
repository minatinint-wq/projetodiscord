"""Generate the transparent animated WebP layers used by premium profiles."""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "cosmetics-animated"
FRAMES = 24
TAU = math.tau

SETS = {
    "frames": {
        "size": (384, 384),
        "themes": {
            "lunar-halo": "lunar", "ember-crown": "infernal",
            "sakura-halo": "sakura", "cyber-pulse": "cyber",
            "steel-wolf": "steel", "infernal-dragon": "infernal",
        },
    },
    "overlays": {
        "size": (480, 720),
        "themes": {
            "lunar-orbit": "lunar", "gothic-bloom": "gothic",
            "sakura-shrine": "sakura", "holo-circuit": "cyber",
            "steel-wolf": "steel", "infernal-dragon": "infernal",
        },
    },
    "banners": {
        "size": (720, 240),
        "themes": {
            "celestial-tide": "lunar", "crimson-eclipse": "gothic",
            "sakura-dawn": "sakura", "neon-pulse": "cyber",
            "steel-wolf": "steel", "infernal-dragon": "infernal",
        },
    },
}

COLORS = {
    "lunar": ((159, 205, 255), (215, 178, 255)),
    "gothic": ((171, 20, 55), (255, 83, 77)),
    "sakura": ((255, 151, 198), (255, 226, 239)),
    "cyber": ((46, 232, 255), (173, 89, 255)),
    "steel": ((91, 159, 255), (225, 240, 255)),
    "infernal": ((255, 55, 20), (255, 174, 58)),
}


def seed_particles(key: str, count: int):
    rng = random.Random(key)
    return [
        (rng.random(), rng.random(), .55 + rng.random() * .85,
         .45 + rng.random() * .8, rng.random() * TAU)
        for _ in range(count)
    ]


def star(draw, x, y, radius, color):
    r = max(1, radius)
    draw.line((x-r*2.8, y, x+r*2.8, y), fill=color, width=max(1, int(r*.45)))
    draw.line((x, y-r*2.8, x, y+r*2.8), fill=color, width=max(1, int(r*.45)))
    draw.ellipse((x-r, y-r, x+r, y+r), fill=color)


def rotated_petal(layer, x, y, size, angle, color):
    scale = 4
    target_size = max(5, int(round(size * 1.55)))
    tile_size = target_size * scale
    tile = Image.new("RGBA", (tile_size, tile_size))
    d = ImageDraw.Draw(tile)
    d.ellipse((tile_size*.17, tile_size*.1, tile_size*.83, tile_size*.7), fill=color)
    d.polygon(((tile_size*.18, tile_size*.43), (tile_size*.5, tile_size*.92),
               (tile_size*.82, tile_size*.43)), fill=color)
    d.ellipse((tile_size*.42, tile_size*.04, tile_size*.58, tile_size*.25), fill=(0, 0, 0, 0))
    d.line((tile_size*.5, tile_size*.34, tile_size*.5, tile_size*.73),
           fill=(255, 246, 250, min(180, color[3])), width=scale)
    tile = tile.rotate(math.degrees(angle), resample=Image.Resampling.BICUBIC, expand=True)
    tile = tile.resize((max(1, tile.width//scale), max(1, tile.height//scale)), Image.Resampling.LANCZOS)
    layer.alpha_composite(tile, (int(x-tile.width/2), int(y-tile.height/2)))


def tiny_crescent(layer, x, y, size, angle, color):
    scale = 4
    target_size = max(6, int(round(size*1.45)))
    tile_size = target_size*scale
    tile = Image.new("RGBA", (tile_size, tile_size))
    d = ImageDraw.Draw(tile)
    pad = tile_size*.2
    d.ellipse((pad, pad, tile_size-pad, tile_size-pad), fill=color)
    d.ellipse((tile_size*.42, tile_size*.13, tile_size*.9, tile_size*.7), fill=(0, 0, 0, 0))
    tile = tile.rotate(math.degrees(angle), resample=Image.Resampling.BICUBIC, expand=True)
    tile = tile.resize((max(1, tile.width//scale), max(1, tile.height//scale)), Image.Resampling.LANCZOS)
    layer.alpha_composite(tile, (int(x-tile.width/2), int(y-tile.height/2)))


def tiny_flame(draw, x, y, size, color, sway=0):
    points = ((x-size*.7, y+size), (x-size*.35+sway, y),
              (x+sway, y-size*1.35), (x+size*.28+sway, y-.05*size),
              (x+size*.72, y+size))
    draw.polygon(points, fill=color)
    draw.ellipse((x-size*.2, y+size*.15, x+size*.24, y+size*.78),
                 fill=(255, 226, 128, min(235, color[3]+25)))


def tiny_bat(draw, x, y, size, color, wing):
    body = max(1, size*.22)
    draw.ellipse((x-body, y-size*.42, x+body, y+size*.48), fill=color)
    draw.polygon(((x-body, y), (x-size, y-size*.38*wing),
                  (x-size*.72, y+size*.48), (x-size*.3, y+size*.2)), fill=color)
    draw.polygon(((x+body, y), (x+size, y-size*.38*wing),
                  (x+size*.72, y+size*.48), (x+size*.3, y+size*.2)), fill=color)


def tiny_chip(draw, x, y, size, color, pulse):
    half = size*.55
    bright = (*color, int(145+90*pulse))
    draw.rounded_rectangle((x-half, y-half, x+half, y+half), radius=max(1, int(size*.18)),
                           outline=bright, width=max(1, int(size*.16)))
    draw.rectangle((x-size*.16, y-size*.16, x+size*.16, y+size*.16), fill=(240, 252, 255, 220))
    for side in (-1, 1):
        draw.line((x+side*half, y, x+side*size, y), fill=bright, width=1)
        draw.line((x, y+side*half, x, y+side*size), fill=bright, width=1)


def tiny_shard(draw, x, y, size, angle, color):
    ux, uy = math.cos(angle), math.sin(angle)
    vx, vy = -uy, ux
    points = ((x+ux*size, y+uy*size), (x+vx*size*.42, y+vy*size*.42),
              (x-ux*size*.76, y-uy*size*.76), (x-vx*size*.25, y-vy*size*.25))
    draw.polygon(points, fill=color)
    draw.line((points[0], points[2]), fill=(242, 249, 255, min(235, color[3]+35)), width=1)


def bolt(draw, points, color, width):
    draw.line(points, fill=(*color, 76), width=width*5, joint="curve")
    draw.line(points, fill=(*color, 150), width=width*2, joint="curve")
    draw.line(points, fill=(238, 249, 255, 235), width=width, joint="curve")


def draw_lunar(layer, crisp, mode, phase, particles):
    w, h = layer.size
    d = ImageDraw.Draw(crisp)
    if mode == "frames":
        pad = w*.105
        for ring, color in enumerate(COLORS["lunar"]):
            start = math.degrees(phase*(1 if ring == 0 else -.72)) + ring*112
            d.arc((pad+ring*13, pad+ring*13, w-pad-ring*13, h-pad-ring*13),
                  start=start, end=start+104, fill=(*color, 220), width=5-ring)
            d.arc((pad+ring*13, pad+ring*13, w-pad-ring*13, h-pad-ring*13),
                  start=start+180, end=start+236, fill=(*color, 120), width=3)
    else:
        y = h*.22 if mode == "overlays" else h*.52
        radius = min(w*.42, h*.72)
        for ring in range(2):
            start = math.degrees(phase*(.35+ring*.16))+ring*130
            d.arc((w/2-radius-ring*17, y-radius*.34-ring*8, w/2+radius+ring*17, y+radius*.34+ring*8),
                  start=start, end=start+116, fill=(*COLORS["lunar"][ring], 115), width=3)
    for index, (px, py, depth, speed, offset) in enumerate(particles):
        pulse = .2 + .8*(math.sin(phase*speed*3+offset)*.5+.5)**3
        x = px*w
        y = py*h if mode != "frames" else h*.5 + math.sin(offset+phase*speed)*(w*.39)
        if mode == "frames":
            x = w*.5 + math.cos(offset+phase*speed)*(w*.39)
        alpha = int(205*pulse)
        color = (*COLORS["lunar"][index%2], alpha)
        if index % 5 == 0:
            tiny_crescent(crisp, x, y, 3.2+depth*1.8, phase*.12+offset, color)
        else:
            star(d, x, y, .65+depth*.75, color)


def draw_sakura(layer, crisp, mode, progress, particles):
    w, h = layer.size
    for index, (px, py, depth, speed, offset) in enumerate(particles):
        travel = (py + progress*speed*1.25) % 1.18 - .08
        x = (px*w + math.sin(progress*TAU*.72+offset)*w*.07 + travel*w*.1) % w
        y = travel*h
        size = (2.2+depth*2.8)*(1 if mode != "frames" else 1.15)
        color = (255, 225, 238, 225) if index%3 == 0 else (255, 135, 187, 205)
        rotated_petal(crisp, x, y, size, progress*TAU*(.6+speed)+offset, color)


def draw_embers(layer, crisp, mode, progress, particles, gothic=False):
    w, h = layer.size
    glow = ImageDraw.Draw(layer)
    d = ImageDraw.Draw(crisp)
    primary = COLORS["gothic" if gothic else "infernal"]
    if not gothic:
        base = h*.98
        flame_count = 8 if mode == "frames" else 12
        for index in range(flame_count):
            x = (index+.5)*w/flame_count
            sway = math.sin(progress*TAU*(1.1+index*.03)+index)*w*.012
            height = h*(.09+(index%4)*.018)
            points = [(x-w*.022, base), (x+sway-w*.014, base-height*.34),
                      (x+sway, base-height), (x+sway+w*.016, base-height*.36), (x+w*.024, base)]
            d.polygon(points, fill=(255, 74, 22, 105))
            d.line(points[1:4], fill=(255, 190, 68, 180), width=max(2, int(w/320)))
    for index, (px, py, depth, speed, offset) in enumerate(particles):
        travel = (py-progress*speed*1.35+2) % 1.12
        x = px*w + math.sin(progress*TAU*1.3+offset)*w*.018
        y = travel*h
        color = primary[index%2]
        size = 2.1+depth*2.4
        if gothic:
            if index%5 == 0:
                tiny_bat(d, x, y, size*1.12, (*color, 205), .55+math.sin(progress*TAU*2+offset)*.45)
            else:
                rotated_petal(crisp, x, y, size, progress*TAU*.45+offset, (*color, 190))
        elif index%4 == 0:
            tiny_flame(d, x, y, size, (*color, 220), math.sin(progress*TAU+offset)*size*.18)
        else:
            radius=max(1, int(size*.38))
            glow.ellipse((x-size*2.2, y-size*2.2, x+size*2.2, y+size*2.2), fill=(*color, 22))
            d.ellipse((x-radius, y-radius*1.55, x+radius, y+radius*1.55), fill=(*color, 210))
    if gothic:
        smoke = Image.new("RGBA", layer.size)
        sd = ImageDraw.Draw(smoke)
        for index in range(7):
            side = -1 if index%2 == 0 else 1
            x = (w*.08 if side < 0 else w*.92) + math.sin(progress*TAU*.25+index)*w*.055
            y = ((index*.19+progress*(.17+index*.01))%1.3-.15)*h
            radius = w*(.05+index*.004)
            sd.ellipse((x-radius, y-radius*.42, x+radius, y+radius*.42), fill=(115, 8, 38, 54))
        layer.alpha_composite(smoke.filter(ImageFilter.GaussianBlur(max(8, int(w/60)))))


def draw_cyber(layer, crisp, mode, progress, particles):
    w, h = layer.size
    d = ImageDraw.Draw(crisp)
    cyan, violet = COLORS["cyber"]
    scan = (progress*1.35-.15)*h
    d.rectangle((0, scan-2, w, scan+2), fill=(*cyan, 190))
    d.rectangle((0, scan-13, w, scan+13), outline=(*violet, 64), width=2)
    if mode == "frames":
        pad = w*.09
        for index in range(7):
            start = progress*360*(1 if index%2 == 0 else -.72)+index*51
            d.arc((pad+index%2*12, pad+index%2*12, w-pad-index%2*12, h-pad-index%2*12),
                  start=start, end=start+24+(index%3)*11, fill=(*(cyan if index%2 else violet), 210), width=4)
    else:
        grid = max(32, int(w/13))
        offset = int(progress*grid)
        for x in range(-grid+offset, w, grid):
            d.line((x, 0, x, h), fill=(*cyan, 26), width=1)
        for y in range(0, h, grid):
            d.line((0, y, w, y), fill=(*violet, 22), width=1)
    for index, (px, py, depth, speed, offset) in enumerate(particles[:12]):
        x = ((px+progress*.38*speed)%1)*w
        y = py*h
        tiny_chip(d, x, y, 3.1+depth*2.2, cyan if index%2 else violet,
                  math.sin(progress*TAU+offset)*.5+.5)


def draw_steel(layer, crisp, mode, progress, particles, key):
    w, h = layer.size
    d = ImageDraw.Draw(crisp)
    width = max(1, int(w/420))
    if mode == "frames":
        center = (w/2, h/2)
        for side in (-1, 1):
            points = []
            rng = random.Random(f"{key}-{side}")
            for step in range(9):
                angle = (-1.7+step*.42) if side < 0 else (1.45-step*.42)
                radius = w*(.405+math.sin(progress*TAU*.55+step*.8+rng.random()*TAU)*.012)
                points.append((center[0]+math.cos(angle)*radius, center[1]+math.sin(angle)*radius))
            bolt(d, points, COLORS["steel"][0], width)
    else:
        for side in (0, 1):
            x = w*.035 if side == 0 else w*.965
            direction = 1 if side == 0 else -1
            y0 = ((progress*.62+side*.43)%1.35-.18)*h
            points = [(x, y0)]
            for step in range(1, 9):
                bend=(.018+step*.004+abs(math.sin(progress*TAU*.5+step+side))*.02)*w
                points.append((x+direction*bend, y0+step*h*.055))
            bolt(d, points, COLORS["steel"][side], width)
    for index, (px, py, depth, speed, offset) in enumerate(particles[:14]):
        travel = (py-progress*speed+2)%1.1
        x = px*w+math.sin(progress*TAU+offset)*w*.012
        y = travel*h
        tiny_shard(d, x, y, 2.2+depth*3.2, progress*TAU*.42+offset,
                   (*COLORS["steel"][index%2], 185))


def render(kind, key, theme, size, frame_index, particles):
    progress = frame_index/FRAMES
    phase = progress*TAU
    glow = Image.new("RGBA", size)
    crisp = Image.new("RGBA", size)
    if theme == "lunar":
        draw_lunar(glow, crisp, kind, phase, particles)
    elif theme == "sakura":
        draw_sakura(glow, crisp, kind, progress, particles)
    elif theme == "cyber":
        draw_cyber(glow, crisp, kind, progress, particles)
    elif theme == "steel":
        draw_steel(glow, crisp, kind, progress, particles, key)
    elif theme == "gothic":
        draw_embers(glow, crisp, kind, progress, particles, gothic=True)
    else:
        draw_embers(glow, crisp, kind, progress, particles)
    blurred = crisp.filter(ImageFilter.GaussianBlur(max(2, int(size[0]/170))))
    blurred.putalpha(blurred.getchannel("A").point(lambda value: int(value*.48)))
    glow.alpha_composite(blurred)
    glow.alpha_composite(crisp)
    return glow


def main():
    for kind, config in SETS.items():
        folder = OUT/kind
        folder.mkdir(parents=True, exist_ok=True)
        for key, theme in config["themes"].items():
            particle_count = 12 if kind == "frames" else 18
            particles = seed_particles(key, particle_count)
            images = [render(kind, key, theme, config["size"], index, particles) for index in range(FRAMES)]
            destination = folder/f"{key}.webp"
            images[0].save(destination, "WEBP", save_all=True, append_images=images[1:],
                           duration=100, loop=0, lossless=True, quality=100, method=4, exact=True)
            print(f"{destination.relative_to(ROOT)} {destination.stat().st_size//1024} KiB")
            columns, rows = 6, 4
            width, height = config["size"]
            sheet = Image.new("RGBA", (width*columns, height*rows))
            for index, image in enumerate(images):
                sheet.alpha_composite(image, ((index%columns)*width, (index//columns)*height))
            sprite = folder/f"{key}.sprite.webp"
            sheet.save(sprite, "WEBP", lossless=True, quality=100, method=4, exact=True)
            print(f"{sprite.relative_to(ROOT)} {sprite.stat().st_size//1024} KiB")


if __name__ == "__main__":
    main()
