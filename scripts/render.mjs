import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFile(path.join(root, name), 'utf8');
const source = JSON.parse(await read('content/profile.json'));
const papers = JSON.parse(await read('content/publications.json'));
const chinese = JSON.parse(await read('content/zh.json'));
const published = papers.filter(p => p.status === 'Published');
const reviewing = papers.filter(p => p.status === 'Under review');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsonData = value => JSON.stringify(value).replace(/</g, '\\u003c');
const merge = (base, translated) => {
  if (translated === undefined) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(translated) || base.length !== translated.length) throw new Error('Translation array differs from source content');
    return base.map((value, i) => merge(value, translated[i]));
  }
  if (base && typeof base === 'object') return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, merge(value, translated[key])]));
  return translated;
};
let siteBase = '';
if (source.siteUrl) {
  const url = new URL(source.siteUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('siteUrl must be a public HTTPS base URL.');
  siteBase = url.href.replace(/\/*$/, '/');
}
const publicUrl = (file, locale = 'en') => new URL((locale === 'zh' ? 'zh/' : '') + (file === 'index.html' ? '' : source.prettyUrls ? file.replace(/\.html$/, '') : file), siteBase).href;
const arrow = '<svg class="arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const iconNames = {'Google Scholar':'googlescholar', ORCID:'orcid', ResearchGate:'researchgate'};
const icons = {};
for (const [label, file] of Object.entries(iconNames)) icons[label] = (await read(`assets/${file}.svg`)).replace(/<title>.*?<\/title>/, '').replace('role="img"', `class="brand-icon ${file}" aria-hidden="true" focusable="false" fill="currentColor"`);
const bib = p => `@article{${p.id},\n  author = {${p.authors.join(' and ')}},\n  title = {${p.title.replace(/[{}]/g,'')}},\n  journal = {${p.journal}},\n  year = {${p.year}},${p.volume?`\n  volume = {${p.volume}},`:''}${p.number?`\n  number = {${p.number}},`:''}${p.pages?`\n  pages = {${p.pages.replace('–','--')}},`:''}${p.article?`\n  eid = {${p.article}},`:''}\n  doi = {${p.doi}},\n  url = {https://doi.org/${p.doi}}\n}`;
const pageNames = ['index.html','publications.html','experience.html','teaching.html','awards.html','cv.html'];
const pages = new Map();

for (const locale of ['en', 'zh']) {
  const zh = locale === 'zh';
  const profile = zh ? merge(source, chinese.profile) : source;
  const asset = file => `${zh ? '../' : ''}${file}`;
  const t = value => {
    if (!zh) return value;
    if (!(value in chinese.ui)) throw new Error(`Missing Chinese UI translation: ${value}`);
    return chinese.ui[value];
  };
  const u = value => esc(t(value));
  const bilingual = (original, translation) => `${zh ? '<span lang="en">' : ''}${esc(original)}${zh ? `</span><span class="translated-title" lang="zh-Hans">（${esc(translation)}）</span>` : ''}`;
  const paperTitle = p => bilingual(p.title, chinese.papers[p.id]?.title);
  const dateLabel = new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-US', {month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(profile.updated+'T00:00:00Z'));
  const supervisor = name => `${zh ? '导师：' : 'Supervisor: '}${name === profile.phdSupervisor ? `<a href="${esc(profile.phdSupervisorUrl)}" target="_blank" rel="noopener noreferrer">${esc(name)}<span class="sr-only"> ${u('(opens in a new tab)')}</span></a>` : esc(name)}`;
  const rankLabel = rank => rank ? ` <span class="qs-rank" title="${zh ? 'QS排名沿用原始简历标注' : 'QS rank as listed in the CV'}">(QS #${rank})</span>` : '';
  const institution = item => item.rankedInstitutions
    ? item.rankedInstitutions.map(school => `<strong class="institution-name">${esc(school.name)}</strong>${rankLabel(school.qsRank)}`).join(zh ? '；' : '; ')
    : `<strong class="institution-name">${esc(item.institution)}</strong>${rankLabel(item.qsRank)}`;
  const external = (label, url) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${u(label)}${arrow}<span class="sr-only"> ${u('(opens in a new tab)')}</span></a>`;
  const links = () => profile.links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${icons[l.label]}<span>${esc(l.label)}</span>${arrow}<span class="sr-only"> ${u('(opens in a new tab)')}</span></a>`).join('');
  const navItems = [['publications.html','Publications'],['experience.html','Academic experience'],['teaching.html','Teaching & social service'],['awards.html','Awards & honours'],['cv.html','Full CV']];
  const header = active => `<header class="site-header wrap"><a class="wordmark" href="index.html"${active==='index.html'?' aria-current="page"':''}>${esc(zh ? profile.nameChinese : profile.name)}</a><nav aria-label="${u('Main navigation')}">${navItems.map(([url,label])=>`<a href="${url}"${active===url?' aria-current="page"':''}>${u(label)}</a>`).join('')}<a class="language-switch" href="${zh ? '../' : 'zh/'}${active}" lang="${zh ? 'en' : 'zh-Hans'}" hreflang="${zh ? 'en' : 'zh-Hans'}" aria-label="${zh ? 'Switch to English' : '切换到简体中文'}">${zh ? 'English' : '中文'}</a></nav></header>`;
  const head = (title, description, filename) => `<!doctype html>
<html lang="${zh ? 'zh-Hans' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${u(title)}</title><meta name="description" content="${u(description)}"><meta name="theme-color" content="#ffffff">
<meta name="robots" content="${siteBase?'index,follow':'noindex,nofollow'}"><meta property="og:title" content="${u(title)}"><meta property="og:description" content="${u(description)}"><meta property="og:type" content="profile"><meta property="og:site_name" content="${esc(zh ? profile.nameChinese : profile.name)}"><meta property="og:locale" content="${zh ? 'zh_CN' : 'en_US'}">
${siteBase?`<link rel="canonical" href="${esc(publicUrl(filename, locale))}"><link rel="alternate" hreflang="en" href="${esc(publicUrl(filename))}"><link rel="alternate" hreflang="zh-Hans" href="${esc(publicUrl(filename,'zh'))}"><link rel="alternate" hreflang="x-default" href="${esc(publicUrl(filename))}"><meta property="og:url" content="${esc(publicUrl(filename, locale))}"><meta property="og:image" content="${esc(new URL(profile.portrait.src,siteBase).href)}">`:''}
<link rel="icon" href="${asset('assets/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${asset('assets/site.css')}"><script src="${asset('assets/site.js')}" defer></script>
<script type="application/ld+json">${jsonData({'@context':'https://schema.org','@type':'Person',name:zh ? profile.nameChinese : profile.name,alternateName:zh ? profile.name : profile.nameChinese,jobTitle:profile.title,affiliation:{'@type':'CollegeOrUniversity',name:profile.institution},alumniOf:profile.education.filter(e=>!e.expected).map(e=>({'@type':'CollegeOrUniversity',name:e.institution})),sameAs:profile.links.map(l=>l.url),...(siteBase?{url:publicUrl('index.html',locale),image:new URL(profile.portrait.src,siteBase).href}:{})})}</script></head><body><a class="skip-link" href="#main">${u('Skip to content')}</a>${header(filename)}`;
  const footer = () => `<footer class="site-footer wrap"><span>© ${profile.updated.slice(0,4)} ${esc(zh ? profile.nameChinese : profile.name)}</span><span>${u('Updated')} <time datetime="${profile.updated}">${dateLabel}</time></span></footer></body></html>`;
  const pageTitle = (title, description, action='') => `<div class="page-heading"><div><h1>${u(title)}</h1>${description?`<p>${u(description)}</p>`:''}</div>${action}</div>`;
  const sectionTitle = (title, url, label) => `<div class="section-heading"><h2>${u(title)}</h2>${url?`<a class="section-more" href="${url}">${u(label)}${arrow}</a>`:''}</div>`;
  const education = detailed => profile.education.map(e=>`<div class="education-item"><p class="date">${esc(detailed?e.detailDates:e.dates)}${!detailed&&e.expected?`<br><span class="expected">${u('(expected)')}</span>`:''}</p><div><h3>${esc(e.degree)}</h3><p>${institution(e)}</p>${detailed?`<p class="muted">${esc(e.detail)}</p>`:''}${e.expected&&profile.phdSupervisor?`<p class="supervisor">${supervisor(profile.phdSupervisor)}</p>`:''}</div></div>`).join('');
  const authorList = p => p.authors.map((a,i)=>`${i===0?'':i===p.authors.length-1?', &amp; ':', '}${a==='Pang, W.'?`<strong>${esc(a)}</strong>`:esc(a)}`).join('');
  const venue = p => `${esc(p.journal)}${p.volume?`, ${esc(p.volume)}${p.number?`(${esc(p.number)})`:''}`:''}${p.pages?`, ${esc(p.pages)}`:''}${p.article?`, ${esc(p.article)}`:''}`;
  const paperRow = p => `<article class="publication" id="${p.id}"><p class="date">${p.year}</p><div><h3><a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener noreferrer">${paperTitle(p)}<span class="sr-only"> ${u('(opens in a new tab)')}</span></a></h3><p class="authors">${authorList(p)}</p><p class="venue"><i>${venue(p)}</i>${p.details?` <span class="muted">· ${u(p.details)}</span>`:''}</p><p class="paper-summary">${esc(zh ? chinese.papers[p.id].summary : p.summary)}</p><div class="paper-links">${external('Paper',`https://doi.org/${p.doi}`)}<button class="text-button js-only" type="button" data-cite="${p.id}" aria-label="${u('Cite')} ${esc(p.title)}">${u('Cite')}</button></div></div></article>`;
  const manuscripts = () => `<section class="under-review" id="under-review"><h2>${u('Under review')}</h2><p class="muted">${u('Manuscripts currently under peer review.')}</p><ol class="manuscripts">${reviewing.map(p=>`<li><h3>${paperTitle(p)}</h3><p class="authors">${authorList(p)}${p.role==='Corresponding author'?` <span class="role-note">${u('· Corresponding author')}</span>`:''}</p></li>`).join('')}</ol></section>`;
  const citeDialog = `<dialog id="citation-dialog" aria-labelledby="citation-title"><div class="dialog-heading"><h2 id="citation-title">${u('Cite this paper')}</h2><button type="button" class="close-button" id="close-citation" aria-label="${u('Close citation')}">${u('Close')}</button></div><p id="citation-paper"></p><label for="citation-text">BibTeX</label><textarea id="citation-text" readonly spellcheck="false"></textarea><div class="dialog-actions"><button type="button" class="button" id="copy-citation">${u('Copy BibTeX')}</button><a href="${asset('publications.bib')}" download>${u('Download all citations')}</a></div><p class="status" id="copy-status" role="status"></p></dialog><script type="application/json" id="citation-data">${jsonData(Object.fromEntries(published.map(p=>[p.id,{title:p.title,bib:bib(p)}])))}</script>`;
  const genericRows = items => items.map(i=>`<article class="cv-entry"><p class="date">${esc(i.dates||i.year)}</p><div><h3>${esc(i.title)}</h3><p>${institution(i)}</p>${i.role?`<p>${esc(i.role)}</p>`:''}${i.supervisor?`<p>${supervisor(i.supervisor)}</p>`:''}${i.funding?`<p class="muted">${zh ? '资助：' : 'Funded by '}${esc(i.funding)}</p>`:''}${i.detail?`<p class="entry-detail">${esc(i.detail)}</p>`:''}${i.details?`<ul>${i.details.map(d=>`<li>${esc(d)}</li>`).join('')}</ul>`:''}</div></article>`).join('');
  const experienceSummary = () => profile.experience.map(e=>`<article class="experience-row"><p class="date">${esc(e.dates)}</p><div><h3>${institution(e)}</h3><p>${esc(e.role)}</p><p>${esc(e.description)}</p></div></article>`).join('');
  const conferenceRows = (items,full=false) => items.map(({c,i})=>`<article class="conference-row"><p class="date">${c.year}</p><div><h3>${bilingual(source.conferences[i].event,chinese.profile.conferences[i].event)}</h3><p class="conference-title">${bilingual(source.conferences[i].title,chinese.profile.conferences[i].title)}</p>${full?`<p class="authors">${esc(c.authors)}</p>`:''}<p class="conference-meta">${esc(c.format)} · ${esc(c.location)}${full?`<br>${esc(c.dates)}`:''}</p></div></article>`).join('');
  const presented = profile.conferences.map((c,i)=>({c,i})).filter(({c})=>c.status==='Presented');
  const submitted = profile.conferences.map((c,i)=>({c,i})).filter(({c})=>c.status==='Under review');
  const conferenceSection = () => `<section id="conferences" class="cv-section"><h2>${u('Conference presentations')}</h2>${conferenceRows(presented,true)}<h3 class="subheading">${u('Conference submission · Under review')}</h3>${conferenceRows(submitted,true)}</section>`;
  const teachingSection = () => `<section id="teaching" class="cv-section"><h2>${u('Teaching & academic service')}</h2>${genericRows(profile.teaching)}<h3 class="subheading">${u('Invited journal peer review · 2023–present')}</h3><ul class="review-journals">${profile.reviewing.map(j=>`<li>${esc(j)}</li>`).join('')}</ul></section>`;
  const leadershipSection = () => `<section id="leadership" class="cv-section"><h2>${u('Professional experience & leadership')}</h2>${genericRows(profile.leadership)}</section>`;
  const researchSections = () => `<section id="research-experience" class="cv-section"><h2>${u('Research experience')}</h2>${genericRows(profile.projects)}</section><section id="visits" class="cv-section"><h2>${u('Visiting study & academic programmes')}</h2>${genericRows(profile.academicVisits)}</section>`;
  const contact = `<section class="get-in-touch section"><h2>${u('Get in touch')}</h2><a href="mailto:${profile.email}">${profile.email}</a><a href="cv.html">${u('Full CV')}${arrow}</a></section>`;
  const metrics = profile.researchMetrics;
  const checkedDate = new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(metrics.citationsChecked+'T00:00:00Z'));
  const researchOutput = `<section class="research-output" aria-labelledby="output-title"><h2 id="output-title">${zh ? '研究成果' : 'Research output'}</h2><div class="output-stats"><a class="output-stat" href="publications.html"><strong>${published.length}</strong><span>${zh ? '已发表论文' : 'Journal articles'}</span></a><a class="output-stat" href="experience.html#conferences"><strong>${presented.length}</strong><span>${zh ? '会议报告' : 'Conference presentations'}</span></a><a class="output-stat" href="${esc(metrics.citationSource)}" target="_blank" rel="noopener noreferrer"><strong>${metrics.citations}</strong><span>${zh ? 'Google Scholar 引用' : 'Google Scholar citations'}</span><span class="sr-only"> ${u('(opens in a new tab)')}</span></a></div><p class="output-note">${zh ? '引用数据截至' : 'Citations checked'} <time datetime="${metrics.citationsChecked}">${checkedDate}</time></p></section>`;
  const add = (file, html) => pages.set((zh ? 'zh/' : '') + file, html);

  add('index.html', `${head('Wanru Pang | Applied Linguistics', 'Wanru Pang (庞琬茹), PhD candidate at The Hong Kong Polytechnic University. Research on identity, motivation and multilingual literacy development.', 'index.html')}
<main id="main" class="wrap"><section class="intro" aria-labelledby="name"><div class="biography"><h1 id="name">${esc(zh ? profile.nameChinese : profile.name)}<span class="chinese-name" lang="${zh ? 'en' : 'zh-Hans'}">${esc(zh ? profile.name : profile.nameChinese)}</span></h1><p class="position">${esc(profile.title)}<br>${esc(profile.institution)}</p>${profile.phdSupervisor?`<p class="supervisor">${supervisor(profile.phdSupervisor)}</p>`:''}<p class="education-intro">${esc(profile.educationIntro)}</p><p class="research-bio">${esc(profile.bio)}</p><div class="profile-links">${links()}</div>${researchOutput}</div><aside class="contact-aside"><img class="portrait" src="${asset(profile.portrait.src)}" alt="${esc(zh ? profile.nameChinese : profile.name)}" width="${profile.portrait.width}" height="${profile.portrait.height}" fetchpriority="high"><div><h2 data-visit-until="${profile.visit.endDate}">${u('Currently')}</h2><p>${esc(profile.visit.role)}<br>${institution(profile.visit)}<br>${esc(profile.visit.dates)}<br>${zh ? '合作导师：' : 'With '}${esc(profile.visit.supervisor)}</p></div><div><h2>${u('Contact')}</h2><a class="email" href="mailto:${profile.email}">${profile.email}</a></div></aside></section>
<div class="education-research section"><section id="education" aria-labelledby="education-title"><h2 id="education-title">${u('Education')}</h2>${education(false)}<p class="rank-note">${zh ? 'QS排名沿用原始简历标注。' : 'QS ranks as listed in the CV.'}</p></section><section id="research" aria-labelledby="research-title"><h2 id="research-title">${u('Research interests')}</h2><div class="research-list">${profile.research.map(r=>`<article><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p></article>`).join('')}</div></section></div>
<section id="publications" class="section">${sectionTitle('Selected publications','publications.html','Full publications')}<div class="publication-list">${published.filter(p=>p.selected).map(paperRow).join('')}</div></section>
<section id="experience" class="section">${sectionTitle('Academic experience','experience.html','View all experience')}<div class="experience-list">${experienceSummary()}</div></section>
<section id="conferences" class="section">${sectionTitle('Conference presentations','experience.html#conferences','All presentations')}<div class="conference-list">${conferenceRows(presented.filter(({c})=>c.authors.startsWith('Pang, W.')))}</div></section>${contact}</main>${citeDialog}${footer()}`);
  add('publications.html', `${head('Publications | Wanru Pang','Journal publications and manuscripts under review by Wanru Pang, with DOI links and downloadable citations.','publications.html')}<main id="main" class="wrap detail-page">${pageTitle('Publications','Peer-reviewed research on language, learning, and assessment.',`<a href="${asset('publications.bib')}" download>${u('Download BibTeX')}${arrow}</a>`)}<section aria-labelledby="published-title"><h2 class="subheading" id="published-title">${u('Peer-reviewed publications')}</h2><div class="publication-list">${published.map(paperRow).join('')}</div></section>${manuscripts()}</main>${citeDialog}${footer()}`);
  add('experience.html', `${head('Academic experience | Wanru Pang','Wanru Pang’s research projects, academic visits, exchange programmes, and conference presentations.','experience.html')}<main id="main" class="wrap detail-page">${pageTitle('Academic experience','Research projects, academic visits, and conference presentations.')}<nav class="page-nav" aria-label="${u('Experience sections')}"><a href="#research-experience">${u('Research')}</a><a href="#visits">${u('Visits & programmes')}</a><a href="#conferences">${u('Conferences')}</a></nav>${researchSections()}${conferenceSection()}</main>${footer()}`);
  add('teaching.html', `${head('Teaching & social service | Wanru Pang','Teaching, journal peer review, professional experience, and leadership by Wanru Pang.','teaching.html')}<main id="main" class="wrap detail-page">${pageTitle('Teaching & social service','Teaching, academic service, and contributions to research and university life.')}${teachingSection()}${leadershipSection()}</main>${footer()}`);
  add('awards.html', `${head('Awards & honours | Wanru Pang','Scholarships, research support, and academic awards received by Wanru Pang.','awards.html')}<main id="main" class="wrap detail-page">${pageTitle('Awards & honours','Scholarships, research support, and academic recognition.')}<section class="awards-list" aria-label="${u('Awards')}">${genericRows(profile.awards)}</section></main>${footer()}`);
  add('cv.html', `${head('Curriculum vitae | Wanru Pang','Academic curriculum vitae of Wanru Pang: education, research, publications, conferences, teaching, service, and honours.','cv.html')}<main id="main" class="wrap detail-page cv-page">${pageTitle('Curriculum vitae','')}<p class="cv-name">${esc(zh ? profile.nameChinese : profile.name)} · ${esc(zh ? profile.name : profile.nameChinese)}</p><p>${esc(profile.title)}<br>${esc(profile.department)}<br>${esc(profile.institution)}${profile.phdSupervisor?`<br>${supervisor(profile.phdSupervisor)}`:''}<br><a href="mailto:${profile.email}">${profile.email}</a></p><div class="profile-links">${links()}</div><nav class="page-nav" aria-label="${u('CV sections')}">${[['education','Education'],['research-experience','Research'],['cv-publications','Publications'],['conferences','Conferences'],['teaching','Teaching & service'],['awards','Awards'],['methods','Methods']].map(([id,label])=>`<a href="#${id}">${u(label)}</a>`).join('')}</nav>
<section id="education" class="cv-section"><h2>${u('Education')}</h2>${education(true)}<p class="dissertation"><strong>${u('Doctoral dissertation')}</strong><br>${bilingual(source.dissertation,chinese.profile.dissertation)}</p></section>${researchSections()}<section id="cv-publications" class="cv-section"><h2>${u('Peer-reviewed publications')}</h2>${published.map(paperRow).join('')}${manuscripts()}</section>${conferenceSection()}${teachingSection()}${leadershipSection()}<section id="awards" class="cv-section"><h2>${u('Awards & honours')}</h2>${genericRows(profile.awards)}</section><section id="methods" class="cv-section"><h2>${u('Methods & languages')}</h2>${profile.methods.map(m=>`<div class="method"><h3>${esc(m.title)}</h3><p>${esc(m.detail)}</p></div>`).join('')}</section><p class="cv-end">${u('Updated')} <time datetime="${profile.updated}">${dateLabel}</time></p></main>${citeDialog}${footer()}`);
}

pages.set('.nojekyll','');
pages.set('publications.bib',published.map(bib).join('\n\n')+'\n');
pages.set('robots.txt',siteBase?`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml',siteBase).href}\n`:'User-agent: *\nDisallow: /\n');
pages.set('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${siteBase?['en','zh'].flatMap(locale=>pageNames.map(file=>`<url><loc>${esc(publicUrl(file,locale))}</loc><lastmod>${source.updated}</lastmod>${[['en','en'],['zh-Hans','zh'],['x-default','en']].map(([lang,code])=>`<xhtml:link rel="alternate" hreflang="${lang}" href="${esc(publicUrl(file,code))}"/>`).join('')}</url>`)).join(''):''}</urlset>\n`);
for (const [filename,content] of pages) for (const folder of ['', 'dist']) {
  const target=path.join(root,folder,filename);
  await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,content,'utf8');
}
await mkdir(path.join(root,'dist/assets'), {recursive:true});
for (const file of ['site.css','site.js','favicon.svg','wanru-pang-aera.jpg','googlescholar.svg','orcid.svg','researchgate.svg']) await copyFile(path.join(root,'assets',file),path.join(root,'dist/assets',file));
// Never publish a stale CV download left by an earlier build.
for (const file of ['assets/Wanru-Pang-CV.pdf','assets/wanru-pang.jpg','dist/assets/Wanru-Pang-CV.pdf','dist/assets/wanru-pang.jpg','dist/_headers']) await rm(path.join(root,file),{force:true});
console.log(`Built 12 English/Chinese pages, ${published.length} published papers and ${reviewing.length} under-review manuscripts. ${siteBase || 'Preview: indexing disabled.'}`);
