# Noutq V5 document design contract

## Reference

- Reference file: `B:\soft\noutq\Noutq-main\Noutq-main\Noutq-contenu-pedagogique-v5-restructure.docx`
- SHA-256 at distillation: `41118f846cbdaf067075234000da25145c1ea80170d2aa7cac25fbf1d65bf5cc`
- Size: 74,395 bytes
- Sections: 1
- Page patterns inspected: cover, contents, guidance, integration appendix, unit opener, activity table, assessments, glossary.
- The reference is a visual authority only. Its pedagogical text is not a source of truth.

## Page system

- A4 portrait: 8.27 × 11.69 inches.
- Margins: 0.79 inches on all sides.
- One continuous section.
- No first/odd/even-page header variation.
- Footer: document name, learner edition, and page field.
- Usable table width: approximately 6.58 inches.

## Typography and colour

- Arabic: Arial; right-to-left; dark `#1F1F1F`.
- Armenian: Sylfaen; left-to-right; dark grey `#374151`.
- Primary green: `#0F3D2E`; secondary green: `#1F6F54`.
- White text on dark-green section bands.
- Body/activity text must remain at least 9 pt; fully vocalised Arabic should normally be 10 pt or larger.
- Heading roles use explicit Word styles in the regenerated document, unlike the direct-formatting-heavy reference.

## Tables and recurring components

- Explicit DXA widths and cell margins; no autofit.
- Repeating table header rows.
- Rows may expand but may not split across pages.
- Activity columns: stable ID, activity type, Arabic, transliteration, Armenian, audio state.
- Short callouts use a single-cell green-tint table.
- Unit title must stay with its lead paragraph/table.
- A page break may precede a unit or appendix when fewer than three activity rows would remain on the current page.

## Content flow

1. Cover and release metadata.
2. Contents and track separation.
3. Learning and pronunciation guide.
4. Compatibility and audio/QR architecture.
5. Core units C01–C12, with E01 clearly optional.
6. Grammar extension G01–G05.
7. R01 review.
8. X01 Core assessment.
9. X02 Grammar assessment.
10. Glossary: words, then expressions.
11. Release/validation note.

## Source slots

- Curriculum, track maps, pronunciation guide, new activities, review, exams, and migrations: `content/v5/curriculum.json`.
- Glossary: `content/v5/glossary.json`.
- Legacy unit content and stable exercise IDs: `src/data/lessons/u1.ts` … `u22.ts`.
- Audio mapping and missing/fallback state: `public/audio/manifest.v2.json`.
- The DOCX itself is never edited as content source.

## Fidelity gates

- Preserve the bilingual green/white visual identity and A4 geometry.
- Do not reproduce contradictory pronunciation categories or mixed glossary extraction defects from the reference.
- No orphan unit headings, clipped Arabic, split activity rows, sparse two-row pages, or unreadably reduced Arabic.
- V4 files must remain byte-for-byte unchanged.
