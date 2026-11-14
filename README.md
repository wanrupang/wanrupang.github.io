# Wanru Pang — Bilingual academic website

Live website: https://wanrupang.github.io/
Chinese website: https://wanrupang.github.io/zh/
Source repository: https://github.com/wanrupang/wanrupang.github.io

Six static English pages and six Simplified Chinese counterparts, with a matching-page language switch. The public pages have no repository links, trackers, runtime API keys or remote fonts.

## Pages and content

- Home: biography and supervisor link, AERA conference photograph, compact research totals, scholarly profile logos and links below Contact, education and research interests in two columns, selected publications, academic experience and conference presentations.
- Publications: compact research totals beside the page title, nine published papers and two manuscripts under review; compact journal metadata with Paper/Cite actions aligned on the right and source-backed indexing badges; DOI links and a copy-only original English BibTeX citation dialog. No BibTeX download links are shown.
- Academic experience: research projects, visits, five completed conference presentations and one separately labelled accepted AERA 2027 poster presentation.
- Teaching and social service: teaching, academic reviewing, professional experience and leadership.
- Awards and honours: scholarships, research support and recognition.
- Full CV: readable web CV. The public site no longer offers a CV PDF or a CV download link.

Chinese paper, dissertation and conference titles preserve the original English wording, followed by a Chinese translation in parentheses. Author order, journal names and DOIs remain unchanged.

## Build and maintain

Node.js 20+ is sufficient; no npm dependencies are required.

```sh
npm run build
npm run check
npm start
```

The preview server binds only to 127.0.0.1:4173. Set PORT if another local port is needed. GitHub Pages publishes committed root files from main; dist/ is an ignored portable build.

Edit content/profile.json for biography, education, projects, visits, teaching and awards; content/publications.json for papers; content/zh.json for corresponding Chinese text. Translated profile arrays must follow source order. Translated papers use stable IDs. scripts/render.mjs generates both languages.

Factual corrections in both languages were reconciled with the owner-reviewed Simplified Chinese CV, CV-PANG Wanru-full-261106-简体中文版-v2.docx, on 2026-11-08. Apply fact changes to the English source and the matching Chinese text together, including the online Full CV generated from the same records. Conference status and original English titles belong only in profile.json; Chinese overrides translate the presentation text and inherit its status. Preserve the distinction between nine published papers, two manuscripts under review, five completed conference presentations and one accepted upcoming poster.

On 2026-11-14, the owner’s 2026-11-11 page edits were incorporated into the content data and synchronized across languages: the revised research biography, UBC English-reading classroom observations, removal of both MA and BA GPA/rank details, and the Chinese author name 张欣烨. These owner-approved updates supersede the corresponding details in the earlier Word CV. Edit the content JSON files and rebuild; do not edit generated HTML alone.

The homepage and Publications page share the same research totals. Publication and conference counts derive from Published and Presented records only. Under-review manuscripts and upcoming accepted conference presentations are excluded. Google Scholar citations are a dated snapshot in profile.researchMetrics: 102 citations, checked on 2026-11-08. Update the count and date together after verifying the linked public profile. Keep this date in source data; the public statistics show no verification footnote.

QS labels reproduce the original CV (CV-PANG Wanru-full-261106.docx): PolyU 50, NUS 10, UBC 45, Oxford 4, Peking 13, Zhejiang 47 and Leiden 119. The CV does not specify the ranking edition. Public pages show the numeric ranks without a source footnote. Universities without a CV-provided rank are left without a fabricated rank.

Verified official teacher profile URLs live in profile.peopleLinks. The shared renderer links exact names in supervisor labels and in project, visit and teaching descriptions in both languages.

The AERA photo is the owner's supplied original, displayed with CSS cropping of the blue side margins. Image provenance and platform logo sources are in assets/ASSET-SOURCES.txt.

## CV downloads

No CV PDF may be published in assets/ or dist/assets/. The build removes the former PDF and checks reject PDF files in either public asset folder. PDF files are gitignored. The optional scripts/build-pdf.py utility creates a private local copy in ignored output/pdf/ only; it does not copy a PDF to either public folder. Original Word documents and local backups are outside this repository.

Removing a file from the current published tree does not erase earlier Git commits or independent old-site copies. Do not rewrite history or modify the benmenglyu account/source repository as part of normal maintenance.

## Hosting and search

The owner authorized changing the new account wrpang to wanrupang; its account ID remains 218595212. This repository preserves the complete history imported from benmenglyu/pangwanru. The source account and website remain unchanged.

GitHub Pages is configured to publish main at /(root) with HTTPS. The old .openai hosting configuration is unused. Set profile.siteUrl when moving to another public URL. Canonical URLs, reciprocal language alternatives, structured data, robots.txt and a twelve-page sitemap are generated automatically. Search-engine indexing is not instantaneous or guaranteed.

## Validation

npm run check verifies all twelve pages and local links, original paper/conference titles, language switches, source-backed QS labels, research totals and absence of public CV downloads. For visual changes, inspect English and Chinese homepages at desktop and mobile widths, test the language switch and relevant navigation, and check browser console errors. Keep screenshots and diagnostic files outside the repository.

## Publication indexing labels

Published-paper indexing and JCR quartiles are stored in content/publications.json as indexing and jcrQuartile. They reproduce the owner’s Chinese CV (CV-PANG Wanru-full-261106-简体中文版-v2.docx): six SSCI Q1 papers, two SSCI Q2 papers and one ESCI paper with no stated quartile. The CV does not specify the JCR edition. These labels are not a claim about current-year rankings. Do not assign a quartile to the ESCI paper or indexing labels to conference presentations without a source. The shared paper renderer displays the same labels on English/Chinese home, publication and Full CV pages. Paper/Cite actions share the journal metadata row on desktop and wrap below it on narrow screens.

### Institution and CV layout

School-based entries use `institutionFirst` in `content/profile.json`; QS ranks are shared across both languages and displayed using the same pale-green badge treatment as journal indexing. Ranks retain the original CV values, including repeated PolyU and NUS entries. Academic experience shows visits, research projects, then conferences. Full CV follows personal information (including existing methods/languages), education, Publication, academic experience, teaching/social service, and awards/honours. Edit the shared renderer rather than individual generated pages.
