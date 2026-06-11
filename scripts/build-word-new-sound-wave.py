#!/usr/bin/env python3
"""Build word-new speaker icon assets (static + 3-frame sprites)."""

from pathlib import Path

from PIL import Image, ImageDraw

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = PROJECT_ROOT / "images" / "word-new"

RENDER_SCALE = 16
FRAMES = 3

ICON_SETS = {
    "dark": {
        "color": (248, 249, 251, 255),
        "width": 28,
        "height": 20,
        "stroke": 2.0,
        "wave_radii": [4.0, 6.0, 8.0],
    },
    "light": {
        "color": (70, 78, 88, 255),
        "width": 28,
        "height": 20,
        "stroke": 2.0,
        "wave_radii": [4.0, 6.0, 8.0],
    },
    "light-lg": {
        "color": (58, 66, 76, 255),
        "width": 36,
        "height": 26,
        "stroke": 2.4,
        "wave_radii": [5.0, 7.5, 10.0],
    },
}


def draw_speaker_body(draw, spec, scale):
    color = spec["color"]
    height = spec["height"] * scale
    center_y = height / 2

    box_w = 3.2 * scale
    box_h = 6.4 * scale
    box_x = 0.4 * scale
    box_y = center_y - box_h / 2
    radius = max(1, int(round(0.9 * scale)))
    draw.rounded_rectangle(
        [box_x, box_y, box_x + box_w, box_y + box_h],
        radius=radius,
        fill=color,
    )

    cone_left = box_x + box_w - 0.35 * scale
    cone_right = 8.8 * scale
    cone_top = center_y - 4.8 * scale
    cone_bottom = center_y + 4.8 * scale
    draw.polygon(
        [
            (cone_left, cone_top),
            (cone_right, center_y),
            (cone_left, cone_bottom),
        ],
        fill=color,
    )


def draw_wave_arcs(draw, spec, frame_index, scale):
    color = spec["color"]
    stroke = spec["stroke"] * scale
    center_y = spec["height"] * scale / 2
    anchor_x = 9.2 * scale
    visible = max(1, min(FRAMES, frame_index + 1))

    for radius in spec["wave_radii"][:visible]:
        r = radius * scale
        box = [
            anchor_x,
            center_y - r,
            anchor_x + 2 * r,
            center_y + r,
        ]
        draw.arc(
            box,
            start=300,
            end=60,
            fill=color,
            width=max(1, int(round(stroke))),
        )


def render_frame(frame_index, spec):
    width = spec["width"] * RENDER_SCALE
    height = spec["height"] * RENDER_SCALE
    image = Image.new("RGBA", (int(width), int(height)), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_speaker_body(draw, spec, RENDER_SCALE)
    draw_wave_arcs(draw, spec, frame_index, RENDER_SCALE)
    return image.resize((spec["width"], spec["height"]), Image.Resampling.LANCZOS)


def build_set(name, spec):
    static = render_frame(FRAMES - 1, spec)
    static.save(OUT_DIR / f"sound-wave-{name}.png")

    sprite = Image.new(
        "RGBA",
        (spec["width"] * FRAMES, spec["height"]),
        (0, 0, 0, 0),
    )
    for index in range(FRAMES):
        sprite.paste(render_frame(index, spec), (index * spec["width"], 0))
    sprite.save(OUT_DIR / f"sound-wave-{name}-sprite.png")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, spec in ICON_SETS.items():
        build_set(name, spec)
    print("Wrote sound-wave assets to", OUT_DIR)


if __name__ == "__main__":
    main()
