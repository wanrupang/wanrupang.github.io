# Wanru Pang — Academic website

A portable, responsive academic website with six English pages, six corresponding Simplified Chinese pages, and a downloadable full CV. The public pages contain no GitHub links, trackers, remote fonts, or runtime API keys.

## Pages

- `index.html`: biography, education and research interests in parallel columns, four selected papers, academic experience, and three first-author conference presentations.
- `publications.html`: all nine published papers and two manuscripts under review. Both the header and the homepage's Full publications link open this page.
- `experience.html`: all research projects, visits and academic programmes, five conference presentations, and the AERA 2027 submission labelled Under review.
- `teaching.html`: teaching, journal reviewing, professional experience and leadership.
- `awards.html`: awards and honours.
- `cv.html`: complete web CV, with a real PDF download at `assets/Wanru-Pang-CV.pdf`.

## Preview and build

Run `npm run build` and `npm start`. The server prints `http://127.0.0.1:4173` and binds only to this computer. Run `npm run check` to check all twelve pages, language switches, original publication/conference titles, assets, cross-page anchors and PDF freshness. Node.js 20+ is sufficient; the website has no npm dependencies.

Each page has a Chinese/English switch linking to its matching page. The Chinese pages are under `zh/`; the switch also preserves section anchors when JavaScript is available. All content and navigation render without JavaScript. Chinese pages retain English paper and conference titles, followed by Chinese translations in parentheses. Author lists, journal names, DOIs and BibTeX remain in their original form. The downloadable CV is the English PDF and is labelled accordingly on Chinese pages.

## Maintain content

Edit `content/profile.json` for the biography, education, supervisor, projects, conferences, service, awards and methods. Edit `content/publications.json` for papers. Maintain corresponding Simplified Chinese translations in `content/zh.json`: profile arrays follow the English array order, while papers are keyed by their stable IDs. `scripts/render.mjs` generates both languages from shared templates. Preserve author order and keep Under review manuscripts separate from published papers. The PhD supervisor, Prof. Xinhua Zhu, was explicitly confirmed by the owner on 7 November 2026.

After changing either content file, regenerate the PDF with Python and ReportLab, then rebuild and check:

```sh
python scripts/build-pdf.py
npm run build
npm run check
```

The PDF builder uses Windows Arial, Georgia and SimSun fonts and writes `output/pdf/Wanru-Pang-CV.pdf`, then copies it into the website assets. Its metadata carries a content fingerprint; checks reject a PDF that no longer matches the content files. A prebuilt PDF is committed so the hosting service needs only Node.js. For PDF generation on other operating systems, configure equivalent installed fonts in `scripts/build-pdf.py`.

Commit source, generated root HTML, `sitemap.xml`, citations and the PDF together. GitHub Pages publishes the generated files from the repository root. The original DOCX, private analysis and local QA outputs are outside the published repository. `dist/` is a portable website-only build for future hosting changes.

## Hosting and search

Source repository: https://github.com/wanrupang/wanrupang.github.io. The website is configured for https://wanrupang.github.io/ and its Chinese version for https://wanrupang.github.io/zh/. The owner authorized renaming the new account `wrpang` to `wanrupang`; its GitHub account ID remains 218595212. The repository was created by importing the complete source history. In repository Settings → Pages, select Deploy from a branch, choose `main` and `/(root)`, then save. After setup, pushes to `main` automatically publish the generated website. `.nojekyll` keeps the plain HTML, CSS, JavaScript and PDF files unchanged.

The publishing route uses GitHub Pages only; the previous Sites configuration is unused. Relative asset and navigation links work at the new account's domain root. `siteUrl` enables canonical URLs, Open Graph URLs, Person structured data, reciprocal language alternatives and a twelve-page sitemap. Setting it to an empty string disables indexing for private previews. The root `robots.txt` allows crawling and points to the sitemap.

This is an independent copy of `benmenglyu/pangwanru`, prepared from source commit `3078ef24ed067a99a11a98b2ccbc5f76442b0c63`. The `benmenglyu` account and its existing websites must remain unchanged. Do not transfer or rename the source repository. If the new account uses a different username, update `siteUrl`, regenerate the PDF, rebuild all pages, and check them before publishing.

GitHub source hosting does not determine the public address. A `.site` registration is a separate paid product; it is not supplied free by GitHub Pages or Cloudflare Pages. No domain was purchased. An owned custom domain can be attached later.

Google crawling/indexing is not guaranteed or instantaneous. After deployment, submit the verified sitemap through the owner's Google Search Console property when access is available; add the homepage URL to relevant academic profiles when the owner requests those changes.

## Assets and validation

The portrait is the owner's unretouched Google Scholar photo. Platform marks come from Simple Icons v16; see `assets/ASSET-SOURCES.txt`. The image-generation concepts guide layout only; real author order, contact details and education always come from the curated CV data. The complete confirmed PhD education and supervisor supersede any abbreviated concept text.

The bilingual revision was checked in Chrome: all twelve pages rendered at a measured 341 CSS-pixel mobile viewport without horizontal overflow; desktop homepages were visually reviewed at 1339 and 2314 CSS pixels. Matching-page language navigation, Chinese citation copy/close, header navigation and PDF download were exercised with no console errors. Static checks cover every local link, section anchor, locale alternative, all original paper/conference titles and the PDF content fingerprint. The seven-page PDF was previously rendered and visually reviewed. White background, forest-green accents, serif headings, portrait, platform marks and section order are preserved.
