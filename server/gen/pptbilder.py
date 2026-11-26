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
            out.append({'folie': i, 'shape': sh.shape_id, 'titel': titel(s), 'w': sh.width, 'h': sh.height, 'vorschau': fn, 'orig': hatorig(pptx, i, sh.shape_id)})
    print(json.dumps(out, ensure_ascii=False))

def sicher(pptx, folie, sh):
    """Originalbild (und Zuschnitt) beim ersten Austausch sichern: <pptx-Ordner>/_pptorig/f<folie>_<shape>.<ext> + .json"""
    d = os.path.join(os.path.dirname(pptx), '_pptorig'); os.makedirs(d, exist_ok=True); base = os.path.join(d, 'f%02d_%d' % (int(folie), sh.shape_id))
    if os.path.exists(base + '.json'): return
    src = sh._element.find('.//' + qn('a:srcRect')); open(base + '.' + sh.image.ext, 'wb').write(sh.image.blob)
    json.dump({'ext': sh.image.ext, 'src': dict(src.attrib) if src is not None else {}}, open(base + '.json', 'w'))

def hatorig(pptx, folie, shape):
    return os.path.exists(os.path.join(os.path.dirname(pptx), '_pptorig', 'f%02d_%d.json' % (int(folie), int(shape))))

def zurueck(pptx, folie, shape_id):
    prs = Presentation(pptx); s = prs.slides[int(folie) - 1]; sh = next((x for x in s.shapes if x.shape_id == int(shape_id)), None)
    if sh is None: raise SystemExit('Bildrahmen nicht gefunden')
    base = os.path.join(os.path.dirname(pptx), '_pptorig', 'f%02d_%d' % (int(folie), int(shape_id)))
    if not os.path.exists(base + '.json'): raise SystemExit('Kein Original gesichert')
    meta = json.load(open(base + '.json'))
    with open(base + '.' + meta['ext'], 'rb') as f: _, rid = s.part.get_or_add_image_part(f)
    blip = sh._element.find('.//' + qn('a:blip')); blip.set(qn('r:embed'), rid)
    old = sh._element.find('.//' + qn('a:srcRect'))
    if old is not None: old.getparent().remove(old)
    if meta.get('src'):
        from lxml import etree
        el = etree.Element(qn('a:srcRect'))
        for k, v in meta['src'].items(): el.set(k, v)
        blip.addnext(el)
    prs.save(pptx); print('ok')

def entfernen(pptx, folie, shape_id):
    prs = Presentation(pptx); s = prs.slides[int(folie) - 1]; sh = next((x for x in s.shapes if x.shape_id == int(shape_id)), None)
    if sh is None: raise SystemExit('Bildrahmen nicht gefunden')
    sicher(pptx, folie, sh); sh._element.getparent().remove(sh._element); prs.save(pptx); print('ok')

def setzen(pptx, folie, shape_id, bild):
    prs = Presentation(pptx); s = prs.slides[int(folie) - 1]
    sh = next((x for x in s.shapes if x.shape_id == int(shape_id)), None)
    if sh is None: raise SystemExit('Bildrahmen nicht gefunden')
    sicher(pptx, folie, sh)
    with open(bild, 'rb') as f:
        _, rid = s.part.get_or_add_image_part(f)
    blip = sh._element.find('.//' + qn('a:blip')); blip.set(qn('r:embed'), rid)
    src = sh._element.find('.//' + qn('a:srcRect'))  # alter Zuschnitt weg: das neue Bild ist schon passend zugeschnitten
    if src is not None: src.getparent().remove(src)
    prs.save(pptx); print('ok')

if __name__ == '__main__':
    if sys.argv[1] == 'list': liste(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == 'reset': zurueck(sys.argv[2], sys.argv[3], sys.argv[4])
    elif sys.argv[1] == 'del': entfernen(sys.argv[2], sys.argv[3], sys.argv[4])
    else: setzen(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
