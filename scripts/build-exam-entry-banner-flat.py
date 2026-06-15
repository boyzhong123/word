#!/usr/bin/env python3
"""Build home 入门测/结业测 entry banners deterministically.

Reference: home header flat-gradient card style (left 3D jelly mascot,
center title + pill badge + subtitle, right rounded CTA button).

Fixes vs. the imagegen version:
  - wider/shorter aspect ratio (1504x330 @2x, was 1504x376 felt too tall)
  - CTA button vertically centered on the right (was floating bottom-right)
  - exported at exact @2x runtime size
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
HOME_DIR = ROOT / "images" / "home"
VERCEL_DIR = ROOT / "vercel-assets" / "images" / "home"

MASCOT_ENTRY = ROOT / "assets/_archive/images/home/mascot-report-jelly-source-keyed.png"
MASCOT_EXIT = ROOT / "assets/study-record-hero-mascot-jelly-cutout-v4.png"

FONT_PATH = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_BOLD_IDX = 2   # W6
FONT_REG_IDX = 0    # W3

# Runtime @2x dimensions (card renders ~692rpx wide on home).
W, H = 1504, 330
SS = 2  # supersample factor for crisp edges
RADIUS = 40


def font(size, bold=True):
    return ImageFont.truetype(FONT_PATH, size * SS, index=FONT_BOLD_IDX if bold else FONT_REG_IDX)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size, tl, br):
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    maxd = (w - 1) + (h - 1)
    for y in range(h):
        for x in range(w):
            px[x, y] = lerp(tl, br, (x + y) / maxd)
    return img


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def fit_height(im, target_h):
    w, h = im.size
    nw = round(w * target_h / h)
    return im.resize((nw, target_h), Image.Resampling.LANCZOS)


def text_w(draw, s, fnt):
    b = draw.textbbox((0, 0), s, font=fnt)
    return b[2] - b[0]


def soft_blob(canvas, cx, cy, r, color, alpha):
    """Paste a soft translucent circle for depth."""
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.35))
    canvas.alpha_composite(layer)


def draw_padlock(draw, cx, cy, scale, color):
    """Rounded padlock icon centred at (cx, cy)."""
    bw = int(120 * scale)         # body width
    bh = int(96 * scale)          # body height
    body = [cx - bw // 2, cy - bh // 2 + int(34 * scale),
            cx + bw // 2, cy + bh // 2 + int(34 * scale)]
    # shackle
    sw = int(70 * scale)
    st = int(20 * scale)          # stroke thickness
    top = cy - bh // 2 - int(40 * scale)
    draw.arc([cx - sw // 2, top, cx + sw // 2, top + sw],
             start=180, end=360, fill=color, width=st)
    draw.line([cx - sw // 2, top + sw // 2, cx - sw // 2, body[1] + int(2 * scale)],
              fill=color, width=st)
    draw.line([cx + sw // 2, top + sw // 2, cx + sw // 2, body[1] + int(2 * scale)],
              fill=color, width=st)
    draw.rounded_rectangle(body, radius=int(22 * scale), fill=color)
    # keyhole
    kh = (255, 255, 255, 235)
    kr = int(11 * scale)
    kcx, kcy = cx, body[1] + bh // 2 - int(4 * scale)
    draw.ellipse([kcx - kr, kcy - kr, kcx + kr, kcy + kr], fill=kh)
    draw.polygon([(kcx - kr // 2, kcy), (kcx + kr // 2, kcy),
                  (kcx + kr // 3, kcy + int(26 * scale)),
                  (kcx - kr // 3, kcy + int(26 * scale))], fill=kh)


def build(out_name, *, tl, br, mascot, lock, title, badge, subtitle,
          btn_text, btn_text_color, title_color, sub_color,
          badge_bg, badge_fg, btn_bg):
    cw, ch = W * SS, H * SS
    # gradient card
    card = gradient((cw, ch), tl, br).convert("RGBA")

    # depth: top-left light sheen + bottom-right soft blob
    if not lock:
        soft_blob(card, int(cw * 0.22), int(-0.1 * ch), int(ch * 0.9),
                  (255, 255, 255), 26)
        soft_blob(card, int(cw * 0.93), int(ch * 1.05), int(ch * 0.8),
                  (0, 0, 0), 22)

    draw = ImageDraw.Draw(card)

    # ----- mascot / lock zone -----
    zone_cx = int(195 * SS)
    if lock:
        draw_padlock(draw, zone_cx, ch // 2, SS * 1.15, (174, 182, 196, 255))
    else:
        m = Image.open(mascot).convert("RGBA")
        m = m.crop(m.getbbox())
        m = fit_height(m, int(286 * SS))
        mx = zone_cx - m.width // 2
        my = (ch - m.height) // 2
        card.alpha_composite(m, (mx, my))

    # ----- text block -----
    tx = int(360 * SS)
    f_title = font(33, bold=True)
    f_badge = font(15, bold=True)
    f_sub = font(16, bold=False)
    f_btn = font(19, bold=True)

    tb = draw.textbbox((0, 0), title, font=f_title)
    title_h = tb[3] - tb[1]
    sb = draw.textbbox((0, 0), subtitle, font=f_sub)
    sub_h = sb[3] - sb[1]
    gap = int(16 * SS)
    block_h = title_h + gap + sub_h
    top = (ch - block_h) // 2

    title_y = top - tb[1]
    draw.text((tx, title_y), title, font=f_title, fill=title_color)
    title_w = tb[2] - tb[0]

    # badge pill aligned to title vertical centre
    bpad_x = int(13 * SS)
    bpad_y = int(7 * SS)
    bb = draw.textbbox((0, 0), badge, font=f_badge)
    badge_w = bb[2] - bb[0]
    badge_h = bb[3] - bb[1]
    pill_h = badge_h + bpad_y * 2
    pill_w = badge_w + bpad_x * 2
    pill_x = tx + title_w + int(16 * SS)
    title_cy = top + title_h // 2
    pill_y = title_cy - pill_h // 2
    # translucent pills must be composited (final putalpha would wipe fill alpha)
    pill_layer = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(pill_layer).rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=pill_h // 2, fill=badge_bg)
    card.alpha_composite(pill_layer)
    draw.text((pill_x + bpad_x - bb[0], pill_y + bpad_y - bb[1]),
              badge, font=f_badge, fill=badge_fg)

    # subtitle
    sub_y = top + title_h + gap - sb[1]
    draw.text((tx, sub_y), subtitle, font=f_sub, fill=sub_color)

    # ----- CTA button (vertically centred, right) -----
    cb = draw.textbbox((0, 0), btn_text, font=f_btn)
    bt_w = cb[2] - cb[0]
    bt_h = cb[3] - cb[1]
    btn_h = int(82 * SS)
    btn_w = bt_w + int(40 * SS) * 2
    btn_right = cw - int(60 * SS)
    btn_x = btn_right - btn_w
    btn_y = (ch - btn_h) // 2
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
                           radius=btn_h // 2, fill=btn_bg)
    draw.text((btn_x + (btn_w - bt_w) // 2 - cb[0],
               btn_y + (btn_h - bt_h) // 2 - cb[1]),
              btn_text, font=f_btn, fill=btn_text_color)

    # round the card corners
    mask = rounded_mask((cw, ch), RADIUS * SS)
    card.putalpha(mask)

    # downsample
    out = card.resize((W, H), Image.Resampling.LANCZOS)
    for d in (HOME_DIR, VERCEL_DIR):
        d.mkdir(parents=True, exist_ok=True)
        out.save(d / out_name, optimize=True)
    print(f"Wrote {out_name} ({W}x{H})")


def main():
    build(
        "exam-entry-banner-entry.png",
        tl=(60, 190, 86), br=(11, 148, 70),
        mascot=MASCOT_ENTRY, lock=False,
        title="入门测", badge="摸底",
        subtitle="开学前测一测，了解你的当前水平",
        btn_text="测验", btn_text_color=(16, 150, 78),
        title_color=(255, 255, 255), sub_color=(235, 255, 240, 235),
        badge_bg=(255, 255, 255, 50), badge_fg=(255, 255, 255),
        btn_bg=(255, 255, 255),
    )
    build(
        "exam-entry-banner-exit.png",
        tl=(74, 152, 246), br=(28, 100, 224),
        mascot=MASCOT_EXIT, lock=False,
        title="结业测", badge="通关",
        subtitle="检验整本书的学习成果，并与入门测对比",
        btn_text="测验", btn_text_color=(31, 110, 224),
        title_color=(255, 255, 255), sub_color=(232, 242, 255, 235),
        badge_bg=(255, 255, 255, 50), badge_fg=(255, 255, 255),
        btn_bg=(255, 255, 255),
    )
    build(
        "exam-entry-banner-exit-locked.png",
        tl=(240, 242, 246), br=(222, 227, 235),
        mascot=None, lock=True,
        title="结业测", badge="通关",
        subtitle="通关全部关卡且每关至少 2 星后解锁",
        btn_text="未解锁", btn_text_color=(255, 255, 255),
        title_color=(99, 107, 122), sub_color=(150, 157, 170),
        badge_bg=(214, 219, 227, 255), badge_fg=(150, 157, 170),
        btn_bg=(194, 200, 210),
    )


if __name__ == "__main__":
    main()
