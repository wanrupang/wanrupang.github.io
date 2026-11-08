import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const base = fileURLToPath(new URL('../dist/', import.meta.url));
const allowed = new Set(['index.html','publications.html','experience.html','teaching.html','awards.html','cv.html','assets/site.css','assets/site.js','assets/favicon.svg','assets/wanru-pang-aera.jpg','assets/googlescholar.svg','assets/orcid.svg','assets/researchgate.svg','publications.bib','robots.txt','sitemap.xml']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.pdf':'application/pdf','.bib':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
for (const file of [...allowed].filter(file => file.endsWith('.html'))) allowed.add('zh/' + file);
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (req,res) => {
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let route;
  try { route = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'') || 'index.html'; } catch {res.writeHead(400);res.end('Bad request');return;}
  if (route === 'zh/' || route === 'zh') route = 'zh/index.html';
  if (!path.extname(route) && allowed.has(route+'.html')) route += '.html';
  if (!allowed.has(route)) {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Page not found');return;}
  try {
    const content = await readFile(path.join(base,route));
    res.writeHead(200,{'Content-Type':types[path.extname(route)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Length':content.length,...(route.endsWith('.pdf')?{'Content-Disposition':'attachment; filename="Wanru-Pang-CV.pdf"'}:{})});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {res.writeHead(503);res.end('Run node scripts/build.mjs first.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
