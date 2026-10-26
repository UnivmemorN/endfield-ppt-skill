import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import JSZip from 'jszip';
import {validatePlan} from '../scripts/schema.mjs';
import {generate} from '../scripts/generate.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=JSON.parse(await fs.readFile(path.join(root,'examples/all-layouts.json'),'utf8'));
async function cleanup(dir){
 const target=path.resolve(dir),tempRoot=path.resolve(os.tmpdir());
 assert.equal(path.dirname(target),tempRoot);assert(path.basename(target).startsWith('endfield-'));
 await fs.rm(target,{recursive:true,force:true});
}
test('all supported layouts produce editable PPTX, notes and links',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'endfield-中文 space-'));
 try{
  const out=path.join(dir,'示例 deck.pptx');
  const r=await generate(fixture,{outputPath:out,writeReport:false});
  assert.equal(r.slides,12);assert.equal(r.warnings.length,0);
  const zip=await JSZip.loadAsync(await fs.readFile(out));
  const slides=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n));
  const notes=Object.keys(zip.files).filter(n=>/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n));
  assert.equal(slides.length,12);assert.equal(notes.length,12);
  const tableXml=await zip.file('ppt/slides/slide8.xml').async('string');
  assert.match(tableXml,/<a:tbl>/);assert.doesNotMatch(tableXml,/anchor="mid"/,'OOXML table anchor uses ctr, not mid');
  assert.match(await zip.file('ppt/slides/slide5.xml').async('string'),/<a:t>Agent<\/a:t>/);
  const rels=await zip.file('ppt/slides/_rels/slide12.xml.rels').async('string');assert.match(rels,/hyperlink/);
  for(const name of notes){const xml=await zip.file(name).async('string');assert.match(xml,/YUANZL/);assert.match(xml,/CC BY-NC 4.0/);}
  for(const name of slides){const xml=await zip.file(name).async('string');assert.doesNotMatch(xml,/descr="[A-Za-z]:[\\/]/,'image alternative text must not leak an absolute local path');}
  const cycle=r.report.slides.find(s=>s.layout==='cycle').objects.filter(o=>o.kind==='arrow');
  assert(cycle.some(o=>o.to[0]===500&&o.to[1]===235),'cycle closes 5→1');
  assert(cycle.some(o=>o.to[0]===930&&o.to[1]===379),'stage 4 returns to 2');
  const feedback=r.report.slides.find(s=>s.layout==='harness').objects.filter(o=>o.kind==='arrow');
  assert(feedback.some(o=>o.to[0]===580&&o.to[1]===417),'verifier feedback reaches planner');
  const before=await fs.readFile(out);await assert.rejects(generate(fixture,{outputPath:out}),/输出已存在/);assert.deepEqual(await fs.readFile(out),before);
 }finally{await cleanup(dir);}
});
test('invalid plans identify the field and cannot create output',async()=>{
 const variants=[
  [p=>delete p.slides[0].title,/slides\[0\].title/],
  [p=>p.slides[3].roles.pop(),/roles/],
  [p=>p.slides[5].handoff.lines='wrong',/handoff.lines/],
  [p=>p.slides[0].theme='purple',/theme/],
  [p=>p.slides[0].layout='unknown',/layout/],
  [p=>p.slides[0].command='echo unsafe',/未知字段/],
  [p=>p.slides[7].rows[0].pop(),/rows\[0\]/],
  [p=>p.slides[11].entries[0].url='javascript:alert(1)',/http\/https/],
  [p=>p.slides[0].image={path:'https://example.com/a.png'},/本地图片/]
 ];
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'endfield-invalid-'));
 try{for(const [mutate,pattern] of variants){const p=structuredClone(fixture);mutate(p);assert.throws(()=>validatePlan(p),pattern);const out=path.join(dir,'must-not-exist.pptx');await assert.rejects(generate(p,{outputPath:out}),pattern);await assert.rejects(fs.access(out));}}
 finally{await cleanup(dir);}
});
test('metacharacters remain text, no hidden execution',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'endfield-data-'));
 const p={title:'Data',slides:[{layout:'compare',title:'文本是数据',left:{title:'A',lines:['$(echo unsafe)','`echo unsafe`']},right:{title:'B',lines:['<script>example</script>','plain string']}}]};
 try{const out=path.join(dir,'data.pptx');await generate(p,{outputPath:out,writeReport:false});const zip=await JSZip.loadAsync(await fs.readFile(out));const xml=await zip.file('ppt/slides/slide1.xml').async('string');assert.match(xml,/\$\(echo unsafe\)/);assert.match(xml,/&lt;script&gt;example&lt;\/script&gt;/);assert.deepEqual((await fs.readdir(dir)).sort(),['data.pptx']);}
 finally{await cleanup(dir);}
});
