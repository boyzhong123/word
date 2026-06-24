#!/usr/bin/env python3
"""Build onboarding panel-01: hero banner + clean intro positioning card."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = PROJECT_ROOT / "images" / "onboarding" / "onboard-panel-01.jpg"
VERCEL_PATH = PROJECT_ROOT / "vercel-assets" / "images" / "onboarding" / "onboard-panel-01.jpg"

PANEL_W = 1092
HERO_H = 900
CARD_MARGIN_X = 48
CARD_TOP = 780
CARD_RADIUS = 48
CARD_BOTTOM_PAD = 72

HERO_PATH = PROJECT_ROOT / "images" / "onboarding" / "onboard-intro-hero.png"
LOGO_PATH = PROJECT_ROOT / "images" / "app-logo.png"
MASCOT_PATH = PROJECT_ROOT / "images" / "home" / "today-route-guide-mascot.png"
PROOF_ICONS = [
    (PROJECT_ROOT / "images" / "onboarding" / "onboard-proof-textbook.png", "不乱学", "按教材单元"),
    (PROJECT_ROOT / "images" / "onboarding" / "onboard-proof-mic.png", "不瞎读", "驰声 AI 纠音"),
    (PROJECT_ROOT / "images" / "onboarding" / "onboard-proof-review.png", "不白背", "错词自动复习"),
]

FONT_CANDIDATES = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    index = 2 if bold else 0
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size, index=index)
            except OSError:
                try:
                    return ImageFont.truetype(path, size=size)
                except OSError:
                    continue
    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius: int, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def paste_cover(canvas: Image.Image, image: Image.Image, box: tuple[int, int, int, int]):
    x0, y0, x1, y1 = box
    target_w = x1 - x0
    target_h = y1 - y0
    src = image.convert("RGBA")
    scale = max(target_w / src.width, target_h / src.height)
    resized = src.resize(
        (max(1, round(src.width * scale)), max(1, round(src.height * scale))),
        Image.Resampling.LANCZOS,
    )
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    cropped = resized.crop((left, top, left + target_w, top + target_h))
    canvas.alpha_composite(cropped, (x0, y0))


def mascot_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def wrap_text(text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for ch in text:
        candidate = current + ch
        if font.getlength(candidate) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = ch
    if current:
        lines.append(current)
    return lines


def draw_mascot_badge(card: Image.Image, mascot: Image.Image, cx: int, cy: int, diameter: int):
    layer = Image.new("RGBA", card.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    glow = (220, 250, 235, 255)
    draw.ellipse(
        (cx - diameter // 2, cy - diameter // 2, cx + diameter // 2, cy + diameter // 2),
        fill=glow,
    )
    inner = diameter - 28
    draw.ellipse(
        (cx - inner // 2, cy - inner // 2, cx + inner // 2, cy + inner // 2),
        fill=(255, 255, 255, 255),
    )
    card.alpha_composite(layer)

    box = mascot_bbox(mascot)
    content = mascot.crop(box) if box else mascot
    target = inner - 36
    scale = target / max(content.width, content.height)
    tw = max(1, round(content.width * scale))
    th = max(1, round(content.height * scale))
    content = content.resize((tw, th), Image.Resampling.LANCZOS)
    card.alpha_composite(content, (cx - tw // 2, cy - th // 2 + 8))


def build_panel() -> Image.Image:
    panel = Image.new("RGBA", (PANEL_W, CARD_TOP + 900), (231, 225, 240, 255))
    draw = ImageDraw.Draw(panel)

    # Sky gradient background
    for y in range(CARD_TOP + 900):
        t = y / max(1, CARD_TOP + 900 - 1)
        r = round(231 + (188 - 231) * t)
        g = round(225 + (208 - 225) * t)
        b = round(240 + (248 - 240) * t)
        draw.line([(0, y), (PANEL_W, y)], fill=(r, g, b, 255))

    hero = Image.open(HERO_PATH).convert("RGBA")
    paste_cover(panel, hero, (0, 0, PANEL_W, HERO_H))

    fade = Image.new("RGBA", (PANEL_W, 180), (0, 0, 0, 0))
    fade_draw = ImageDraw.Draw(fade)
    for y in range(180):
        alpha = int(235 * (y / 179) ** 1.4)
        fade_draw.line([(0, y), (PANEL_W, y)], fill=(231, 225, 240, alpha))
    panel.alpha_composite(fade, (0, HERO_H - 180))

    badge_font = load_font(28, bold=True)
    badge_w, badge_h = 360, 56
    badge = Image.new("RGBA", (badge_w, badge_h), (0, 0, 0, 0))
    badge_draw = ImageDraw.Draw(badge)
    rounded_rect(badge_draw, (0, 0, badge_w, badge_h), 28, (255, 255, 255, 230))
    badge_draw.text((24, 12), "同步教材 · 每天 10 分钟", fill=(55, 80, 65, 255), font=badge_font)
    panel.alpha_composite(badge, (48, 56))

    card_w = PANEL_W - CARD_MARGIN_X * 2
    proof_top = 330
    proof_gap = 16
    proof_w = (card_w - 72 - proof_gap * 2) // 3
    proof_h = 190
    card_h = proof_top + proof_h + 150
    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card)
    rounded_rect(card_draw, (0, 0, card_w, card_h), CARD_RADIUS, (255, 255, 255, 245))
    card_draw.rounded_rectangle(
        (0, 0, card_w, card_h),
        radius=CARD_RADIUS,
        outline=(233, 239, 236, 255),
        width=2,
    )

    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo_size = 104
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    card.alpha_composite(logo, (36, 36))

    title_font = load_font(52, bold=True)
    em_font = load_font(44, bold=True)
    sub_font = load_font(30)
    body_font = load_font(30)
    proof_title_font = load_font(30, bold=True)
    proof_sub_font = load_font(24, bold=True)

    card_draw.text((156, 40), "词句刷刷刷", fill=(91, 107, 97, 255), font=sub_font)
    card_draw.text((156, 78), "同步教材", fill=(22, 33, 27, 255), font=title_font)
    card_draw.text((156, 146), "背单词 · 背句子 · 记谚语", fill=(23, 182, 90, 255), font=em_font)

    body = "选好年级和课本，每天 10 分钟，把这一单元的词句听读背测一遍记牢。"
    body_y = 220
    for line in wrap_text(body, body_font, card_w - 250):
        card_draw.text((36, body_y), line, fill=(103, 117, 110, 255), font=body_font)
        body_y += 42

    for idx, (icon_path, title, subtitle) in enumerate(PROOF_ICONS):
        x = 36 + idx * (proof_w + proof_gap)
        y = proof_top
        rounded_rect(card_draw, (x, y, x + proof_w, y + proof_h), 24, (243, 255, 246, 255))
        card_draw.rounded_rectangle(
            (x, y, x + proof_w, y + proof_h),
            radius=24,
            outline=(217, 243, 223, 255),
            width=2,
        )
        icon = Image.open(icon_path).convert("RGBA")
        icon_size = 56
        icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        card.alpha_composite(icon, (x + (proof_w - icon_size) // 2, y + 22))
        tw = proof_title_font.getlength(title)
        card_draw.text((x + (proof_w - tw) / 2, y + 92), title, fill=(22, 33, 27, 255), font=proof_title_font)
        sw = proof_sub_font.getlength(subtitle)
        card_draw.text((x + (proof_w - sw) / 2, y + 132), subtitle, fill=(31, 142, 76, 255), font=proof_sub_font)

    mascot = Image.open(MASCOT_PATH).convert("RGBA")
    draw_mascot_badge(card, mascot, card_w - 104, card_h + 18, 220)

    panel.alpha_composite(card, (CARD_MARGIN_X, CARD_TOP))

    panel_h = CARD_TOP + card_h + CARD_BOTTOM_PAD
    panel = panel.crop((0, 0, PANEL_W, panel_h))
    return panel.convert("RGB")


def main():
    panel = build_panel()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    panel.save(OUT_PATH, format="JPEG", quality=92, optimize=True)
    VERCEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    panel.save(VERCEL_PATH, format="JPEG", quality=92, optimize=True)
    print(f"built {OUT_PATH} ({panel.size[0]}x{panel.size[1]})")


if __name__ == "__main__":
    main()
