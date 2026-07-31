#!/usr/bin/env python3
"""Remove solid black backgrounds from onboarding illustrations (edge flood-fill)."""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image


def is_background(r: int, g: int, b: int, tolerance: int) -> bool:
    return max(r, g, b) <= tolerance


def flood_remove_black(img: Image.Image, tolerance: int = 50) -> None:
    w, h = img.size
    pixels = img.load()
    visited = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        index = y * w + x
        if visited[index]:
            return
        r, g, b, _a = pixels[x, y]
        if is_background(r, g, b, tolerance):
            visited[index] = 1
            queue.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        if x > 0:
            push(x - 1, y)
        if x < w - 1:
            push(x + 1, y)
        if y > 0:
            push(x, y - 1)
        if y < h - 1:
            push(x, y + 1)


def process_image(src: Path, dst: Path) -> None:
    img = Image.open(src).convert("RGBA")
    flood_remove_black(img)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, optimize=True)


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: process-onboarding-image.py <source.png> <destination.png>", file=sys.stderr)
        return 1

    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])

    if not src.is_file():
        print(f"Source not found: {src}", file=sys.stderr)
        return 1

    process_image(src, dst)
    print(f"Wrote {dst}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
