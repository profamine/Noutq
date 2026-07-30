"""Convert a generated Noutq DOCX to self-contained print HTML.

This is a deterministic fallback for environments where Microsoft Word can
paginate a DOCX but its fixed-format exporter is unavailable or hangs.
"""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

from docx import Document
from docx.document import Document as DocumentType
from docx.oxml.ns import qn
from docx.table import Table, _Cell
from docx.text.paragraph import Paragraph


ARABIC_RE = re.compile(r"[\u0600-\u06ff]")


def iter_blocks(parent: DocumentType | _Cell):
    parent_element = parent.element.body if isinstance(parent, DocumentType) else parent._tc
    for child in parent_element.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, parent)
        elif child.tag == qn("w:tbl"):
            yield Table(child, parent)


def escape_text(value: str) -> str:
    return html.escape(value).replace("\n", "<br>")


def run_html(run) -> str:
    text = escape_text(run.text)
    if not text:
        return ""
    styles: list[str] = []
    if run.font.size:
        styles.append(f"font-size:{run.font.size.pt:.2f}pt")
    if run.font.color and run.font.color.rgb:
        styles.append(f"color:#{run.font.color.rgb}")
    if run.bold:
        styles.append("font-weight:700")
    if run.italic:
        styles.append("font-style:italic")
    if run.underline:
        styles.append("text-decoration:underline")
    direction = "rtl" if ARABIC_RE.search(run.text) else "ltr"
    return f'<span dir="{direction}" style="{";".join(styles)}">{text}</span>'


def paragraph_html(paragraph: Paragraph, *, in_cell: bool = False) -> str:
    page_break = any(
        br.get(qn("w:type")) == "page"
        for br in paragraph._p.findall(".//w:br", paragraph._p.nsmap)
    )
    content = "".join(run_html(run) for run in paragraph.runs)
    if not content:
        content = "&#160;" if in_cell else ""

    style_name = (paragraph.style.name if paragraph.style else "Normal").lower()
    if style_name == "title":
        tag, class_name = "h1", "title"
    elif style_name == "subtitle":
        tag, class_name = "p", "subtitle"
    elif style_name.startswith("heading 1"):
        tag, class_name = "h1", "heading-1"
    elif style_name.startswith("heading 2"):
        tag, class_name = "h2", "heading-2"
    elif style_name.startswith("heading 3"):
        tag, class_name = "h3", "heading-3"
    else:
        tag, class_name = "p", "body"
    if tag == "h1" and re.search(r"\b(?:C\d{2}|E01|G\d{2}|R01|X0[12])\b", paragraph.text):
        class_name += " unit-heading"

    alignment = paragraph.alignment
    align_css = {0: "left", 1: "center", 2: "right", 3: "justify"}.get(
        int(alignment) if alignment is not None else -1,
        "right" if ARABIC_RE.search(paragraph.text) else "left",
    )
    bidi = paragraph._p.pPr is not None and paragraph._p.pPr.find(qn("w:bidi")) is not None
    direction = "rtl" if bidi or ARABIC_RE.search(paragraph.text) else "ltr"
    rendered = (
        f'<{tag} class="{class_name}" dir="{direction}" '
        f'style="text-align:{align_css}">{content}</{tag}>'
    )
    return (f'<div class="page-break"></div>{rendered}' if page_break and content else
            '<div class="page-break"></div>' if page_break else rendered)


def cell_shading(cell: _Cell) -> str | None:
    shd = cell._tc.find(".//w:shd", cell._tc.nsmap)
    if shd is None:
        return None
    fill = shd.get(qn("w:fill"))
    return fill if fill and fill not in {"auto", "FFFFFF"} else None


def table_html(table: Table) -> str:
    rows: list[str] = []
    for row_index, row in enumerate(table.rows):
        cells: list[str] = []
        seen: set[int] = set()
        for cell in row.cells:
            marker = id(cell._tc)
            if marker in seen:
                continue
            seen.add(marker)
            grid_span = cell._tc.tcPr.find(qn("w:gridSpan")) if cell._tc.tcPr is not None else None
            colspan = int(grid_span.get(qn("w:val"))) if grid_span is not None else 1
            tag = "th" if row_index == 0 else "td"
            attrs = f' colspan="{colspan}"' if colspan > 1 else ""
            fill = cell_shading(cell)
            style = f' style="background:#{fill}"' if fill else ""
            content = "".join(
                paragraph_html(block, in_cell=True)
                if isinstance(block, Paragraph)
                else table_html(block)
                for block in iter_blocks(cell)
            )
            cells.append(f"<{tag}{attrs}{style}>{content}</{tag}>")
        rows.append(f"<tr>{''.join(cells)}</tr>")
    if not rows:
        return "<table></table>"
    return f"<table><thead>{rows[0]}</thead><tbody>{''.join(rows[1:])}</tbody></table>"


def build_html(docx_path: Path) -> str:
    document = Document(docx_path)
    blocks = list(iter_blocks(document))
    rendered: list[str] = []
    index = 0
    while index < len(blocks):
        block = blocks[index]
        is_heading = (
            isinstance(block, Paragraph)
            and (block.style.name if block.style else "").lower().startswith("heading ")
        )
        if is_heading:
            lead: list[str] = []
            while index < len(blocks) and isinstance(blocks[index], Paragraph):
                lead.append(paragraph_html(blocks[index]))
                index += 1
            rendered.append(f'<section class="heading-lead">{"".join(lead)}</section>')
            continue
        rendered.append(paragraph_html(block) if isinstance(block, Paragraph) else table_html(block))
        index += 1
    body = "".join(rendered)
    return f"""<!doctype html>
<html lang="ar">
<head>
<meta charset="utf-8">
<title>Noutq V5-RC2</title>
<style>
  @page {{ size: A4; margin: 15mm 13mm 18mm; }}
  * {{ box-sizing: border-box; }}
  html {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{ margin: 0; color: #17251f; font-family: Arial, "Noto Sans Armenian",
          "Noto Naskh Arabic", sans-serif; font-size: 9.5pt; line-height: 1.35; }}
  p {{ margin: 0 0 3pt; orphans: 2; widows: 2; }}
  [dir="rtl"] {{ line-height: 1.55; }}
  h1, h2, h3 {{ color: #176b4d; break-after: avoid; page-break-after: avoid;
                margin: 8pt 0 4pt; line-height: 1.3; }}
  h1.title {{ font-size: 26pt; text-align: center !important; margin-top: 24mm; }}
  h1.heading-1 {{ font-size: 16pt; }}
  .heading-lead {{ break-inside: avoid; page-break-inside: avoid;
                   break-after: avoid-page; page-break-after: avoid; }}
  .heading-lead + table {{ break-before: avoid-page; page-break-before: avoid; }}
  h2.heading-2 {{ font-size: 12pt; }}
  h3.heading-3 {{ font-size: 10.5pt; }}
  p.subtitle {{ color: #176b4d; font-size: 13pt; text-align: center !important; }}
  table {{ width: 100%; border-collapse: collapse; table-layout: fixed;
           margin: 3pt 0 7pt; break-inside: auto; }}
  tr {{ break-inside: avoid; page-break-inside: avoid; }}
  th, td {{ border: 0.6pt solid #b8c9c1; padding: 4pt 6pt; vertical-align: top;
            overflow-wrap: anywhere; }}
  th {{ background: #176b4d; color: white; font-weight: 700; }}
  td p, th p {{ margin: 0 0 2pt; }}
  .page-break {{ break-before: page; page-break-before: always; height: 0; }}
</style>
</head>
<body>{body}</body>
</html>
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(build_html(args.input), encoding="utf-8")
    print(f"Generated {args.output}")


if __name__ == "__main__":
    main()
