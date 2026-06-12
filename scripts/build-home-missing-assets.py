#!/usr/bin/env python3
"""Build missing home-page assets from existing source sheets and icons."""

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
HOME_DIR = PROJECT_ROOT / "images" / "home"
MONSTER_DIR = HOME_DIR / "map" / "monsters"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

JELLY_ICON_SIZE = 72
JELLY_ROW_COLUMNS = 6
MONSTER_FRAME = 166
PK_FRAME_W = 148
PK_FRAME_H = 84
STAGE_STAR_SIZE = 96
MASCOT_FRAME_W = 212
MASCOT_FRAME_H = 125
MAP_NODE_SIZE = 240
FAB_TODAY_LOCATE_SIZE = 360
FAB_TODAY_LOCATE_SOURCE = HOME_DIR / "fab-today-locate-jelly-source.png"

ICON_SET_MAPPING = {
    "icon-path-target-jelly.png": 0,
    "icon-checkin-calendar-jelly.png": 1,
    "icon-today-pin-jelly.png": 2,
}

# 底部导航图标改用小怪兽三联源图（v3），不再从旧 icon set 提取
NAV_MONSTER_SETS = {
    HOME_DIR / "nav-jelly-monster-icon-set-keyed.png": {
        "nav-study-jelly.png": 0,
        "nav-listen-jelly.png": 1,
        "nav-me-jelly.png": 2,
    },
    HOME_DIR / "nav-jelly-monster-icon-set-active-keyed.png": {
        "nav-study-jelly-active.png": 0,
        "nav-listen-jelly-active.png": 1,
        "nav-me-jelly-active.png": 2,
    },
}
NAV_MONSTER_ICON_SIZE = 96

# Post-process hooks so icons sharing a sheet column still look distinct.
ICON_SET_RECOLOR = {}

# 学习计划 uses a dedicated jelly clipboard icon instead of the calendar.
STUDY_PLAN_SOURCE = PROJECT_ROOT / "assets" / "icon-study-plan-jelly-source.png"

CHECKIN_SVG_MAPPING = {
    "icon-checkin-streak-jelly.png": "icon-checkin-streak.svg",
    "icon-checkin-total-jelly.png": "icon-checkin-total.svg",
    "icon-checkin-today-jelly.png": "icon-checkin-today.svg",
}

CHECKIN_SOURCE_PATHS = {
    "icon-checkin-streak-jelly.png": HOME_DIR / "icon-checkin-streak-jelly-source.png",
    "icon-checkin-total-jelly.png": HOME_DIR / "icon-checkin-total-jelly-source.png",
    "icon-checkin-today-jelly.png": HOME_DIR / "icon-checkin-today-jelly-source.png",
}

CHECKIN_METRIC_BUILD = {
    "icon-checkin-streak-jelly.png": {
        "profile": "green",
    },
    "icon-checkin-total-jelly.png": {
        "profile": "blue",
    },
    "icon-checkin-today-jelly.png": {
        "profile": "green",
    },
}

# Avoid --soft-matte on yellow-heavy icons: magenta dominance logic treats high-R yellow as spill.
CHECKIN_CHROMA_PROFILES = {
    "green": ["--key-color", "#00ff00", "--tolerance", "32"],
    "blue": ["--key-color", "#0000ff", "--tolerance", "32"],
}

MAP_NODE_STYLES = {
    "level-node-completed.png": {
        "fill": (255, 214, 102, 255),
        "outline": (230, 150, 0, 255),
    },
    "level-node-current.png": {
        "fill": (74, 222, 128, 255),
        "outline": (22, 163, 74, 255),
    },
    "level-node-upcoming.png": {
        "fill": (255, 255, 255, 255),
        "outline": (47, 128, 237, 255),
    },
    "level-node-locked.png": {
        "fill": (229, 231, 235, 255),
        "outline": (156, 163, 175, 255),
    },
}


def resolve_icon_set():
    keyed = HOME_DIR / "home-jelly-ui-icon-set-keyed.png"
    raw = HOME_DIR / "home-jelly-ui-icon-set.png"
    if keyed.exists():
        return keyed
    if raw.exists():
        return raw
    raise FileNotFoundError("home-jelly-ui-icon-set.png is missing")


def chroma_key(source_path, work_dir):
    source = Image.open(source_path)
    if source.mode == "RGBA" and source.getchannel("A").getextrema()[0] < 255:
        return source.convert("RGBA")

    keyed_path = work_dir / f"{source_path.stem}-keyed.png"
    if not CHROMA_KEY_SCRIPT.exists():
        return remove_near_white(source)

    subprocess.run(
        [
            sys.executable,
            str(CHROMA_KEY_SCRIPT),
            "--input",
            str(source_path),
            "--out",
            str(keyed_path),
            "--auto-key",
            "border",
            "--soft-matte",
            "--transparent-threshold",
            "12",
            "--opaque-threshold",
            "220",
            "--despill",
            "--force",
        ],
        check=True,
    )
    return Image.open(keyed_path).convert("RGBA")


def remove_near_white(image):
    rgb = image.convert("RGB")
    white = Image.new("RGB", rgb.size, "white")
    diff = ImageChops.difference(rgb, white).convert("L")
    mask = diff.point(lambda value: 255 if value > 18 else 0)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(mask)
    return rgba


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    # Drop isolated alpha specks so keyed sheets keep a tight crop.
    visible = visible.filter(ImageFilter.MinFilter(3))
    return visible.getbbox()


def solidify_jelly(image, fill_color, dilate_radius=11):
    """Fill hollow jelly icons so keyed edges stay opaque."""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > 18 else 0)
    for _ in range(max(1, dilate_radius // 2)):
        mask = mask.filter(ImageFilter.MaxFilter(3))

    fill = Image.new("RGBA", rgba.size, fill_color)
    solid = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    solid.paste(fill, mask=mask)
    solid.alpha_composite(rgba)

    boosted_alpha = solid.getchannel("A").point(
        lambda value: 255 if value > 48 else max(value, 0)
    )
    solid.putalpha(boosted_alpha)
    return solid


def shift_green_to_amber(image):
    """Recolor the mint-green jelly body to warm amber and the orange check to green."""
    import colorsys

    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            hue_deg = h * 360
            if 70 <= hue_deg <= 190 and s > 0.08:
                new_h = (42 + (hue_deg - 70) * 0.05) / 360
                nr, ng, nb = colorsys.hls_to_rgb(new_h, l, min(1.0, s * 1.5))
            elif 10 <= hue_deg < 60 and s > 0.4:
                nr, ng, nb = colorsys.hls_to_rgb(140 / 360, l, s)
            else:
                continue
            pixels[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
    return rgba


ICON_RECOLOR_FUNCS = {
    "warm_amber": shift_green_to_amber,
}


def fit_icon(image, size=JELLY_ICON_SIZE, padding=6):
    box = content_bbox(image)
    if box is None:
        raise ValueError("icon source has no visible content")

    content = image.crop(box)
    inner = size - padding * 2
    scale = min(inner / content.width, inner / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)

    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - width) // 2
    y = (size - height) // 2
    icon.alpha_composite(content, (x, y))
    return icon


def extract_jelly_icon(source_path, column_index, output_path, size=JELLY_ICON_SIZE):
    source = chroma_key(source_path, output_path.parent)
    cell_width = source.width // JELLY_ROW_COLUMNS
    cell = source.crop(
        (
            column_index * cell_width,
            0,
            (column_index + 1) * cell_width,
            source.height,
        )
    )
    icon = fit_icon(cell, size=size)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    icon.save(output_path, optimize=True)


def fit_frame(image, frame_w, frame_h, padding_x=8, padding_y=10):
    box = content_bbox(image)
    if box is None:
        raise ValueError("frame source has no visible content")

    content = image.crop(box)
    inner_w = frame_w - padding_x * 2
    inner_h = frame_h - padding_y * 2
    scale = min(inner_w / content.width, inner_h / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)

    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    x = (frame_w - width) // 2
    y = frame_h - padding_y - height
    frame.alpha_composite(content, (x, y))
    return frame


def build_single_monster_sprite(source_path, output_path, frame_size=MONSTER_FRAME):
    source = chroma_key(source_path, output_path.parent)
    frame = fit_frame(source, frame_size, frame_size, padding_x=10, padding_y=12)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    frame.save(output_path, optimize=True)


def build_horizontal_monster_sprite(
    source_path,
    output_path,
    frame_count,
    frame_size=MONSTER_FRAME,
):
    source = chroma_key(source_path, output_path.parent)
    cell_width = source.width // frame_count
    sprite = Image.new("RGBA", (frame_size * frame_count, frame_size), (0, 0, 0, 0))
    for index in range(frame_count):
        cell = source.crop(
            (
                index * cell_width,
                0,
                (index + 1) * cell_width,
                source.height,
            )
        )
        frame = fit_frame(cell, frame_size, frame_size, padding_x=10, padding_y=12)
        sprite.alpha_composite(frame, (index * frame_size, 0))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(output_path, optimize=True)


def build_pk_sprite(frame_paths, output_path):
    sprite = Image.new("RGBA", (PK_FRAME_W * len(frame_paths), PK_FRAME_H), (0, 0, 0, 0))
    for index, frame_path in enumerate(frame_paths):
        source = chroma_key(frame_path, output_path.parent)
        frame = fit_frame(source, PK_FRAME_W, PK_FRAME_H, padding_x=6, padding_y=8)
        sprite.alpha_composite(frame, (index * PK_FRAME_W, 0))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(output_path, optimize=True)


def star_points(cx, cy, outer_r, inner_r, points=5):
    from math import cos, sin, pi

    coords = []
    for index in range(points * 2):
        angle = -pi / 2 + index * pi / points
        radius = outer_r if index % 2 == 0 else inner_r
        coords.append((cx + radius * cos(angle), cy + radius * sin(angle)))
    return coords


def build_stage_star(filled):
    from math import cos, sin, pi

    size = STAGE_STAR_SIZE
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx = size / 2
    cy = size / 2 + 1
    outer = size * 0.40
    inner = size * 0.16
    points = star_points(cx, cy, outer, inner)

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_points = star_points(cx, cy, outer + 4, inner + 2)
    glow_draw.polygon(glow_points, fill=(255, 200, 60, 70 if filled else 35))
    glow = glow.filter(ImageFilter.GaussianBlur(3))
    image.alpha_composite(glow)

    draw = ImageDraw.Draw(image)
    if filled:
        draw.polygon(points, fill=(255, 196, 46, 255))
        hi_points = star_points(cx - 2, cy - 3, outer * 0.55, inner * 0.55)
        draw.polygon(hi_points, fill=(255, 236, 140, 180))
        draw.polygon(points, outline=(230, 145, 0, 220), width=2)
        draw.ellipse((cx - 10, cy - 14, cx + 2, cy - 2), fill=(255, 255, 255, 170))
    else:
        draw.polygon(points, fill=(255, 248, 225, 255))
        draw.polygon(points, outline=(255, 196, 70, 255), width=4)
    return image


def build_task_lock_icon(output_path):
    size = 72
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    body = (18, 34, 54, 54)
    draw.rounded_rectangle(body, radius=8, fill=(255, 255, 255, 255), outline=(120, 120, 120, 255), width=4)
    draw.arc((24, 16, 48, 40), start=200, end=-20, fill=(120, 120, 120, 255), width=5)
    draw.ellipse((31, 42, 41, 52), fill=(180, 180, 180, 255))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, optimize=True)


def build_fab_today_locate(output_path, source_path=FAB_TODAY_LOCATE_SOURCE, size=FAB_TODAY_LOCATE_SIZE):
    if not source_path.exists():
        raise FileNotFoundError("fab-today-locate-jelly-source.png is missing")

    work_dir = output_path.parent / ".fab-build"
    work_dir.mkdir(parents=True, exist_ok=True)
    keyed_path = work_dir / "fab-today-locate-keyed.png"
    if CHROMA_KEY_SCRIPT.exists():
        subprocess.run(
            [
                sys.executable,
                str(CHROMA_KEY_SCRIPT),
                "--input",
                str(source_path),
                "--out",
                str(keyed_path),
                "--key-color",
                "#f000d8",
                "--tolerance",
                "35",
                "--force",
            ],
            check=True,
        )
        keyed = Image.open(keyed_path).convert("RGBA")
    else:
        keyed = chroma_key(source_path, work_dir)

    box = content_bbox(keyed)
    if box is None:
        raise ValueError("fab today locate source has no visible content")

    content = keyed.crop(box)
    scale = min(size / content.width, size / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)

    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon.alpha_composite(content, ((size - width) // 2, (size - height) // 2))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    icon.save(output_path, optimize=True)


def build_study_plan_icon(output_path):
    """Build the clipboard-style 学习计划 icon; fall back to a recolored calendar."""
    if STUDY_PLAN_SOURCE.exists():
        work_dir = output_path.parent / ".jelly-build"
        work_dir.mkdir(parents=True, exist_ok=True)
        keyed_path = work_dir / "icon-study-plan-jelly-keyed.png"
        if CHROMA_KEY_SCRIPT.exists():
            subprocess.run(
                [
                    sys.executable,
                    str(CHROMA_KEY_SCRIPT),
                    "--input",
                    str(STUDY_PLAN_SOURCE),
                    "--out",
                    str(keyed_path),
                    "--force",
                ]
                + CHECKIN_CHROMA_PROFILES["green"],
                check=True,
            )
            source = Image.open(keyed_path).convert("RGBA")
        else:
            source = chroma_key(STUDY_PLAN_SOURCE, work_dir)
    else:
        source = Image.open(output_path.parent / "icon-checkin-calendar-jelly.png").convert("RGBA")
        source = shift_green_to_amber(source)
    fit_icon(source, size=JELLY_ICON_SIZE).save(output_path, optimize=True)


def extract_icon_set_icons(icon_set_path):
    clean_columns = {}
    for output_name, column_index in ICON_SET_MAPPING.items():
        if column_index not in clean_columns:
            output_path = HOME_DIR / output_name
            extract_jelly_icon(icon_set_path, column_index, output_path)
            clean_columns[column_index] = Image.open(output_path).convert("RGBA")

        icon = clean_columns[column_index].copy()
        recolor_name = ICON_SET_RECOLOR.get(output_name)
        if recolor_name:
            icon = ICON_RECOLOR_FUNCS[recolor_name](icon)
        icon.save(HOME_DIR / output_name, optimize=True)


def extract_nav_monster_icons():
    for set_path, mapping in NAV_MONSTER_SETS.items():
        if not set_path.exists():
            print(f"skip nav icons: {set_path} missing")
            continue
        source = Image.open(set_path).convert("RGBA")
        cell_width = source.width // len(mapping)
        for output_name, column_index in mapping.items():
            cell = source.crop(
                (column_index * cell_width, 0, (column_index + 1) * cell_width, source.height)
            )
            fit_icon(cell, size=NAV_MONSTER_ICON_SIZE).save(HOME_DIR / output_name, optimize=True)


def rasterize_svg(svg_path, output_path, size=JELLY_ICON_SIZE):
    tmp_dir = output_path.parent / ".svg-raster"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["qlmanage", "-t", "-s", str(size * 2), "-o", str(tmp_dir), str(svg_path)],
        check=True,
        capture_output=True,
    )
    thumb = tmp_dir / (svg_path.name + ".png")
    if not thumb.exists():
        raise FileNotFoundError(f"qlmanage did not produce {thumb}")

    icon = Image.open(thumb).convert("RGBA")
    icon = icon.resize((size, size), Image.Resampling.LANCZOS)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    icon.save(output_path, optimize=True)
    thumb.unlink(missing_ok=True)


def build_checkin_metric_icon(output_name, output_path):
    source_path = CHECKIN_SOURCE_PATHS.get(output_name)
    if source_path and source_path.exists():
        build_config = CHECKIN_METRIC_BUILD.get(output_name, {})
        work_dir = output_path.parent / ".jelly-build"
        work_dir.mkdir(parents=True, exist_ok=True)
        keyed_path = work_dir / f"{source_path.stem}-keyed.png"
        profile = build_config.get("profile", "green")
        if CHROMA_KEY_SCRIPT.exists():
            subprocess.run(
                [
                    sys.executable,
                    str(CHROMA_KEY_SCRIPT),
                    "--input",
                    str(source_path),
                    "--out",
                    str(keyed_path),
                    "--force",
                ]
                + CHECKIN_CHROMA_PROFILES.get(profile, CHECKIN_CHROMA_PROFILES["green"]),
                check=True,
            )
            source = Image.open(keyed_path).convert("RGBA")
        else:
            source = chroma_key(source_path, work_dir)

        fit_icon(source, size=JELLY_ICON_SIZE).save(output_path, optimize=True)
        return

    svg_name = CHECKIN_SVG_MAPPING.get(output_name)
    if svg_name:
        rasterize_svg(HOME_DIR / svg_name, output_path)


def build_checkin_metric_icons(output_dir):
    """Prefer ImageGen jelly sources; fall back to SVG rasterization."""
    output_dir.mkdir(parents=True, exist_ok=True)
    for output_name in CHECKIN_SVG_MAPPING:
        build_checkin_metric_icon(output_name, output_dir / output_name)


def build_mascot_sprite(source_path, output_path, frame_count=4):
    source = Image.open(source_path).convert("RGBA")
    if source.size != (MASCOT_FRAME_W, MASCOT_FRAME_H):
        source = fit_frame(source, MASCOT_FRAME_W, MASCOT_FRAME_H, padding_x=12, padding_y=10)

    sprite = Image.new(
        "RGBA",
        (MASCOT_FRAME_W * frame_count, MASCOT_FRAME_H),
        (0, 0, 0, 0),
    )
    for index in range(frame_count):
        sprite.alpha_composite(source, (index * MASCOT_FRAME_W, 0))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(output_path, optimize=True)


def build_map_node(output_path, fill, outline):
    size = MAP_NODE_SIZE
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    margin = 18
    draw.ellipse(
        (margin, margin, size - margin, size - margin),
        fill=fill,
        outline=outline,
        width=8,
    )
    highlight = (
        margin + 18,
        margin + 14,
        size - margin - 34,
        size - margin - 52,
    )
    draw.ellipse(highlight, fill=(255, 255, 255, 70))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, optimize=True)


def build_map_nodes(output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    for output_name, style in MAP_NODE_STYLES.items():
        build_map_node(output_dir / output_name, style["fill"], style["outline"])


def build_road_section(output_path):
    image = Image.new("RGBA", (750, 420), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 120, 750, 360), radius=40, fill=(167, 243, 208, 255))
    draw.rounded_rectangle((40, 170, 710, 310), radius=28, fill=(254, 243, 199, 255))
    draw.line((80, 240, 670, 240), fill=(250, 204, 21, 180), width=8)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, optimize=True)


def build_stage_stars_from_source():
    source_candidates = (
        PROJECT_ROOT / "tmp/home-icons/stage-stars-source-v2-keyed.png",
        PROJECT_ROOT / "tmp/home-icons/stage-stars-source-v2.png",
    )
    for source_path in source_candidates:
        if not source_path.exists():
            continue
        keyed = source_path
        if not source_path.name.endswith("-keyed.png"):
            work_dir = source_path.parent
            keyed = work_dir / f"{source_path.stem}-keyed.png"
            chroma_key(source_path, work_dir)
        subprocess.run(
            [
                sys.executable,
                str(PROJECT_ROOT / "scripts/build-stage-stars.py"),
                str(keyed),
                str(HOME_DIR),
            ],
            check=True,
        )
        return True
    return False


def main():
    icon_set = resolve_icon_set()
    extract_icon_set_icons(icon_set)
    extract_nav_monster_icons()
    build_study_plan_icon(HOME_DIR / "icon-study-plan-clipboard-jelly.png")
    build_checkin_metric_icons(HOME_DIR)
    build_fab_today_locate(HOME_DIR / "fab-today-locate-jelly.png")

    if not build_stage_stars_from_source():
        build_stage_star(True).save(HOME_DIR / "stage-star-filled.png", optimize=True)
        build_stage_star(False).save(HOME_DIR / "stage-star-empty.png", optimize=True)
    build_task_lock_icon(HOME_DIR / "task-lock.png")

    report_source = HOME_DIR / "icon-report-jelly.png"
    if report_source.exists():
        source = chroma_key(report_source, HOME_DIR)
        fit_icon(source, size=32).save(HOME_DIR / "icon-report-pill.png", optimize=True)

    report_mascot_source = HOME_DIR / "mascot-report-jelly-source.png"
    if report_mascot_source.exists():
        source = chroma_key(report_mascot_source, HOME_DIR)
        fit_frame(source, MASCOT_FRAME_W, MASCOT_FRAME_H, padding_x=8, padding_y=8).save(
            HOME_DIR / "mascot-report-jelly.png",
            optimize=True,
        )

    build_work = PROJECT_ROOT / "assets" / "build-work"
    build_single_monster_sprite(
        build_work / "jelly-green-monster-defeated.png",
        MONSTER_DIR / "jelly-defeated.png",
    )
    build_single_monster_sprite(
        build_work / "jelly-green-monster-locked.png",
        MONSTER_DIR / "jelly-locked.png",
    )
    build_horizontal_monster_sprite(
        build_work / "jelly-green-monster-fighting-6-frames.png",
        MONSTER_DIR / "jelly-fighting.png",
        frame_count=6,
    )

    pk_gen_frames = [MONSTER_DIR / f"student-monster-pk-gen-frame-{index:02d}.png" for index in range(1, 8)]
    if all(frame_path.exists() for frame_path in pk_gen_frames):
        subprocess.run(
            [sys.executable, str(PROJECT_ROOT / "scripts/build-pk-sprite.py"), "--frames", *map(str, pk_gen_frames)],
            check=True,
        )
    else:
        pk_source = MONSTER_DIR / "student-monster-pk-7frames-source.png"
        if pk_source.exists():
            subprocess.run(
                [sys.executable, str(PROJECT_ROOT / "scripts/build-pk-sprite.py"), str(pk_source)],
                check=True,
            )

    task_sources = {
        "task-word.png": HOME_DIR / "task-word-new-icon.png",
        "task-recitation.png": HOME_DIR / "task-recitation-icon.png",
        "task-listening.png": HOME_DIR / "task-listening-quiz-icon.png",
    }
    for output_name, source_path in task_sources.items():
        source = chroma_key(source_path, HOME_DIR)
        fit_icon(source, size=72).save(HOME_DIR / output_name, optimize=True)

    mascot_sources = {
        "mascot-progress.png": build_work / "jelly-green-monster-defeated.png",
        "mascot-alert.png": build_work / "jelly-green-monster-base.png",
        "mascot-sleep.png": build_work / "jelly-green-monster-locked.png",
    }
    for output_name, source_path in mascot_sources.items():
        source = chroma_key(source_path, HOME_DIR)
        fit_frame(source, MASCOT_FRAME_W, MASCOT_FRAME_H, padding_x=12, padding_y=10).save(
            HOME_DIR / output_name,
            optimize=True,
        )

    build_mascot_sprite(HOME_DIR / "mascot-progress.png", HOME_DIR / "mascot-progress-sprite.png")
    build_mascot_sprite(HOME_DIR / "mascot-alert.png", HOME_DIR / "mascot-alert-sprite.png")
    build_mascot_sprite(HOME_DIR / "mascot-sleep.png", HOME_DIR / "mascot-sleep-sprite.png")

    build_map_nodes(HOME_DIR / "map")
    build_road_section(HOME_DIR / "map" / "road-section.png")

    print("Built missing home assets in", HOME_DIR)


if __name__ == "__main__":
    main()
