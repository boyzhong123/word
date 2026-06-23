#!/usr/bin/env python3
"""把 VIP 横条外圈白底抠成透明，仅保留圆角卡片本体。
从四周边界向内泛洪填充，只去掉与边界连通的近白像素，
卡片内部的奶白渐变被绿色边框包围、不会被泛洪触及，得以保留。
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src = sys.argv[1]
dst = sys.argv[2]

im = Image.open(src).convert("RGBA")
arr = np.asarray(im).astype(np.int16)
h, w = arr.shape[:2]
r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]

mx = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
# 近白：很亮且几乎无彩（饱和度低）
whitish = (mn > 222) & ((mx - mn) < 24)

# 从边界泛洪，仅保留与边界连通的白
visited = np.zeros((h, w), dtype=bool)
dq = deque()
for x in range(w):
    for y in (0, h - 1):
        if whitish[y, x] and not visited[y, x]:
            visited[y, x] = True
            dq.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if whitish[y, x] and not visited[y, x]:
            visited[y, x] = True
            dq.append((y, x))

while dq:
    y, x = dq.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and whitish[ny, nx]:
            visited[ny, nx] = True
            dq.append((ny, nx))

bg = visited
alpha = np.where(bg, 0, 255).astype(np.uint8)

# 边缘羽化：对 alpha 轻微模糊，消除锯齿
am = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(0.8))
alpha = np.asarray(am)

out = arr.astype(np.uint8).copy()
out[..., 3] = alpha
Image.fromarray(out, "RGBA").save(dst)
print(f"saved {dst}  bg pixels removed: {int(bg.sum())}/{h*w}")
