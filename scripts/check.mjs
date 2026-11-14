import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=async p=>readFile(path.join(root,p),'utf8');
const papers=JSON.parse(await read('content/publications.json'));
assert.equal(new Set(papers.map(p=>p.id)).size,papers.length,'Paper IDs must be unique');
for (const p of papers) {
  assert(p.authors.includes('Pang, W.'),'Every listed work must include the profile owner');
  if(p.status==='Under review') assert(!p.year&&!p.doi&&!p.journal&&!p.indexing&&!p.jcrQuartile,'Under-review work must not carry published metadata or journal ranking labels');
  else {
    assert(/^10\.\d{4,9}\/.+/.test(p.doi)&&p.year&&p.journal,'Published papers need complete identification');
    assert(['SSCI','ESCI'].includes(p.indexing),'Published papers need CV-backed indexing labels');
    assert(p.indexing==='ESCI'?!p.jcrQuartile:['Q1','Q2'].includes(p.jcrQuartile),'Only show the quartiles specified in the CV');
  }
}
const pageNames=['index.html','publications.html','experience.html','teaching.html','awards.html','cv.html'];
const chinese=JSON.parse(await read('content/zh.json'));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const filename of [...pageNames,...pageNames.map(name=>'zh/'+name)]) {
  const html=await read(`dist/${filename}`);
  assert.equal(await read(filename),html,'Published HTML must match the build output; edit content data instead of generated pages');
  const chinesePage=filename.startsWith('zh/');
  const counterpart=chinesePage?'../'+path.basename(filename):'zh/'+filename;
  assert(html.includes(`lang="${chinesePage?'zh-Hans':'en'}"`),'Correct page language');
  assert(html.includes(`class="language-switch" href="${counterpart}"`),'Language switch must reach the same page');
  assert(!html.includes('undefined'),'No missing translation values');
  assert(!/Wanru-Pang-CV\.pdf|Download CV \(PDF\)|下载完整简历（英文 PDF）/.test(html),'No public CV download links or descriptions');
  assert(html.includes('hreflang="en"')&&html.includes('hreflang="zh-Hans"'),'Search engines need both locale alternatives');
  assert(!/github/i.test(html.split('</head>')[1]),'Visible pages must not contain GitHub branding or repository links');
  assert(!/<a\b[^>]*href=["']https?:\/\/(?:www\.)?github\.com(?:\/|["'])/i.test(html),'Public website must not link to the source repository');
  // Reject phone-sized numeric strings; retain only identifiers from the published DOI list.
  const bibliographyNumbers = new Set(papers.flatMap(p => [...(p.doi || '').matchAll(/\d{8,}/g)].map(match => match[0])));
  assert([...html.matchAll(/\d{8,}/g)].every(match => bibliographyNumbers.has(match[0])), 'Unapproved phone-sized number in the public website');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'HTML IDs must be unique');
  for(const match of html.matchAll(/(?:href|src)="([^"?#]+)(?:[?#][^"]*)?"/g)) {
    if(/^(?:https?:|mailto:|data:)/.test(match[1])) continue;
    await readFile(path.join(root,'dist',path.dirname(filename),match[1]));
  }
  for(const match of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(match[1]),`Missing anchor: ${match[1]}`);
  for(const match of html.matchAll(/href="([^":]+\.html)#([^"]+)"/g)) {
    const target=await read(path.join('dist',path.dirname(filename),match[1]));
    assert(target.includes(`id="${match[2]}"`),`Missing cross-page anchor: ${match[0]}`);
  }
  assert(html.includes('href="publications.html"'),'All pages must expose full publications');
}
const home=await read('dist/index.html');
assert.equal((home.match(/class="publication"/g)||[]).length,4,'Home features four papers');
assert.equal(((await read('dist/publications.html')).match(/class="publication"/g)||[]).length,9,'Full publication page includes all published works');
assert(home.includes('class="education-research section"')&&home.includes('class="portrait"'),'Home needs the requested two-column section and portrait');
assert.equal((home.match(/class="brand-icon /g)||[]).length,3,'All scholarly profile links need their platform mark');
for(const folder of ['assets','dist/assets']) assert(!(await readdir(path.join(root,folder))).some(file=>/\.pdf$/i.test(file)),'CV PDF must be absent from both public asset folders');
const profile=JSON.parse(await read('content/profile.json'));
if(profile.siteUrl){
  assert((await read('dist/robots.txt')).includes('Allow: /'),'Live website must allow crawling');
  const sitemap=await read('dist/sitemap.xml');
  assert.equal((sitemap.match(/<url>/g)||[]).length,12,'Sitemap must cover all twelve English/Chinese pages');
  assert(!home.includes('noindex'),'Live home must be indexable');
}
assert(!(await readdir(path.join(root,'dist'))).some(p=>/docx|analysis|review|content/i.test(p)),'Publish output must contain only the public website');
const chinesePapers=await read('dist/zh/publications.html');
assert.equal((chinesePapers.match(/class="publication"/g)||[]).length,9);
for(const paper of papers){
  assert(chinese.papers[paper.id]?.title,`Missing translation for ${paper.id}`);
  assert(chinesePapers.includes(escape(paper.title)),`English title must be preserved: ${paper.id}`);
  assert(chinesePapers.includes('（'+escape(chinese.papers[paper.id].title)+'）'),`Chinese title must be included: ${paper.id}`);
}
const chineseExperience=await read('dist/zh/experience.html');
for(const [i,conference] of profile.conferences.entries()){
  assert(!Object.hasOwn(chinese.profile.conferences[i],'status'),'Conference status must be shared by both languages');
  assert(!Object.hasOwn(chinese.profile.conferences[i],'originalTitle'),'Original conference titles must come from the shared source');
  assert(chineseExperience.includes(escape(conference.title)),'Original conference titles must be preserved');
  assert(chineseExperience.includes('（'+escape(chinese.profile.conferences[i].title)+'）'),'Conference translations must be present');
}
// Dates and award qualifiers are facts, even when their surrounding text is translated.
const months={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
for(const [i,education] of profile.education.entries()){
  const en=education.detailDates.match(/^(\w+) (\d{4}) – (\w+) (\d{4})/);
  const zh=chinese.profile.education[i].detailDates.match(/^(\d{4})年(\d+)月—(\d{4})年(\d+)月/);
  assert(en&&zh,'Education dates must include start and end months');
  assert.deepEqual([+en[2],months[en[1]],+en[4],months[en[3]]],zh.slice(1).map(Number),'Education dates must match across languages');
}
for(const [i,award] of profile.awards.entries()){
  const zh=chinese.profile.awards[i];
  assert.deepEqual(award.title.match(/\d+(?:%|‰)/g)||[],zh.title.match(/\d+(?:%|‰)/g)||[],'Award qualifiers must agree');
  assert.deepEqual(award.year.match(/\d{4}/g),(zh.year||award.year).match(/\d{4}/g),'Award years and scholarship periods must agree');
}
assert.equal(papers.filter(p=>p.status==='Published').length,9);
assert.equal(papers.filter(p=>p.status==='Under review').length,2);
assert.equal(profile.conferences.filter(c=>c.status==='Presented').length,5);
assert.equal(profile.conferences.filter(c=>c.status==='Accepted').length,1);
assert.equal(profile.conferences.find(c=>c.year===2027)?.status,'Accepted','The owner-confirmed AERA 2027 status must be current');
for(const prefix of ['', 'zh/']){
  const html=await read('dist/'+prefix+'index.html');
  assert(!html.includes('I study how identity, motivation, and language interact')&&!html.includes('我关注身份认同、学习动机与语言如何共同影响'),'Requested opening sentence must be removed in both languages');
  assert(html.includes('assets/wanru-pang-aera.jpg'),'New conference portrait must be used');
  assert(html.includes('https://www.polyu.edu.hk/lst/people/academic-staff/zhu-xinhua/'),'Supervisor must link to the supplied faculty page');
  assert(html.includes('class="institution-name"'),'University names must be bold');
  assert(html.includes('QS #50')&&html.includes('QS #10')&&html.includes('QS #45'),'Education and academic experience must show CV-provided QS ranks');
  const stats=html.match(/<section class="research-output"[\s\S]*?<\/section>/)?.[0]||'';
  assert(stats.includes('<strong>9</strong>')&&stats.includes('<strong>5</strong>')&&stats.includes('<strong>102</strong>'),'Output counts are 9 published papers, 5 presented conference items, 102 verified citations');
  assert.equal(profile.researchMetrics.citationsChecked,'2026-11-08','Keep the citation verification date in source data');
  const biography=html.match(/<div class="biography">[\s\S]*?<\/section><\/div>/)?.[0]||'';
  const sidebar=html.match(/<aside class="contact-aside">[\s\S]*?<\/aside>/)?.[0]||'';
  assert(!biography.includes('class="brand-icon '),'Profile logos must move out of the biography');
  assert.equal((sidebar.match(/class="brand-icon /g)||[]).length,3,'All three platform links belong below Contact');
  assert(sidebar.indexOf('class="email"')<sidebar.indexOf('class="profile-links contact-links"'),'Profile links must follow the email');
  for(const page of ['index.html','publications.html']){
    const content=await read('dist/'+prefix+page);
    assert(!/output-note|rank-note|Citations checked|引用数据截至|QS ranks as listed in the CV|QS排名沿用原始简历标注/.test(content),'Remove both visible provenance notes');
    assert(!/href="[^" ]*publications\.bib"|\bdownload(?:[ >])/.test(content),'Do not offer BibTeX downloads');
    const output=content.match(/<section class="research-output"[\s\S]*?<\/section>/)?.[0]||'';
    for(const count of [9,5,102]) assert(output.includes(`<strong>${count}</strong>`),'Both pages need matching research totals');
  }
  const publicationPage=await read('dist/'+prefix+'publications.html');
  assert(publicationPage.includes('class="publication-metrics"'),'Publication totals need their heading-side position');
  const cv=await read('dist/'+prefix+'cv.html');
  const localizedProfile=prefix?chinese.profile:profile;
  assert(html.includes(escape(localizedProfile.bio)),'Homepage biography must come from the corresponding content data');
  assert(!/GPA|Top (?:5|10)%|前(?:5|10)%/.test(cv),'Do not restore the removed education GPA or class ranks');
  assert(!cv.includes('张欣叶'),'Do not restore the superseded Chinese author spelling');
  for(const page of ['index.html','publications.html','cv.html']){
    const content=await read('dist/'+prefix+page);
    for(const paper of papers.filter(p=>p.status==='Published'&&(page!=='index.html'||p.selected))){
      const article=content.match(new RegExp('<article[^>]*id="'+paper.id+'"[^>]*>[\\s\\S]*?</article>'))?.[0]||'';
      const names=prefix?chinese.papers[paper.id].authors:paper.authors;
      for(const name of names)assert(article.includes(escape(name)),`Keep author names synchronized in ${prefix+page}: ${paper.id}`);
      const label=paper.indexing+(paper.jcrQuartile?' · '+paper.jcrQuartile:'');
      assert(article.includes(`>${escape(label)}</span>`),`Indexing badge must match shared paper data: ${prefix+page}/${paper.id}`);
      assert(article.indexOf('class="publication-meta"')<article.indexOf('class="paper-links"')&&article.indexOf('class="paper-links"')<article.indexOf('class="paper-summary"'),'Paper/Cite must be in the journal metadata row above the summary');
    }
  }
  for(const [personIndex, sourcePerson] of profile.peopleLinks.entries()){
    const person={...sourcePerson,name:prefix ? chinese.profile.peopleLinks[personIndex].name : sourcePerson.name};
    assert(cv.includes(`class="person-link" href="${escape(person.url)}"`),`Official profile must be linked in CV: ${person.name}`);
    // Every visible mention, including combined supervisor labels, gets its own link.
    const visible=cv.split('<main')[1].split('</main>')[0];
    const allMentions=visible.split(escape(person.name)).length-1;
    const linkedMentions=visible.split(`>${escape(person.name)}<span class="sr-only">`).length-1;
    assert.equal(linkedMentions,allMentions,`All visible mentions must be linked: ${person.name}`);
  }
  const experience=await read('dist/'+prefix+'experience.html');
  const observation=localizedProfile.projects[0].details[2];
  for(const content of [experience,cv])assert(content.includes(escape(observation)),'UBC classroom-observation wording must match the content data in both detail pages');
  for(const rank of [45,4,13,47,119]) assert(experience.includes(`QS #${rank}`),'Academic visit ranks must match the source CV');
  const acceptedHeading=prefix?'会议报告 · 已接收':'Conference presentation · Accepted';
  const outdatedHeading=prefix?'会议投稿 · 审核中':'Conference submission · Under review';
  for(const content of [experience,cv]){
    assert(content.includes(acceptedHeading),'Accepted AERA 2027 poster must appear in experience and Full CV in both languages');
    assert(!content.includes(outdatedHeading),'Remove the superseded conference review status');
    const conferences=content.match(/<section id="conferences"[\s\S]*?<\/section>/)?.[0]||'';
    assert.equal((conferences.split(acceptedHeading)[0].match(/class="conference-row"/g)||[]).length,5,'Keep five completed presentations separate from accepted work');
    assert.equal((conferences.split(acceptedHeading)[1].match(/class="conference-row"/g)||[]).length,1,'Keep one accepted upcoming presentation');
  }
  const teaching=await read('dist/'+prefix+'teaching.html');
  for(const content of [teaching,cv]){
    assert(content.includes(prefix?'超过25名':'over 25 research assistants'),'Research team size must use the latest CV in both places');
    assert(!content.includes('over 20 research assistants'),'Do not retain the old team size');
  }
  const awards=await read('dist/'+prefix+'awards.html');
  for(const content of [awards,cv]){
    assert(content.includes(prefix?'博士研究生全额奖学金':'Full PhD Scholarship'),'Full scholarship name must be current');
    assert(content.includes(prefix?'2023年—2027年':'2023–2027'),'Full scholarship period must be current');
    assert(!content.includes('Third-class Scholarship'),'Do not retain the superseded award class');
  }
}
console.log('PASS: 12 bilingual pages; matched education dates, award periods/qualifiers, team size and accepted conference status; 9 published papers, 2 under-review manuscripts and 5 completed presentations; links, original titles, language switches, privacy and download exclusions.');
