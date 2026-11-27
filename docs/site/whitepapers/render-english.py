#!/usr/bin/env python3
"""Typeset the reviewed English whitepaper HTML with ReportLab and lxml.

Use the public Markdown as input to VitePress's Markdown renderer first.
This script changes layout only. It does not translate or edit source content.
"""
import argparse
import re
from html import escape
from pathlib import Path

import reportlab
from lxml import html
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph,
    Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

TITLE = 'Agent-Era Enterprise Information Security Governance Whitepaper'
PUBLISHER = 'Shenzhen Finogeeks Technology Co., Ltd.'
BLUE = colors.HexColor('#1d5fff')
NAVY = colors.HexColor('#142f58')
PALE = colors.HexColor('#eff5ff')
WIDTH, HEIGHT = A4
MARGIN = 45
BODY_WIDTH = WIDTH - MARGIN * 2


def rich(node):
    """Retain emphasis and source links without copying site UI into the PDF."""
    result = escape(node.text or '')
    for child in node:
        text = rich(child)
        if child.tag in ('strong', 'b'):
            result += '<b>' + text + '</b>'
        elif child.tag in ('em', 'i'):
            result += '<i>' + text + '</i>'
        elif child.tag == 'a' and child.get('href', '').startswith(('https://', 'http://')):
            result += '<link href="' + escape(child.get('href'), quote=True) + '" color="#216957">' + text + '</link>'
        elif child.tag == 'a' and 'header-anchor' in child.get('class', ''):
            pass
        elif child.tag == 'br':
            result += '<br/>'
        else:
            result += text
        result += escape(child.tail or '')
    # Vera supports Latin punctuation. Use textual arrows for diagram connections.
    return result.replace('→', ' -&gt; ').replace('←', ' &lt;- ').replace('↓', ' down to ')


def make_styles():
    fonts = Path(reportlab.__file__).parent / 'fonts'
    for name, file in [('Body', 'Vera.ttf'), ('Body-Bold', 'VeraBd.ttf'),
                       ('Body-Italic', 'VeraIt.ttf'), ('Body-BoldItalic', 'VeraBI.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(fonts / file)))
    pdfmetrics.registerFontFamily('Body', normal='Body', bold='Body-Bold', italic='Body-Italic', boldItalic='Body-BoldItalic')
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle('Text', fontName='Body', fontSize=9.5, leading=14.5,
                              textColor=NAVY, spaceAfter=8, allowWidows=0, allowOrphans=0))
    styles.add(ParagraphStyle('Chapter', parent=styles['Text'], fontName='Body-Bold',
                              fontSize=18, leading=24, spaceAfter=16, keepWithNext=True))
    styles.add(ParagraphStyle('Section', parent=styles['Text'], fontName='Body-Bold',
                              fontSize=14, leading=19, spaceBefore=5, spaceAfter=12, keepWithNext=True))
    styles.add(ParagraphStyle('Subsection', parent=styles['Text'], fontName='Body-Bold',
                              fontSize=10, leading=15, spaceBefore=6, keepWithNext=True))
    styles.add(ParagraphStyle('Quote', parent=styles['Text'], leftIndent=12, rightIndent=12,
                              borderColor=BLUE, borderWidth=0.5, borderPadding=8, spaceBefore=4))
    styles.add(ParagraphStyle('Cell', parent=styles['Text'], fontSize=8, leading=11, spaceAfter=0))
    styles.add(ParagraphStyle('Small', parent=styles['Text'], fontSize=8, leading=12, textColor=colors.HexColor('#526987')))
    styles.add(ParagraphStyle('SourcePage', parent=styles['Small'], keepWithNext=True))
    return styles


class Whitepaper(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if (isinstance(flowable, Paragraph) and flowable.style.name == 'Chapter'
                and flowable.getPlainText() not in ('Copyright and Notices', 'Contents', 'References')):
            key = 'chapter-' + re.sub(r'[^a-z0-9]+', '-', flowable.getPlainText().lower()).strip('-')
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.getPlainText(), key, 0)
            self.notify('TOCEntry', (0, flowable.getPlainText(), self.page, key))


def page_header(canvas, doc):
    if doc.page == 1:
        return
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.setFont('Body-Bold', 8)
    canvas.drawString(MARGIN, HEIGHT - 28, 'Finogeeks | Enterprise AI Security Governance')
    canvas.setStrokeColor(colors.HexColor('#dce6f2'))
    canvas.line(MARGIN, HEIGHT - 35, WIDTH - MARGIN, HEIGHT - 35)
    canvas.setFont('Body', 7)
    canvas.setFillColor(colors.HexColor('#526987'))
    canvas.drawString(MARGIN, 24, '© 2026 Finogeeks. All rights reserved. | English translation | 2026-11')
    canvas.drawRightString(WIDTH - MARGIN, 24, str(doc.page))
    canvas.restoreState()


def cover(canvas, doc):
    if doc.page != 1:
        return
    canvas.saveState()
    canvas.setFillColor(PALE)
    canvas.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.setFont('Body-Bold', 18)
    canvas.drawString(MARGIN, HEIGHT - 70, 'Finogeeks')
    canvas.setFont('Body', 14)
    canvas.drawRightString(WIDTH - MARGIN, HEIGHT - 70, '2026')
    # A vector cover keeps the English edition free of rasterized body text.
    canvas.setFillColor(BLUE)
    canvas.rect(0, 0, WIDTH, 210, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    y = HEIGHT - 185
    for line in ['Agent-Era', 'Enterprise Information', 'Security Governance', 'Whitepaper']:
        canvas.setFont('Body-Bold', 29 if line != 'Agent-Era' else 36)
        canvas.drawString(MARGIN, y, line)
        y -= 48
    canvas.setFont('Body', 12)
    for line in ['Risk identification · Layered governance · Trusted execution',
                 'FinShield product architecture and security testing practice']:
        canvas.drawString(MARGIN, y - 12, line)
        y -= 24
    canvas.setFont('Body', 9)
    canvas.drawString(MARGIN, y - 24, 'English translation of the November 2026 Chinese original.')
    canvas.drawString(MARGIN, y - 40, 'Layout and pagination are adapted for English; consult the Chinese original if they differ.')
    canvas.setFillColor(colors.white)
    canvas.setFont('Body-Bold', 10)
    canvas.drawString(MARGIN, 90, PUBLISHER)
    canvas.setFont('Body', 9)
    canvas.drawString(MARGIN, 68, 'November 2026 | finogeeks.com')
    canvas.setFont('Body', 8)
    canvas.drawString(MARGIN, 46, '© 2026 Shenzhen Finogeeks Technology Co., Ltd. All rights reserved.')
    canvas.restoreState()


def render(source, output):
    styles = make_styles()
    document = html.fromstring('<div>' + source.read_text() + '</div>')
    story = [Spacer(1, 1), PageBreak()]
    started = False
    for node in document:
        plain = node.text_content().replace('\u200b', '').strip() if isinstance(node.tag, str) else ''
        if node.tag == 'h2' and plain == 'Copyright and Notices':
            started = True
        if not started or not isinstance(node.tag, str):
            continue
        text = rich(node).strip()
        if node.tag == 'h2':
            if len(story) > 2 and not isinstance(story[-1], PageBreak):
                story.append(PageBreak())
            story.append(Paragraph(text, styles['Chapter']))
            if plain == 'Contents':
                toc = TableOfContents()
                toc.levelStyles = [ParagraphStyle('TOC', parent=styles['Text'], fontSize=10,
                                                   leading=16, spaceBefore=8, rightIndent=18)]
                story.append(toc)
        elif node.tag in ('h3', 'h4'):
            story.append(Paragraph(text, styles['Section' if node.tag == 'h3' else 'Subsection']))
        elif node.tag == 'p' and text:
            if plain.startswith(('Sources:', 'Source:')) and isinstance(story[-1], Paragraph):
                story[-1].keepWithNext = True
            style = styles['SourcePage'] if plain.startswith('Chinese original:') else styles['Text']
            story.append(Paragraph(text, style))
        elif node.tag == 'blockquote':
            for paragraph in node.xpath('./p'):
                story.append(Paragraph(rich(paragraph), styles['Quote']))
        elif node.tag in ('ul', 'ol'):
            for index, item in enumerate(node.xpath('./li'), 1):
                prefix = str(index) + '. ' if node.tag == 'ol' else '• '
                story.append(Paragraph(prefix + rich(item), styles['Text']))
        elif node.tag == 'table':
            rows = [[Paragraph(rich(cell), styles['Cell']) for cell in row]
                    for row in node.xpath('./thead/tr | ./tbody/tr | ./tr')]
            if not rows:
                continue
            table = Table(rows, colWidths=[BODY_WIDTH / len(rows[0])] * len(rows[0]), repeatRows=1, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), PALE),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOX', (0, 0), (-1, -1), .4, colors.HexColor('#dce6f2')),
                ('INNERGRID', (0, 0), (-1, -1), .3, colors.HexColor('#dce6f2')),
                ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
                ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ]))
            story += [table, Spacer(1, 10)]
        elif node.tag == 'pre':
            raise ValueError('Render diagram code as translated text or a table before typesetting')
    if not started:
        raise ValueError('Missing Copyright and Notices: refusing an empty PDF')
    doc = Whitepaper(str(output), pagesize=A4, title=TITLE, author=PUBLISHER,
                    subject='English translation of the November 2026 Chinese whitepaper',
                    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=52, bottomMargin=45)
    frame = Frame(MARGIN, 45, BODY_WIDTH, HEIGHT - 97, id='body', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id='publication', frames=frame,
                                     onPage=lambda canvas, document: (cover(canvas, document), page_header(canvas, document))))
    output.parent.mkdir(parents=True, exist_ok=True)
    doc.multiBuild(story)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('html', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    render(args.html, args.output)
