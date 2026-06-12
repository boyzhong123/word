#!/usr/bin/env python3
"""Compose the 7-frame home-page PK battle sprite from extracted character parts.

Parts live in images/home/map/monsters/pk-parts/ (clean chroma-keyed cutouts of
the boy, the jelly monster, the VS bolt and two full clash/victory scenes).
Frames are composed at 2x (296x168) with fixed anchors so the loop never wobbles.
"""

from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MONSTER_DIR = PROJECT_ROOT / "images/home/map/monsters"
PARTS_DIR = PROJECT_ROOT / "assets/pk-build/pk-parts"
FRAMES_DIR = PROJECT_ROOT / "assets/pk-build/frames"
HOME_DIR = PROJECT_ROOT / "images/home"

FRAME_COUNT = 7
# 2x assets; the frame-animation component displays them at 148x84 rpx via background-size
PK_FRAME_W = 296
PK_FRAME_H = 168
BASELINE_Y = PK_FRAME_H - 6

FRAME_OUTPUT_NAMES = [
    "student-monster-pk-frame-01.png",
    "student-monster-pk-anim-frame-02.png",
    "student-monster-pk-anim-frame-03.png",
    "student-monster-pk-anim-frame-04.png",
    "student-monster-pk-anim-frame-05.png",
    "student-monster-pk-anim-frame-06.png",
    "student-monster-pk-anim-frame-07.png",
]


def load_part(name):
    return Image.open(PARTS_DIR / name).convert("RGBA")


def scaled(image, height, squash_x=1.0, squash_y=1.0):
    factor = height / image.height
    width = max(1, round(image.width * factor * squash_x))
    new_height = max(1, round(height * squash_y))
    return image.resize((width, new_height), Image.Resampling.LANCZOS)


def paste_bottom(canvas, part, anchor_x, anchor="center", baseline=BASELINE_Y, rotate=0.0):
    """Paste with the bottom edge on the baseline; anchor_x positions left/center/right edge."""
    if rotate:
        part = part.rotate(rotate, resample=Image.Resampling.BICUBIC, expand=True)
    if anchor == "left":
        x = anchor_x
    elif anchor == "right":
        x = anchor_x - part.width
    else:
        x = anchor_x - part.width // 2
    canvas.alpha_composite(part, (max(0, x), max(0, baseline - part.height)))


def paste_top(canvas, part, center_x, top_y):
    canvas.alpha_composite(part, (max(0, center_x - part.width // 2), max(0, top_y)))


def new_frame():
    return Image.new("RGBA", (PK_FRAME_W, PK_FRAME_H), (0, 0, 0, 0))


def compose_frames():
    boy_idle = load_part("boy-idle.png")
    boy_attack = load_part("boy-attack.png")
    boy_cheer = load_part("boy-cheer.png")
    monster_idle = load_part("monster-idle.png")
    monster_angry = load_part("monster-angry.png")
    monster_dizzy = load_part("monster-dizzy.png")
    vs_badge = load_part("vs-badge.png")

    boy_h = 150
    monster_h = 118
    vs_h = 88
    boy_x = 40
    monster_x = PK_FRAME_W - 40
    vs_x = PK_FRAME_W // 2
    vs_y = 8

    frames = []

    # 1. face-off
    frame = new_frame()
    paste_bottom(frame, scaled(boy_idle, boy_h), boy_x, "left")
    paste_bottom(frame, scaled(monster_idle, monster_h), monster_x, "right")
    paste_top(frame, scaled(vs_badge, vs_h), vs_x, vs_y)
    frames.append(frame)

    # 2. boy lunges in, monster flinches, badge glows
    frame = new_frame()
    paste_bottom(frame, scaled(boy_attack, boy_h - 10), boy_x + 12, "left")
    paste_bottom(frame, scaled(monster_idle, monster_h, squash_x=1.05, squash_y=0.93), monster_x + 4, "right")
    paste_top(frame, scaled(vs_badge, round(vs_h * 1.12)), vs_x + 6, vs_y - 2)
    frames.append(frame)

    # 3. clash: both close in, badge flares
    frame = new_frame()
    paste_bottom(frame, scaled(boy_attack, boy_h - 8), boy_x + 24, "left")
    paste_bottom(frame, scaled(monster_angry, monster_h + 10), monster_x - 4, "right")
    paste_top(frame, scaled(vs_badge, round(vs_h * 1.32)), vs_x + 2, vs_y - 6, )
    frames.append(frame)

    # 4. boy cheers, monster squashed dizzy
    frame = new_frame()
    paste_bottom(frame, scaled(boy_cheer, boy_h), boy_x + 2, "left")
    paste_bottom(frame, scaled(monster_dizzy, round(monster_h * 0.82)), monster_x + 2, "right")
    paste_top(frame, scaled(vs_badge, vs_h - 8), vs_x, vs_y + 8)
    frames.append(frame)

    # 5. monster puffs back up angrily, boy eases off
    frame = new_frame()
    paste_bottom(frame, scaled(boy_idle, boy_h - 4), boy_x - 4, "left")
    paste_bottom(frame, scaled(monster_angry, monster_h + 14), monster_x - 8, "right")
    paste_top(frame, scaled(vs_badge, vs_h), vs_x - 4, vs_y)
    frames.append(frame)

    # 6. second clash
    frame = new_frame()
    paste_bottom(frame, scaled(boy_attack, boy_h - 8), boy_x + 20, "left")
    paste_bottom(frame, scaled(monster_angry, monster_h + 8, squash_x=1.04, squash_y=0.95), monster_x - 2, "right")
    paste_top(frame, scaled(vs_badge, round(vs_h * 1.26)), vs_x, vs_y - 4)
    frames.append(frame)

    # 7. back to face-off (tiny bounce) for a seamless loop
    frame = new_frame()
    paste_bottom(frame, scaled(boy_idle, boy_h), boy_x, "left")
    paste_bottom(frame, scaled(monster_idle, monster_h, squash_x=1.03, squash_y=0.96), monster_x, "right")
    paste_top(frame, scaled(vs_badge, vs_h), vs_x, vs_y + 2)
    frames.append(frame)

    return frames


def build_sprite(frames, output_path):
    sprite = Image.new("RGBA", (PK_FRAME_W * len(frames), PK_FRAME_H), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sprite.alpha_composite(frame, (index * PK_FRAME_W, 0))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(output_path, optimize=True)


def main():
    frames = compose_frames()
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    PARTS_DIR.mkdir(parents=True, exist_ok=True)
    for output_name, frame in zip(FRAME_OUTPUT_NAMES, frames):
        frame.save(FRAMES_DIR / output_name, optimize=True)
    build_sprite(frames, HOME_DIR / "student-monster-pk-sprite.png")
    print(f"Composed {FRAME_COUNT} PK frames ({PK_FRAME_W}x{PK_FRAME_H}) and sprite in {HOME_DIR}")


if __name__ == "__main__":
    main()
