#!/usr/bin/env python3

import argparse
from pathlib import Path

from PIL import Image, ImageChops


FRAME_WIDTH = 212
FRAME_HEIGHT = 125
FRAME_PADDING_X = 4
FRAME_PADDING_Y = 3


def get_content_bbox(image):
    white = Image.new("RGB", image.size, "white")
    difference = ImageChops.difference(image, white).convert("L")
    mask = difference.point(lambda value: 255 if value > 18 else 0)
    return mask.getbbox()


def clean_background(image):
    red, green, blue = image.split()
    minimum = ImageChops.darker(ImageChops.darker(red, green), blue)
    near_white = minimum.point(lambda value: 255 if value >= 245 else 0)
    cleaned = image.copy()
    cleaned.paste("white", mask=near_white)
    return cleaned


def build_sprite(source_path, output_path):
    source = Image.open(source_path).convert("RGB")
    tile_width = source.width // 2
    tile_height = source.height // 2
    tiles = [
        source.crop((0, 0, tile_width, tile_height)),
        source.crop((tile_width, 0, source.width, tile_height)),
        source.crop((0, tile_height, tile_width, source.height)),
        source.crop((tile_width, tile_height, source.width, source.height)),
    ]

    boxes = [get_content_bbox(tile) for tile in tiles]
    if any(box is None for box in boxes):
        raise ValueError("Every source quadrant must contain a visible frame")

    max_width = max(box[2] - box[0] for box in boxes)
    max_height = max(box[3] - box[1] for box in boxes)
    scale = min(
        (FRAME_WIDTH - FRAME_PADDING_X * 2) / max_width,
        (FRAME_HEIGHT - FRAME_PADDING_Y * 2) / max_height,
    )

    sprite = Image.new("RGB", (FRAME_WIDTH * 4, FRAME_HEIGHT), "white")
    for index, (tile, box) in enumerate(zip(tiles, boxes)):
        content = clean_background(tile.crop(box))
        width = max(1, round(content.width * scale))
        height = max(1, round(content.height * scale))
        content = content.resize((width, height), Image.Resampling.LANCZOS)
        x = index * FRAME_WIDTH + (FRAME_WIDTH - width) // 2
        y = FRAME_HEIGHT - FRAME_PADDING_Y - height
        sprite.paste(content, (x, y))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(output_path, optimize=True)


def main():
    parser = argparse.ArgumentParser(
        description="Convert a 2x2 ImageGen frame sheet into a horizontal mascot sprite."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build_sprite(args.source, args.output)


if __name__ == "__main__":
    main()
  completed: {
    subtitle: '千里之行，始于足下。',
    subtitleColor: '#10b832',
    stageColor: '#08b62d',
    mascot: '../../images/home/mascot-progress.png',
    mascotSprite: '../../images/home/mascot-progress-sprite.png',
    mascotDuration: 2.4
  },
  unfinished: {
    subtitle: '实践出真知。',
    subtitleColor: '#1268ee',
    stageColor: '#1268ee',
    mascot: '../../images/home/mascot-alert.png',
    mascotSprite: '../../images/home/mascot-alert-sprite.png',
    mascotDuration: 2.4
  },
  locked: {
    subtitle: '积跬步，至千里。',
    subtitleColor: '#777777',
    stageColor: '#777777',
    mascot: '../../images/home/mascot-sleep.png',
    mascotSprite: '../../images/home/mascot-sleep-sprite.png',
    mascotDuration: 3.2
  }
}
    stageColor: '#08b62d',
    doneStages: 2,
    mascot: '../../images/home/mascot-progress.png',
    mascotSprite: '../../images/home/mascot-progress-sprite.png',
    mascotDuration: 2.4,
    locked: false,
    stageColor: '#1268ee',
    doneStages: 1,
    mascot: '../../images/home/mascot-alert.png',
    mascotSprite: '../../images/home/mascot-alert-sprite.png',
    mascotDuration: 2.4,
    locked: false,
    stageColor: '#777777',
    doneStages: 0,
    mascot: '../../images/home/mascot-sleep.png',
    mascotSprite: '../../images/home/mascot-sleep-sprite.png',
    mascotDuration: 3.2,
    locked: true,
          </view>
          <view class="unit-stage" style="color: {{unit.stageColor}};">{{unit.doneStages}}/3</view>
          <view class="unit-mascot">
            <frame-animation
              wx:if="{{unit.mascotSprite}}"
              url="{{unit.mascotSprite}}"
              count="4"
              width="169"
              height="99"
              duration="{{unit.mascotDuration}}"
              state="running"
            />
            <image wx:else class="unit-mascot-fallback" src="{{unit.mascot}}" mode="aspectFit" />
          </view>
        </view>
.unit-mascot {
  position: absolute;
  z-index: 1;
  top: -17rpx;
  height: 99rpx;
}

.unit-mascot-fallback {
  display: block;
  width: 169rpx;
  height: 99rpx;
}

  "usingComponents": {
    "frame-animation": "../../components/frame-animation/frame-animation"
  }
}
  height: var(--height);
  background-position: 0 0;
  background-repeat: no-repeat;
  background-size: calc(var(--width) * var(--count)) var(--height);
  animation-play-state: var(--state);
  }

  to {
    background-position-x: calc(var(--width) * var(--count) * -1);
  }
}

.running {
  animation: frames calc(var(--duration) * 1s) steps(var(--count)) var(--playNumber);
}

.paused {
  animation: none;
  background-position: 0 0;
}