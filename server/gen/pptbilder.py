"""Bilder einer PowerPoint-Präsentation auflisten bzw. ersetzen.
  python3 pptbilder.py list <datei.pptx> <ordner_fuer_vorschau>   → JSON-Liste der Bilder je Folie
  python3 pptbilder.py set  <datei.pptx> <folie> <shape_id> <bild>  → Bild in diesem Rahmen ersetzen (Rahmen bleibt gleich groß)"""
import sys, os, json
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.oxml.ns import qn

def bilder(slide):
    for sh in slide.shapes:
        try:
            if sh.shape_type == MSO_SHAPE_TYPE.PICTURE or (getattr(sh, 'is_placeholder', False) and hasattr(sh, 'image')):
                sh.image  # wirft, wenn kein Bild
                if sh.width and sh.height and sh.width * sh.height > (914400 * 1.2) ** 2:  # kleine Symbole auslassen
                    yield sh
        except Exception:
            pass

def titel(slide):
    try:
        if slide.shapes.title is not None and slide.shapes.title.text.strip(): return slide.shapes.title.text.strip()
    except Exception: pass
    for sh in slide.shapes:
        if sh.has_text_frame and sh.text_frame.text.strip(): return sh.text_frame.text.strip()[:80]
    return ''

def liste(pptx, ordner):
    prs = Presentation(pptx); os.makedirs(ordner, exist_ok=True); out = []
    for i, s in enumerate(prs.slides, 1):
        for sh in bilder(s):
            fn = 'f%02d_%d.%s' % (i, sh.shape_id, sh.image.ext); open(os.path.join(ordner, fn), 'wb').write(sh.image.blob)
            out.append({'folie': i, 'shape': sh.shape_id, 'titel': titel(s), 'w': sh.width, 'h': sh.height, 'vorschau': fn})
    print(json.dumps(out, ensure_ascii=False))

def setzen(pptx, folie, shape_id, bild):
    prs = Presentation(pptx); s = prs.slides[int(folie) - 1]
    sh = next((x for x in s.shapes if x.shape_id == int(shape_id)), None)
    if sh is None: raise SystemExit('Bildrahmen nicht gefunden')
    with open(bild, 'rb') as f:
        _, rid = s.part.get_or_add_image_part(f)
    blip = sh._element.find('.//' + qn('a:blip')); blip.set(qn('r:embed'), rid)
    src = sh._element.find('.//' + qn('a:srcRect'))  # alter Zuschnitt weg: das neue Bild ist schon passend zugeschnitten
    if src is not None: src.getparent().remove(src)
    prs.save(pptx); print('ok')

if __name__ == '__main__':
    if sys.argv[1] == 'list': liste(sys.argv[2], sys.argv[3])
    else: setzen(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
