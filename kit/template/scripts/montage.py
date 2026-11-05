# Склейка скриншотов в ряд (по высоте экрана 844 css): python3 scripts/montage.py out.png a.png b.png ...
import sys
from PIL import Image
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
w = 390; h = 844
tiles = [im.resize((w, int(im.height * w / im.width))).crop((0, 0, w, h)) for im in ims]
sheet = Image.new('RGB', (w * len(tiles) + 8 * (len(tiles) - 1), h), (255, 0, 255))
for i, t in enumerate(tiles):
    sheet.paste(t, (i * (w + 8), 0))
sheet.save(out); print(out)
