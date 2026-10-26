import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pptxgen from 'pptxgenjs';
import {validatePlan,LAYOUTS} from './schema.mjs';
import {optimizedLayouts} from './optimized-layouts.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const C={bg:'F3F4F1',panel:'ECEEEC',ink:'1B1C1A',muted:'555B57',dark:'111210',paper:'F4F3EE',accent:'F4F600',danger:'E85B2A',line:'8F9691'};
const CREDIT='视觉来源：YUANZL，Endfield-PPT-Template，CC BY-NC 4.0。\nhttps://github.com/hs150521/Endfield-PPT-Template\nhttps://creativecommons.org/licenses/by-nc/4.0/\n改编：保留原模板背景与配色，增加可编辑布局、分层文案与本页内容。';
const darkDefaults=new Set(['cover','timeline','harness','process']);
export async function generate(plan,{outputPath,planDir=process.cwd(),force=false,writeReport=true}={}){
 validatePlan(plan);
 if(!outputPath||path.extname(outputPath).toLowerCase()!=='.pptx')throw new Error('outputPath 必须为 .pptx');
 outputPath=path.resolve(outputPath);
 if(!force){try{await fs.access(outputPath);throw new Error('输出已存在，请选择新文件名或显式使用 --force');}catch(e){if(e.code!=='ENOENT')throw e;}}
 const resolvedImages=new Map();
 for(const [i,s] of plan.slides.entries())if(s.image){const ip=path.resolve(planDir,s.image.path);await fs.access(ip);resolvedImages.set(i,ip);}
 const p=new pptxgen();p.layout='LAYOUT_WIDE';p.author='Endfield PPT portable renderer';p.subject='Editable presentation';p.title=plan.title||'Presentation';p.company='';p.lang='zh-CN';
 const CN=plan.fonts?.cn||'Microsoft YaHei',EN=plan.fonts?.en||'Arial',MONO=plan.fonts?.mono||'Courier New';p.theme={headFontFace:CN,bodyFontFace:CN,lang:'zh-CN'};
 const report={renderer:'pptxgenjs-4.0.1',slideCount:plan.slides.length,slides:[],warnings:[],visualInspection:'not_performed'};
 const px=v=>v/96,pt=v=>v*.75;
 function make(s,i){
  const sl=p.addSlide(),dark=s.theme?s.theme==='dark':darkDefaults.has(s.layout),fg=dark?C.paper:C.ink,muted=dark?'D0D3CF':C.muted;
  const rec={number:i+1,layout:s.layout,title:s.title,objects:[]};report.slides.push(rec);
  function check(kind,x,y,w,h){if([x,y,w,h].some(v=>!Number.isFinite(v))||w<0||h<0)throw new Error(`Slide ${i+1}: invalid ${kind} geometry`);if(x<-.1||y<-.1||x+w>1280.1||y+h>720.1)throw new Error(`Slide ${i+1}: ${kind} outside slide`);rec.objects.push({kind,x,y,w,h});}
  function text(str,x,y,w,h,size=26,bold=false,color=fg,extra={}){
   str=String(str??'');check('text',x,y,w,h);
   const estimated=str.split('\n').reduce((n,l)=>n+Math.max(1,Math.ceil([...l].reduce((a,ch)=>a+(/[\u2E80-\uFFFF]/.test(ch)?size:size*.56),0)/w)),0);
   if(estimated*size*1.15>h+3)report.warnings.push({slide:i+1,type:'estimated_text_fit',text:str.slice(0,60),message:'可能需要增高、缩短或人工检查，未自动缩字'});
   sl.addText(str,{x:px(x),y:px(y),w:px(w),h:px(h),fontFace:CN,fontSize:pt(size),bold,color,margin:0,breakLine:false,align:'left',valign:'top',paraSpaceAfterPt:0,lang:'zh-CN',...extra});
  }
  function rect(x,y,w,h,fill='none',stroke='none',width=1){check('rect',x,y,w,h);sl.addShape(p.ShapeType.rect,{x:px(x),y:px(y),w:px(w),h:px(h),fill:{color:fill==='none'?C.bg:fill,transparency:fill==='none'?100:0},line:{color:stroke==='none'?C.bg:stroke,transparency:stroke==='none'?100:0,width:pt(width)}});}
  function line(x1,y1,x2,y2,color=C.line,width=1){check('line',Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));sl.addShape(p.ShapeType.line,{x:px(Math.min(x1,x2)),y:px(Math.min(y1,y2)),w:px(Math.abs(x2-x1)),h:px(Math.abs(y2-y1)),flipH:x2<x1,flipV:y2<y1,line:{color,width:pt(width)}});}
  function arrow(x1,y1,x2,y2,color=fg,width=2){check('arrow',Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));rec.objects.at(-1).from=[x1,y1];rec.objects.at(-1).to=[x2,y2];sl.addShape(p.ShapeType.line,{x:px(Math.min(x1,x2)),y:px(Math.min(y1,y2)),w:px(Math.abs(x2-x1)),h:px(Math.abs(y2-y1)),flipH:x2<x1,flipV:y2<y1,line:{color,width:pt(width),endArrowType:'triangle'}});}
  function polyline(points,color=fg,width=2,arrowAtEnd=false){for(let j=1;j<points.length;j++)(arrowAtEnd&&j===points.length-1?arrow:line)(...points[j-1],...points[j],color,width);}
  sl.background={color:dark?C.dark:C.bg};sl.addImage({altText:'Background adapted from YUANZL Endfield template',path:path.join(ROOT,'assets',dark?'dark-soft.png':'light-grid.png'),x:0,y:0,w:1280/96,h:720/96});
  text(s.eyebrow||'',75,44,1080,29,18,false,dark?C.accent:muted);
  if(s.layout!=='cover'){
   if(!dark)sl.addImage({altText:'Title highlight adapted from YUANZL Endfield template',path:path.join(ROOT,'assets/yellow-highlight.png'),x:px(71),y:px(91),w:px(Math.min(1118,Math.max(530,s.title.length*35+80))),h:px(62)});
   text(s.title,75,96,1130,64,42,true);
  }
  line(75,655,1205,655,dark?'747A75':C.line,1);
  text(s.footer||'',75,669,1010,26,16,false,muted);
  text(`${String(i+1).padStart(2,'0')} / ${String(plan.slides.length).padStart(2,'0')}`,1105,670,100,26,16,false,muted,{align:'right',fontFace:MONO});
  sl.addNotes([s.seconds?`建议讲解用时：${s.seconds} 秒。`:'',s.notes||'',...(s.sources||[]).map(r=>`${r.title}\n${r.url}`),CREDIT].filter(Boolean).join('\n\n'));
  return {sl,fg,muted,dark,C,text,rect,line,arrow,polyline,index:i,record:rec};
 }
 const layouts={...optimizedLayouts,
  cover(s,c){const {sl,fg,muted,dark,text,line}=c,hasImage=resolvedImages.has(c.index),w=hasImage?620:1090;text(s.kicker||'',75,118,w,35,22,false,muted);text(s.title,75,201,w,180,66,true);text(s.subtitle,75,406,w,80,28,false,muted);text((s.details||[]).join('\n'),75,559,900,75,21);text(s.date||'',965,612,240,28,19,false,muted);
   if(hasImage){const ip=resolvedImages.get(c.index);sl.addImage({altText:s.image.caption||'Concept illustration',path:ip,...p.imageSizingContain(ip,px(755),px(195),px(450),px(350))});text(s.image.caption||'',755,556,450,55,20,false,muted);}
   else if(s.metrics){s.metrics.forEach((m,j)=>{const x=75+j*380;line(x,488,x+330,488,C.line,1);text(m.value,x,499,150,54,42,true,j?fg:(dark?C.accent:C.ink));text(m.label,x+160,510,190,45,21,false,muted);});}
  },
  timeline(s,{fg,muted,dark,text,line,rect}){line(90,307,1190,307,C.line,3);s.events.forEach((e,j)=>{let x=75+j*289;text(e.time,x,225,260,42,25,true,dark?C.accent:C.ink);rect(x+3,299,16,16,dark?C.accent:C.ink);text(e.title,x,348,260,78,31,true);text(e.detail,x,451,260,104,25,false,muted);});text(s.note||'',75,596,1130,45,23,false,muted);},
  status(s,{fg,muted,text,line}){s.rows.forEach((r,j)=>{let y=199+j*72;line(75,y,1205,y,C.line,1);text(r.label,75,y+18,230,46,27,true);text(r.state,325,y+18,200,46,26);text(r.detail,550,y+18,655,46,25,false,muted);});text(s.takeaway,75,596,1130,45,27,true);},
  table(s,{sl,fg,muted,dark,text}){text(s.lead||'',75,185,1130,42,26);let widths=s.widths||s.headers.map(()=>1),sum=widths.reduce((a,b)=>a+b,0);const vals=[s.headers,...s.rows].map((row,r)=>row.map((v,j)=>({text:v,options:{bold:r===0||j===0,color:r===0?C.paper:fg,fill:r===0?C.ink:(dark?C.dark:C.bg)}})));sl.addTable(vals,{x:px(75),y:px(s.lead?245:205),w:px(1130),h:px(325),colW:widths.map(w=>px(1130*w/sum)),rowH:px(325/vals.length),border:{type:'solid',color:C.line,pt:.6},fontFace:CN,fontSize:18,margin:[8,12,8,12],valign:'middle',autoPage:false,paraSpaceAfterPt:0});text(s.note||'',75,597,1130,44,24,true);},
  process(s,{fg,muted,dark,text,line}){text(s.lead,75,190,1130,43,27,false,muted);s.steps.forEach((r,j)=>{let x=75+j*289;line(x,281,x+260,281,j===3?(dark?C.accent:C.ink):C.line,3);text(r.label,x,306,260,39,24,true,dark?C.accent:C.ink);text(r.title,x,374,260,75,30,true);text(r.body,x,459,260,80,24,false,muted);});text(s.callout,75,589,1130,50,27,true);},
  compare(s,{fg,muted,text,line}){text(s.lead||'',75,190,1130,46,26,false,muted);[s.left,s.right].forEach((r,j)=>{let x=75+j*590;line(x,276,x+540,276,fg,3);text(r.title,x,300,540,68,33,true);text(r.lines.join('\n'),x,400,540,166,27);});text(s.note||'',75,596,1130,43,24,false,muted);},
  sources(s,{fg,muted,text,line}){s.entries.forEach((r,j)=>{let y=204+j*74;line(75,y,1205,y,C.line,1);text(String(j+1).padStart(2,'0'),75,y+17,65,42,22,false,muted);text(r.title,160,y+17,1045,48,25,false,fg,{hyperlink:{url:r.url}});});text(s.note||'',75,599,1130,42,22,false,muted);}
 };
 for(const [i,s] of plan.slides.entries())layouts[s.layout](s,make(s,i));
 await fs.mkdir(path.dirname(outputPath),{recursive:true});
 // Write atomically. A schema or layout error never overwrites the requested file.
 const tmp=path.join(path.dirname(outputPath),`.endfield-${process.pid}-${Date.now()}.pptx`);
 try{await p.writeFile({fileName:tmp,compression:true});if(force)await fs.rename(tmp,outputPath);else {await fs.copyFile(tmp,outputPath,fs.constants.COPYFILE_EXCL);await fs.unlink(tmp);}}catch(e){await fs.unlink(tmp).catch(()=>{});throw e;}
 if(writeReport)await fs.writeFile(outputPath+'.report.json',JSON.stringify(report,null,2));
 return {outputPath,slides:plan.slides.length,warnings:report.warnings,report};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);const help='node scripts/generate.mjs --plan PLAN.json --out OUTPUT.pptx [--force]\n--check validates JSON only; --help lists this help. Layouts: '+LAYOUTS.join(', ');
 try{
  if(args.includes('--help')){console.log(help);}else{
   const options={};for(let i=0;i<args.length;i++){const a=args[i];if(['--plan','--out'].includes(a)){if(!args[i+1]||args[i+1].startsWith('--'))throw new Error(`${a} requires a value`);options[a.slice(2)]=args[++i];}else if(['--force','--check'].includes(a))options[a.slice(2)]=true;else throw new Error(`Unknown argument: ${a}`);}
   if(!options.plan||(!options.out&&!options.check))throw new Error(help);
   const plan=JSON.parse((await fs.readFile(options.plan,'utf8')).replace(/^\uFEFF/,''));validatePlan(plan);
   if(options.check)console.log(JSON.stringify({valid:true,slides:plan.slides.length}));
   else{const r=await generate(plan,{outputPath:options.out,planDir:path.dirname(path.resolve(options.plan)),force:!!options.force});console.log(JSON.stringify({outputPath:r.outputPath,slides:r.slides,warnings:r.warnings}));}
  }
 }catch(e){console.error(e.message);process.exitCode=1;}
}


