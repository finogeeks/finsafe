#!/usr/bin/env python3
"""Translate text on the original PDF geometry; retain every original graphic.

Install pymupdf==2.2, fonttools and pypdf. The reviewed English strings and
placement rectangles are in english-layout.json. This script does not translate.
"""
import argparse
import hashlib
import html
import io
import json
import re
import string
import tempfile
from pathlib import Path

import pymupdf as fitz
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable
from pypdf import PdfReader

TITLE = 'Agent-Era Enterprise Information Security Governance Whitepaper'
PUBLISHER = 'Shenzhen Finogeeks Technology Co., Ltd.'
DATA = Path(__file__).with_name('english-layout.json')


def compact(text):
    return re.sub(r'\s+', '', text)


def restore_fonts(source, document, directory):
    """Restore Unicode cmaps from the original embedded fonts, without new art.

    ReportLab stored these subsets in a legacy MacRoman cmap. /ToUnicode gives
    the real code points. Keep original glyph IDs and choose a source subset
    with complete Latin coverage for each weight. Do not redistribute fonts
    separately or substitute different typefaces.
    """
    families, seen = {}, set()
    for page in PdfReader(source).pages:
        for reference in page['/Resources']['/Font'].values():
            xref = reference.idnum
            if xref in seen:
                continue
            seen.add(xref)
            obj = reference.get_object()
            if '/ToUnicode' not in obj:
                continue
            name, extension, _, buffer = document.extract_font(xref)
            if not buffer or extension != 'ttf':
                continue
            font = TTFont(io.BytesIO(buffer))
            encoded = font['cmap'].tables[0].cmap
            mapping = obj['/ToUnicode'].get_object().get_data().decode()
            table = CmapSubtable.newSubtable(4)
            table.platformID, table.platEncID, table.language = 3, 1, 0
            table.cmap = {
                int(unicode, 16): encoded[int(code, 16)]
                for code, unicode in re.findall(r'<([0-9A-Fa-f]{2})>\s*<([0-9A-Fa-f]{4})>', mapping)
                if int(code, 16) in encoded
            }
            font['cmap'].tables = [table]
            path = directory / f'{xref}.ttf'
            font.save(path)
            face = fitz.Font(fontfile=str(path))
            if not all(face.has_glyph(ord(c)) for c in string.ascii_letters + string.digits + ' .,;:/()-[]&'):
                continue
            family = re.sub(r'^[A-Z]{6}\+', '', name)
            if family not in families or len(buffer) > families[family]['bytes']:
                families[family] = {'path': path, 'bytes': len(buffer), 'face': face}
    return families


def artwork(page):
    keys = ['items', 'fill', 'color', 'width', 'dashes', 'lineCap', 'lineJoin',
            'closePath', 'fill_opacity', 'stroke_opacity', 'rect']
    return [{key: drawing.get(key) for key in keys} for drawing in page.get_drawings()]


def images(page):
    keys = ['bbox', 'transform', 'width', 'height', 'digest', 'has-mask']
    return [{key: item.get(key) for key in keys} for item in page.get_image_info(hashes=True)]


def links(page):
    return [{key: value for key, value in item.items() if key not in ['xref', 'id']}
            for item in page.get_links()]


def verify(source, output, data, audit):
    original, translated = fitz.open(source), fitz.open(output)
    if len(original) != len(translated) or len(translated) != len(data['pages']):
        raise ValueError('Page counts differ')
    for index, (before, after, page) in enumerate(zip(original, translated, data['pages']), 1):
        if before.rect != after.rect or artwork(before) != artwork(after) or images(before) != images(after):
            raise ValueError(f'Original artwork changed on page {index}')
        if sorted(map(str, links(before))) != sorted(map(str, links(after))):
            raise ValueError(f'Original link actions changed on page {index}')
        text = compact(after.get_text())
        for unit in page['units']:
            if compact(unit['english']) not in text:
                raise ValueError(f'Missing translated text: page {index}, {unit["id"]}')
        if re.search(r'[\u4e00-\u9fff\ufffd]', text):
            raise ValueError(f'Untranslated text or missing glyph on page {index}')
    if any(re.search(r'[\u4e00-\u9fff]', item[1]) for item in translated.get_toc()):
        raise ValueError('Untranslated outline entry')
    return {'pages': len(translated), 'textUnits': sum(len(p['units']) for p in data['pages']),
            'originalVectorPathsRetained': sum(len(p.get_drawings()) for p in original),
            'originalImagePlacementsRetained': sum(len(p.get_image_info()) for p in original),
            'originalLinkActionsRetained': sum(len(p.get_links()) for p in original),
            'externalSourceLinks': sum(link['kind'] == fitz.LINK_URI for p in original for link in p.get_links()),
            'minimumTextSize': min(item['effectiveSize'] for item in audit)}


def export_assets(output, data, directory):
    # Figure rectangles match the Chinese HTML crops. Figure files contain the
    # translated original art, while HTML keeps accessible text transcriptions.
    directory.mkdir(parents=True, exist_ok=True)
    with fitz.open(output) as document:
        pixmap = document[0].get_pixmap(matrix=fitz.Matrix(1.4, 1.4))
        pixmap.pil_save(str(directory / 'cover.webp'), format='WEBP', quality=90)
        for figure in data['figures']:
            pixmap = document[figure['page'] - 1].get_pixmap(
                matrix=fitz.Matrix(2.5, 2.5), clip=fitz.Rect(figure['crop']))
            pixmap.save(str(directory / figure['file']))


def render(source, output, audit_path=None, assets=None):
    data = json.loads(DATA.read_text())
    if source.resolve() == output.resolve():
        raise ValueError('The supplied Chinese original must not be overwritten')
    if hashlib.sha256(source.read_bytes()).hexdigest() != data['sourceSha256']:
        raise ValueError('Source PDF differs from the reviewed edition')
    original, document = fitz.open(source), fitz.open(source)
    audit = []
    with tempfile.TemporaryDirectory(prefix='finshield-fonts-') as temporary:
        directory = Path(temporary)
        fonts = restore_fonts(str(source), original, directory)
        font_css = '\n'.join('@font-face {font-family: "%s";src: url("%s");}' % (name, info['path'].name)
                             for name, info in fonts.items())
        archive = fitz.Archive(str(directory))
        for specification in data['pages']:
            page = document[specification['page'] - 1]
            changed = [unit for unit in specification['units']
                       if unit['english'] != unit['text'] or unit.get('replace')]
            original_links = links(page)
            for unit in changed:
                page.add_redact_annot(fitz.Rect(unit['bbox']), fill=False, cross_out=False)
            # Transparent text redaction leaves image pixels and vector paths intact.
            page.apply_redactions(images=0, graphics=0, text=0)
            for link in page.get_links():
                page.delete_link(link)
            for link in original_links:
                page.insert_link(link)
            for unit in changed:
                placement = unit['placement']
                family = re.sub(r'^[A-Z]{6}\+', '', unit['font'])
                # PDF span names can truncate the original TrueType family.
                matches = [name for name in fonts if name.startswith(family)]
                if len(matches) != 1:
                    raise ValueError(f'Missing original font family: {family}')
                family = matches[0]
                for character in unit['english']:
                    if not character.isspace() and not any(info['face'].has_glyph(ord(character)) for info in fonts.values()):
                        raise ValueError(f'No original-font glyph for {character!r}')
                fallback = ','.join('"%s"' % name for name in fonts if name != family)
                css = font_css + (' * {margin:0;padding:0;} div {font-family:"%s",%s;'
                                  'font-size:%spt;line-height:1.14;color:#%06x;text-align:%s;}' %
                                  (family, fallback, placement['size'], unit['color'], placement['align']))
                content = '<div>' + html.escape(unit['english']).replace('\n', '<br/>') + '</div>'
                spare, scale = page.insert_htmlbox(fitz.Rect(placement['rect']), content,
                                                   css=css, archive=archive, scale_low=0)
                size = placement['size'] * scale
                if spare < 0 or size < data['minimumTextSize']:
                    raise ValueError(f'Unreadable/overflowing text: page {specification["page"]}, {unit["id"]}, {size:.2f}pt')
                audit.append({'page': specification['page'], 'id': unit['id'],
                              'role': unit['role'], 'effectiveSize': round(size, 2), 'scale': round(scale, 4)})
        lookup = {compact(unit['text']): unit['english'] for page in data['pages'] for unit in page['units']}
        outline = document.get_toc()
        for item in outline:
            item[1] = lookup.get(compact(item[1]), item[1])
        document.set_toc(outline)
        metadata = document.metadata
        metadata.update(title=TITLE, author=PUBLISHER,
                        subject='English translation, November 2026; original figures and 37-page layout retained')
        document.set_metadata(metadata)
        output.parent.mkdir(parents=True, exist_ok=True)
        document.save(output, garbage=4, deflate=True)
    report = verify(source, output, data, audit)
    report.update(sourceSha256=data['sourceSha256'], sha256=hashlib.sha256(output.read_bytes()).hexdigest(),
                  bytes=output.stat().st_size, placements=audit)
    if assets:
        export_assets(output, data, assets)
    if audit_path:
        audit_path.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key != 'placements'}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--audit', type=Path)
    parser.add_argument('--assets-dir', type=Path)
    arguments = parser.parse_args()
    render(arguments.source, arguments.output, arguments.audit, arguments.assets_dir)
