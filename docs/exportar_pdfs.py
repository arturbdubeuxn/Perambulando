"""Exporta as sete fontes Markdown para PDF. Requer ReportLab.

Uso: python exportar_pdfs.py [01-controllers ...]
Sem argumentos, exporta todos os documentos numerados.
"""
from pathlib import Path
import re
import sys
from html import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether,
)

ROOT = Path(__file__).resolve().parent
WIDTH = A4[0] - 36 * mm
INK = colors.HexColor('#173b35')
GRAY = colors.HexColor('#52605e')
# Embed available Windows fonts so the PDF does not depend on viewer substitutions.
for font_name, font_file in [('Helvetica', 'arial.ttf'), ('Helvetica-Bold', 'arialbd.ttf'),
                             ('Courier', 'consola.ttf')]:
    font_path = Path('C:/Windows/Fonts') / font_file
    if font_path.exists():
        pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle('DocTitle', fontName='Helvetica-Bold', fontSize=23,
                          leading=28, textColor=INK, spaceAfter=16))
styles.add(ParagraphStyle('SectionTitle', fontName='Helvetica-Bold', fontSize=14,
                          leading=18, textColor=INK, spaceBefore=16,
                          spaceAfter=8, keepWithNext=True))
styles.add(ParagraphStyle('EndpointTitle', fontName='Helvetica-Bold', fontSize=11,
                          leading=15, textColor=INK, spaceBefore=12,
                          spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle('DocBody', fontName='Helvetica', fontSize=9.4,
                          leading=14, textColor=colors.HexColor('#263330'),
                          spaceAfter=7, splitLongWords=True))
styles.add(ParagraphStyle('BulletBody', parent=styles['DocBody'], leftIndent=11,
                          firstLineIndent=-8, spaceAfter=5))
styles.add(ParagraphStyle('CellBody', fontName='Helvetica', fontSize=8,
                          leading=11, textColor=colors.HexColor('#263330'),
                          splitLongWords=True))
styles.add(ParagraphStyle('CellHead', parent=styles['CellBody'],
                          fontName='Helvetica-Bold', textColor=colors.white))
styles.add(ParagraphStyle('CodeBody', fontName='Courier', fontSize=7.8,
                          leading=10.7, textColor=INK, spaceAfter=0,
                          splitLongWords=True, leftIndent=0))


def normalize(value):
    return value.translate(str.maketrans({'—': '-', '–': '-', '‑': '-',
                                        '→': '->', '←': '<-', '\u00a0': ' '}))


def inline(value):
    value = normalize(value)
    # Preserve readable labels and destinations, including in the PDF.
    value = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1 (\2)', value)
    value = escape(value)
    value = re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', value)
    value = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', value)
    return value


def table_flow(rows):
    count = len(rows[0])
    if rows[0] == ['Controller', 'Método', 'Caminho', 'Acesso']:
        fractions = [.13, .085, .46, .325]
    elif count == 2:
        fractions = [.35, .65]
    elif count == 3:
        fractions = [.29, .29, .42]
    elif count == 4:
        fractions = [.24, .21, .23, .32]
    else:
        fractions = [1 / count] * count
    cells = [[Paragraph(inline(cell), styles['CellHead' if row_index == 0 else 'CellBody'])
              for cell in row] for row_index, row in enumerate(rows)]
    table = Table(cells, colWidths=[WIDTH * x for x in fractions],
                  repeatRows=1, hAlign='LEFT', rowSplitRange=(3, -2) if len(rows) > 4 else None)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), INK),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1),
         [colors.HexColor('#f0f5f3'), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, 0), .5, INK),
        ('LINEBELOW', (0, 1), (-1, -1), .25, colors.HexColor('#dce5e0')),
    ]))
    return [KeepTogether([table]) if len(rows) <= 4 else table, Spacer(1, 9)]


def parse(source):
    lines = source.splitlines()
    flows = []
    index = 0
    while index < len(lines):
        line = lines[index].strip()
        if not line:
            index += 1
            continue
        if line.startswith('```'):
            block = []
            index += 1
            while index < len(lines) and not lines[index].startswith('```'):
                content = normalize(lines[index]).replace(' ', '\u00a0')
                block.append(Paragraph(escape(content) or ' ', styles['CodeBody']))
                index += 1
            if block:
                box = Table([[block]], colWidths=[WIDTH])
                box.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#edf3f1')),
                    ('BOX', (0, 0), (-1, -1), .4, colors.HexColor('#cfdfd8')),
                    ('TOPPADDING', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
                    ('LEFTPADDING', (0, 0), (-1, -1), 10),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ]))
                flows.extend([box, Spacer(1, 10)])
            index += 1
            continue
        if line.startswith('|'):
            rows = []
            while index < len(lines) and lines[index].strip().startswith('|'):
                cells = [cell.strip() for cell in lines[index].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', cell) for cell in cells):
                    rows.append(cells)
                index += 1
            table_parts = table_flow(rows)
            if (len(rows) <= 4 and len(flows) >= 2
                    and isinstance(flows[-2], Paragraph)
                    and flows[-2].style.name in ('SectionTitle', 'EndpointTitle')
                    and isinstance(flows[-1], Paragraph)):
                introduction = flows[-2:]
                del flows[-2:]
                flows.append(KeepTogether(introduction + table_parts))
            else:
                flows.extend(table_parts)
            continue
        match = re.match(r'^(#{1,3}) (.+)$', line)
        if match:
            style = {'#': 'DocTitle', '##': 'SectionTitle', '###': 'EndpointTitle'}[match[1]]
            flows.append(Paragraph(inline(match[2]), styles[style]))
        elif line.startswith('- '):
            flows.append(Paragraph('- ' + inline(line[2:]), styles['BulletBody']))
        else:
            flows.append(Paragraph(inline(line), styles['DocBody']))
        index += 1
    return flows


def export(path):
    output = ROOT / 'pdf' / (path.stem + '.pdf')
    output.parent.mkdir(exist_ok=True)
    title = normalize(path.read_text(encoding='utf-8-sig').splitlines()[0].lstrip('# '))
    date_match = re.search(r'\b\d{2}/\d{2}/\d{4}\b', path.read_text(encoding='utf-8-sig'))
    updated_at = date_match.group(0) if date_match else 'Data não informada'

    def decorate(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor('#d6e2dc'))
        canvas.line(18 * mm, A4[1] - 16 * mm, A4[0] - 18 * mm, A4[1] - 16 * mm)
        canvas.setFillColor(GRAY)
        canvas.setFont('Helvetica', 8)
        canvas.drawString(18 * mm, A4[1] - 12 * mm, 'PERAMBULANDO / DOCUMENTAÇÃO TÉCNICA')
        canvas.drawString(18 * mm, 12 * mm, f'{updated_at} | Documentação do código')
        canvas.drawRightString(A4[0] - 18 * mm, 12 * mm, f'{document.page}')
        canvas.restoreState()

    pdf = SimpleDocTemplate(str(output), pagesize=A4, rightMargin=18 * mm,
                            leftMargin=18 * mm, topMargin=23 * mm,
                            bottomMargin=23 * mm, title=title,
                            author='Perambulando', subject='Documentação técnica do sistema')
    pdf.build(parse(path.read_text(encoding='utf-8-sig')), onFirstPage=decorate, onLaterPages=decorate)
    print(output)


if __name__ == '__main__':
    requested = set(sys.argv[1:])
    for source_path in sorted(ROOT.glob('[0-9][0-9]-*.md')):
        if not requested or source_path.stem in requested:
            export(source_path)
