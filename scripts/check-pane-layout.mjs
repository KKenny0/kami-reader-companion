// Real browser layout plus the production AdaptiveContent implementation.
// Optional argv[2]: Chrome/Chromium executable.
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildSync } from 'esbuild';
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../../kami-obsidian/theme.css', import.meta.url), 'utf8');
const bundle = buildSync({entryPoints:[new URL('../src/adaptive-content.ts',import.meta.url).pathname],bundle:true,write:false,format:'iife',globalName:'Kami'}).outputFiles[0].text;
const native = `*{box-sizing:border-box}body{margin:0;--font-text:Arial;--font-text-size:19px;--file-line-width:900px;--line-height-normal:1.5}.workspace-leaf-content{width:360px}.markdown-preview-view{width:100%;overflow:auto;font-size:var(--font-text-size)}.markdown-preview-sizer{max-width:var(--file-line-width);margin:auto}.callout-content{padding:12px}pre{white-space:pre;overflow:auto}img{max-width:100%}table{border-collapse:collapse}td{white-space:nowrap}.cm-content{font-size:var(--font-text-size)}`;
const body = `<div class="workspace-leaf-content" data-type="markdown"><div class="markdown-preview-view"><div class="markdown-preview-sizer markdown-preview-section"><h1>长标题排版与中文阅读密度</h1><p>正文内容保持用户设置字号。</p><div id="wide" class="el-table"><table><tr><td>${'wide '.repeat(300)}</td></tr></table></div><ul><li>List<table id="nested"><tr><td>${'nested '.repeat(200)}</td></tr></table></li></ul><div class="callout"><div class="callout-content"><pre id="code">${'code '.repeat(300)}</pre><div class="mermaid" id="diagram"><svg width="1800" height="60" viewBox="0 0 1800 60"></svg></div><div class="internal-embed" id="embed"><iframe width="1800" height="60" srcdoc="embedded"></iframe></div></div></div><div id="media"><img id="image"></div></div></div><div class="markdown-source-view mod-cm6"><div class="cm-content">编辑正文</div></div></div><pre id="result">PENDING</pre>`;
const script = `
const check=(ok,message)=>{if(!ok)throw Error(message)};
HTMLElement.prototype.instanceOf=function(type){return this instanceof type};
const leaf=document.querySelector('.workspace-leaf-content'),preview=document.querySelector('.markdown-preview-view'),sizer=document.querySelector('.markdown-preview-sizer');
let scheduled=0;
let count=0;
for(const mode of ['theme-light','theme-dark'])for(const combo of ['theme','companion','both']){
 const adaptive=new Kami.AdaptiveContent(p=>{scheduled++;adaptive.refresh(p)});adaptive.configure(new Set([preview]));
 document.body.className=mode;document.querySelector('#theme').sheet.disabled=combo==='companion';document.querySelector('#companion').sheet.disabled=combo==='theme';
 document.body.style.setProperty('--font-text-size','19px');document.body.style.setProperty('--file-line-width','900px');
 for(const width of [240,360,720,1200]){
  leaf.style.width=width+'px';
  if(combo!=='theme')adaptive.refresh(preview);
  const actual=sizer.getBoundingClientRect().width;
  check(actual>=Math.min(width-96,900),'sizer collapsed '+combo+' '+width+' '+actual);
  check(actual<=900&&actual<width,'sizer cap');
  check(getComputedStyle(preview).fontSize==='19px','body size');
  check(getComputedStyle(leaf.querySelector('.cm-content')).fontSize==='19px','editor size');
  if(combo!=='theme'){
   check(!document.querySelector('ul').classList.contains('kami-content-frame'),'list expanded');
   check(!document.querySelector('.callout').classList.contains('kami-content-frame'),'callout expanded');
   for(const id of ['diagram','embed']){const el=document.getElementById(id);check(el.getBoundingClientRect().width<=el.parentElement.clientWidth,'nested media escape '+id);}
   for(const id of ['nested','code']){const el=document.getElementById(id);check(el.getBoundingClientRect().width<=el.parentElement.clientWidth+1,'nested escape '+id);check(el.scrollWidth>el.clientWidth,'local scroll '+id);}
  }
  check(preview.scrollWidth<=preview.clientWidth+1,'pane overflow '+combo+' '+width);
  count++;
 }
 adaptive.destroy();
}
// Reloading media and pane resizing run through the same production refresh.
document.querySelector('#companion').sheet.disabled=false;leaf.style.width='1200px';
const mediaAdaptive=new Kami.AdaptiveContent(p=>{scheduled++;mediaAdaptive.refresh(p)});mediaAdaptive.configure(new Set([preview]));
const image=document.getElementById('image');
await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="100"></svg>')});
check(scheduled>0,'delayed load not scheduled');
check(document.getElementById('media').classList.contains('kami-content-frame'),'loaded media not widened');
document.body.classList.add('kami-reading-stage-open');leaf.classList.add('kami-reading-stage-active');mediaAdaptive.refresh(preview);check(document.getElementById('media').getBoundingClientRect().width<=preview.clientWidth,'Stage escape');
document.body.classList.remove('kami-reading-stage-open');leaf.classList.remove('kami-reading-stage-active');leaf.style.width='360px';mediaAdaptive.refresh(preview);check(document.getElementById('media').getBoundingClientRect().width<=360,'resize retained width');
mediaAdaptive.destroy();check(!document.querySelector('.kami-content-frame'),'cleanup retained frame');
document.getElementById('result').textContent='PASS '+count+' pane/theme combinations + nested overflow + delayed media/resize';`;
const directory=mkdtempSync(join(tmpdir(),'kami-pane-'));
try{
 const path=join(directory,'check.html');
 writeFileSync(path,`<style>${native}</style><style id="theme">${theme}</style><style id="companion">${css}</style>${body}<script>${bundle}</script><script>(async()=>{try{${script}}catch(e){document.getElementById('result').textContent='FAIL '+e.message}})()</script>`);
 const result=spawnSync(process.argv[2]??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--no-sandbox','--disable-gpu',`--user-data-dir=${join(directory,'profile')}`,'--window-size=1600,1000','--virtual-time-budget=3000','--dump-dom',`file://${path}`],{encoding:'utf8',timeout:30000,maxBuffer:2e6});
 assert.equal(result.status,0,result.error?.message??result.stderr);
 const outcome=result.stdout.match(/<pre id="result">([^<]+)<\/pre>/)?.[1];assert.match(outcome??'',/^PASS /);console.log(outcome);
}finally{rmSync(directory,{recursive:true,force:true})}
