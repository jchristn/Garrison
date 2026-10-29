---
name: document-conversion
description: Convert Markdown to Word or PDF with a reference document, and convert Word to PDF, using pandoc and LibreOffice.
---

# Document conversion

- Markdown to Word: `pandoc report.md -o report.docx --reference-doc=assets/report-template/reference.docx`. The reference document carries fonts, sizes, and heading styles; change those in the reference document, not in the Markdown.
- Word to PDF: `soffice --headless --convert-to pdf --outdir out report.docx`.
- Markdown to PDF: convert to Word with the reference document first, then to PDF, so the PDF keeps the Word styling.
- Write results into the conversation file space (`files/`), so the person and other agents can download them.
- Report the result path and anything you could not honor (for example a font size with no reference document) as warnings.
