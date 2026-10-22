# Нарезка длинного скриншота на экраны: python3 scripts/split-shot.py <png> [высота_css=844] [scale=2]
import sys
from PIL import Image
src = sys.argv[1]; h = int(sys.argv[2]) if len(sys.argv) > 2 else 844; s = int(sys.argv[3]) if len(sys.argv) > 3 else 2
im = Image.open(src); step = h * s
for i, top in enumerate(range(0, im.height, step)):
    out = src.replace('.png', f'-p{i + 1}.png')
    im.crop((0, top, im.width, min(top + step, im.height))).save(out); print(out)
