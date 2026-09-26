// Browser-level CSS contract; pass a Chrome/Chromium executable as argv[2].
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const companion = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../../kami-obsidian/theme.css', import.meta.url), 'utf8');
const chrome = process.argv[2] ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const directory = mkdtempSync(join(tmpdir(), 'kami-settings-'));
const native = `*{box-sizing:border-box;transition:none!important}body{--font-text-theme:Arial;--font-text:var(--font-text-theme);--font-text-size:16px;--file-line-width:700px;--line-height-normal:1.5;--background-primary:#fff;--background-secondary:#eee;--text-normal:#222;--text-muted:#555;--text-faint:#777;--text-accent:#6853bd;--interactive-accent:var(--text-accent);--background-modifier-border:#ddd}body.theme-dark{--background-primary:#222;--background-secondary:#333;--text-normal:#eee}.workspace-leaf-content{width:1200px}.view-content,.markdown-preview-view,.markdown-source-view{background:var(--background-primary);color:var(--text-normal);font-family:var(--font-text)}.markdown-preview-sizer,.cm-content{max-width:var(--file-line-width);margin:auto}.markdown-source-view{padding:24px}.cm-content{width:100%}a{color:var(--text-accent)}`;
const body = `<div class="workspace"><div class="workspace-split mod-root">${[0,1].map(i=>`<div class="workspace-leaf-content ${i===0?'kami-reading-stage':''}" data-type="markdown"><div class="view-header">Header</div><div class="view-content"><div class="markdown-preview-view"><div class="markdown-preview-sizer"><h1>Heading</h1><p>Body <a>Link</a></p></div></div><div class="markdown-source-view mod-cm6"><div class="cm-content"><div class="cm-line">Editor</div></div></div></div></div>`).join('')}</div></div>`;
const run = `
const check=(value,message)=>{if(!value)throw Error(message)};
const leaves=[...document.querySelectorAll('.workspace-leaf-content')];
const style=e=>getComputedStyle(e);
let count=0;
for(const mode of ['theme-light','theme-dark']) for(const combo of ['theme','companion','both']) {
 document.body.className=mode+' kami-reading-presence';
 document.querySelector('#theme').sheet.disabled=combo==='companion';
 document.querySelector('#companion').sheet.disabled=combo==='theme';
 document.body.removeAttribute('style');
 check(style(leaves[0].querySelector('p')).fontFamily.length>0,'default font');
 for(const [key,value] of Object.entries({'--font-text-theme':'Georgia','--file-line-width':'900px','--background-primary':'#123456','--text-accent':'#bc1234'}))document.body.style.setProperty(key,value);
 for(const stage of [false,true]) {
 document.body.classList.toggle('kami-reading-stage-open',stage);
 leaves[0].classList.toggle('kami-reading-stage-active',stage);
 for(const leaf of leaves) {
 check(style(leaf.querySelector('p')).fontFamily.includes('Georgia'),'body setting '+combo);
 check(style(leaf.querySelector('.cm-line')).fontFamily.includes('Georgia'),'editor setting '+combo);
 check(style(leaf.querySelector('.view-content')).backgroundColor==='rgb(18, 52, 86)','background '+combo);
 check(style(leaf.querySelector('a')).color==='rgb(188, 18, 52)','accent '+combo);
 const width=leaf.querySelector('.markdown-preview-sizer').getBoundingClientRect().width;
 check(width<=900 && width>0,'width cap '+combo);
 check(style(leaf.querySelector('.cm-content')).maxWidth==='900px','editor width '+combo);
 if(combo==='companion')check(style(leaf.querySelector('h1')).fontFamily.includes('Georgia'),'heading fallback');
 }
 if(combo!=='theme') {
 const shell=style(document.querySelector('.workspace')).backgroundColor;
 leaves[0].classList.add('kami-white-page-preview-active');
 check(style(leaves[0].querySelector('.view-content')).backgroundColor==='rgb(255, 255, 255)','white page');
 check(style(leaves[0].querySelector('a')).color==='rgb(27, 54, 93)','white link palette');
 check(style(document.querySelector('.workspace')).backgroundColor===shell,'shell unchanged');
 check(style(leaves[1].querySelector('.view-content')).backgroundColor==='rgb(18, 52, 86)','other pane unchanged');
 leaves[0].classList.remove('kami-white-page-preview-active');
 check(style(leaves[0].querySelector('.view-content')).backgroundColor==='rgb(18, 52, 86)','preview restores');
 }
 count++;
 }
 document.body.classList.remove('kami-reading-stage-open');leaves[0].classList.remove('kami-reading-stage-active');
 for(const leaf of leaves){leaf.style.width='360px';check(leaf.querySelector('.markdown-preview-sizer').getBoundingClientRect().width<=360,'narrow pane');leaf.style.width='';}
 document.body.style.setProperty('--font-text','monospace');
 check(style(leaves[0].querySelector('p')).fontFamily==='monospace','native font preference');
 document.querySelector('#companion').sheet.disabled=true;
 check(style(leaves[0].querySelector('.view-content')).backgroundColor==='rgb(18, 52, 86)','disable restores');
}
document.querySelector('#result').textContent='PASS '+count+' theme/mode/stage combinations';`;
try {
 const path=join(directory,'check.html');
 writeFileSync(path,`<style>${native}</style><style id="theme">${theme}</style><style id="companion">${companion}</style>${body}<pre id="result">PENDING</pre><script>try{${run}}catch(e){document.querySelector('#result').textContent='FAIL '+e.message}</script>`);
 const result=spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu',`--user-data-dir=${join(directory,'profile')}`,'--dump-dom',`file://${path}`],{encoding:'utf8',timeout:30000,maxBuffer:2e6});
 assert.equal(result.status,0,result.error?.message ?? result.stderr);
 const outcome=result.stdout.match(/<pre id="result">([^<]+)<\/pre>/)?.[1];
 assert.match(outcome ?? '',/^PASS /);
 console.log(outcome);
} finally { rmSync(directory,{recursive:true,force:true}); }
