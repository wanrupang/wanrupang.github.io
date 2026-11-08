import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=async p=>readFile(path.join(root,p),'utf8');
const papers=JSON.parse(await read('content/publications.json'));
assert.equal(new Set(papers.map(p=>p.id)).size,papers.length,'Paper IDs must be unique');
for (const p of papers) {
  assert(p.authors.includes('Pang, W.'),'Every listed work must include the profile owner');
  if(p.status==='Under review') assert(!p.year&&!p.doi&&!p.journal,'Under-review work must not carry a publication year or published metadata');
  else assert(/^10\.\d{4,9}\/.+/.test(p.doi)&&p.year&&p.journal,'Published papers need complete identification');
}
const pageNames=['index.html','publications.html','experience.html','teaching.html','awards.html','cv.html'];
const chinese=JSON.parse(await read('content/zh.json'));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const filename of [...pageNames,...pageNames.map(name=>'zh/'+name)]) {
  const html=await read(`dist/${filename}`);
  const chinesePage=filename.startsWith('zh/');
  const counterpart=chinesePage?'../'+path.basename(filename):'zh/'+filename;
  assert(html.includes(`lang="${chinesePage?'zh-Hans':'en'}"`),'Correct page language');
  assert(html.includes(`class="language-switch" href="${counterpart}"`),'Language switch must reach the same page');
  assert(!html.includes('undefined'),'No missing translation values');
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
const pdf=await readFile(path.join(root,'dist/assets/Wanru-Pang-CV.pdf'));
assert(pdf.subarray(0,5).equals(Buffer.from('%PDF-')),'Download must be a real PDF');
const normalized=async filename=>(await read(filename)).replace(/\r\n/g,'\n').trim();
const sourceHash=createHash('sha256').update((await normalized('content/profile.json'))+'\n'+(await normalized('content/publications.json'))).digest('hex');
assert(pdf.includes(Buffer.from('content-sha256:'+sourceHash)),'CV PDF is stale: regenerate scripts/build-pdf.py');
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
  assert(chineseExperience.includes(escape(conference.title)),'Original conference titles must be preserved');
  assert(chineseExperience.includes('（'+escape(chinese.profile.conferences[i].title)+'）'),'Conference translations must be present');
}
assert(chineseExperience.includes('会议投稿 · 审核中（Under review）'),'Conference submission is not an accepted presentation');
assert((await read('dist/zh/cv.html')).includes('下载完整简历（英文 PDF）'),'PDF language must be clear');
console.log('PASS: 12 bilingual pages, language switches, links and anchors, original paper/conference titles, selected/full publications, portrait and platform marks, under-review status, public output, and current PDF.');
