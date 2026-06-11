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
PARTS_DIR = MONSTER_DIR / "pk-parts"
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
    boy_guard = load_part("boy-guard.png")
    monster_idle = load_part("monster-idle.png")
    monster_angry = load_part("monster-angry.png")
    vs_bolt = load_part("vs-bolt.png")
    scene_clash = load_part("scene-clash.png")
    scene_victory = load_part("scene-victory.png")

    boy_h = 150
    monster_h = 116
    vs_h = 66
    boy_x = 14
    monster_x = PK_FRAME_W - 14
    vs_x = PK_FRAME_W // 2
    vs_y = 12

    frames = []

    # 1. face-off
    frame = new_frame()
    paste_bottom(frame, scaled(boy_idle, boy_h), boy_x, "left")
    paste_bottom(frame, scaled(monster_idle, monster_h), monster_x, "right")
    paste_top(frame, scaled(vs_bolt, vs_h), vs_x, vs_y)
    frames.append(frame)

    # 2. boy advances, monster leans back, bolt glows
    frame = new_frame()
    paste_bottom(frame, scaled(boy_idle, boy_h), boy_x + 16, "left", rotate=-5)
    paste_bottom(frame, scaled(monster_idle, monster_h, squash_x=1.05, squash_y=0.93), monster_x, "right")
    paste_top(frame, scaled(vs_bolt, round(vs_h * 1.18)), vs_x + 4, vs_y - 4)
    frames.append(frame)

    # 3. clash impact
    frame = new_frame()
    paste_bottom(frame, scaled(scene_clash, PK_FRAME_H - 8), vs_x, "center")
    frames.append(frame)

    # 4. monster dizzy, boy celebrates
    frame = new_frame()
    paste_bottom(frame, scaled(scene_victory, PK_FRAME_H - 6), vs_x, "center")
    frames.append(frame)

    # 5. monster puffs up angrily, boy guards with the book
    frame = new_frame()
    paste_bottom(frame, scaled(boy_guard, boy_h), boy_x + 4, "left")
    paste_bottom(frame, scaled(monster_angry, round(monster_h * 1.32)), monster_x, "right")
    paste_top(frame, scaled(vs_bolt, vs_h), vs_x - 2, vs_y + 2)
    frames.append(frame)

    # 6. second clash, slightly bigger
    frame = new_frame()
    paste_bottom(frame, scaled(scene_clash, PK_FRAME_H - 2), vs_x + 2, "center")
    frames.append(frame)

    # 7. back to face-off (tiny bounce) for a seamless loop
    frame = new_frame()
    paste_bottom(frame, scaled(boy_idle, boy_h), boy_x, "left")
    paste_bottom(frame, scaled(monster_idle, monster_h, squash_x=1.03, squash_y=0.96), monster_x, "right")
    paste_top(frame, scaled(vs_bolt, vs_h), vs_x, vs_y + 2)
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
    for output_name, frame in zip(FRAME_OUTPUT_NAMES, frames):
        frame.save(MONSTER_DIR / output_name, optimize=True)
    build_sprite(frames, HOME_DIR / "student-monster-pk-sprite.png")
    print(f"Composed {FRAME_COUNT} PK frames ({PK_FRAME_W}x{PK_FRAME_H}) and sprite in {HOME_DIR}")


if __name__ == "__main__":
    main()
