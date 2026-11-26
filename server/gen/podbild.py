"""Folgenbild für den Podcast: Vorlage (oder Farbverlauf in Epochenfarbe) + Nummer + Titel. Aufruf:
python3 podbild.py ziel.jpg vorlage.jpg|'' nummer titel epoche farbe"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import igen

def main():
    ziel, vorlage, nr, titel, epoche, farbe = (sys.argv[1:] + [''] * 6)[:6]
    S = 1400; col = igen.rgb(farbe or 'd99a26')
    if vorlage and os.path.exists(vorlage):
        im = Image.open(vorlage).convert('RGB'); k = max(S / im.width, S / im.height)
        im = im.resize((int(im.width * k) + 1, int(im.height * k) + 1)); l = (im.width - S) // 2; t = (im.height - S) // 2; im = im.crop((l, t, l + S, t + S))
    else:
        im = Image.new('RGB', (S, S)); d = ImageDraw.Draw(im)
        for y in range(S):
            q = y / S; d.line([(0, y), (S, y)], fill=tuple(int(a * (1 - q) + b * q) for a, b in zip((20, 26, 34), tuple(int(v * 0.85) for v in col))))
    ov = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    d.rectangle([0, int(S * 0.56), S, S], fill=(15, 23, 42, 200))      # dunkles Band unten
    d.rectangle([0, int(S * 0.56), S, int(S * 0.56) + 18], fill=col + (255,))  # Streifen in Epochenfarbe
    im = Image.alpha_composite(im.convert('RGBA'), ov); d = ImageDraw.Draw(im)
    y = int(S * 0.56) + 60; x = 80
    if nr:
        f = igen.F(84, True); w = d.textlength(nr, font=f)
        d.rounded_rectangle([x, y, x + w + 48, y + 112], radius=18, fill=col + (255,)); d.text((x + 24, y + 10), nr, font=f, fill=(255, 255, 255) if farbe.upper() != 'F1C232' else (30, 41, 59))
        y += 150
    size = 92
    while size > 48:
        f = igen.F(size, True); lines = igen._wrap(d, titel, f, S - 2 * x)
        if len(lines) * size * 1.18 <= S - y - 130: break
        size -= 6
    for ln in lines[:5]: d.text((x, y), ln, font=f, fill=(255, 255, 255)); y += int(size * 1.18)
    if epoche: d.text((x, S - 100), epoche, font=igen.F(46), fill=(226, 232, 240))
    im.convert('RGB').save(ziel, quality=90)

if __name__ == '__main__':
    main()
