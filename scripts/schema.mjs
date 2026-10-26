// Reject malformed plans before writing output. Text is data, never code.
export const LAYOUTS=['cover','timeline','status','roles','harness','verdict','cycle','table','process','compare','discussion','sources'];
const BASE=['layout','title','eyebrow','theme','footer','notes','seconds','sources'];
const shapes={
 cover:['subtitle','kicker','details','date','metrics','image'],
 timeline:['events','note'],status:['rows','takeaway'],
 roles:['lead','roles','note'],
 harness:['context','agent','executor','verifier','owner','planLabel','resultLabel','feedback','feedbackDetail','audit','auditDetail'],
 verdict:['permission','approval','outcomes','principle','handoff','close'],
 cycle:['stages','center','feedback','note'],
 table:['lead','headers','rows','widths','note'],
 process:['lead','steps','callout'],
 compare:['lead','left','right','note'],
 discussion:['stages','questions','note','transitionLabel'],
 sources:['entries','note']
};
function error(p,m){throw new Error(`${p}: ${m}`);}
function object(v,p,keys){if(!v||typeof v!=='object'||Array.isArray(v))error(p,'应为对象');for(const k of Object.keys(v))if(!keys.includes(k))error(`${p}.${k}`,'未知字段');}
function str(v,p,optional=false,max=300){if(optional&&v===undefined)return;if(typeof v!=='string'||(!optional&&!v.trim()))error(p,'应为非空字符串');if(v.length>max)error(p,`超过 ${max} 字符，请拆分或移至备注`);}
function arr(v,p,min,max,fn){if(!Array.isArray(v)||v.length<min||v.length>max)error(p,`需要 ${min}–${max} 项`);v.forEach((x,i)=>fn(x,`${p}[${i}]`));}
function strings(v,p,min,max,len=80){arr(v,p,min,max,(x,k)=>str(x,k,false,len));}
function record(v,p,fields,limits={}){object(v,p,fields);for(const f of fields)str(v[f],`${p}.${f}`,false,limits[f]??100);}
function url(v,p){str(v,p,false,2000);let u;try{u=new URL(v);}catch{error(p,'无效 URL');}if(!['https:','http:'].includes(u.protocol))error(p,'只允许 http/https 链接');}
export function validatePlan(plan){
 object(plan,'plan',['title','fonts','slides']);str(plan.title,'plan.title',true,100);
 if(plan.fonts){object(plan.fonts,'plan.fonts',['cn','en','mono']);for(const [k,v] of Object.entries(plan.fonts))str(v,`plan.fonts.${k}`,false,100);}
 arr(plan.slides,'plan.slides',1,100,(s,p)=>{
  if(!s||!LAYOUTS.includes(s.layout))error(`${p}.layout`,`选择 ${LAYOUTS.join(', ')}`);
  object(s,p,[...BASE,...shapes[s.layout]]);str(s.title,`${p}.title`,false,s.layout==='cover'?50:32);
  for(const f of ['eyebrow','footer'])str(s[f],`${p}.${f}`,true,f==='footer'?100:45);
  str(s.notes,`${p}.notes`,true,15000);
  if(s.theme!==undefined&&!['dark','light'].includes(s.theme))error(`${p}.theme`,'选择 dark 或 light');
  if(s.seconds!==undefined&&(!Number.isFinite(s.seconds)||s.seconds<0))error(`${p}.seconds`,'应为非负秒数');
  if(s.sources!==undefined)arr(s.sources,`${p}.sources`,0,20,(v,k)=>{record(v,k,['title','url'],{url:2000});url(v.url,k+'.url');});
  const req=(keys,limit=100)=>keys.forEach(k=>str(s[k],`${p}.${k}`,false,limit));
  const opt=(keys,limit=120)=>keys.forEach(k=>str(s[k],`${p}.${k}`,true,limit));
  const recs=(k,n,m,fields,limits)=>arr(s[k],`${p}.${k}`,n,m,(v,q)=>record(v,q,fields,limits));
  switch(s.layout){
   case 'cover':req(['subtitle']);opt(['kicker','date']);if(s.details!==undefined)strings(s.details,p+'.details',0,3,60);if(s.metrics!==undefined)recs('metrics',1,2,['value','label'],{value:12,label:35});
    if(s.image){object(s.image,p+'.image',['path','caption']);str(s.image.path,p+'.image.path',false,1000);if(/^[a-z]+:\/\//i.test(s.image.path))error(p+'.image.path','请提供本地图片，不自动下载远程资源');if(!/\.(png|jpe?g)$/i.test(s.image.path))error(p+'.image.path','支持 PNG/JPEG');str(s.image.caption,p+'.image.caption',true,80);}break;
   case 'timeline':recs('events',4,4,['time','title','detail'],{time:24,title:24,detail:65});opt(['note']);break;
   case 'status':recs('rows',3,5,['label','state','detail'],{label:14,state:15,detail:38});req(['takeaway'],60);break;
   case 'roles':req(['lead']);arr(s.roles,p+'.roles',3,3,(v,k)=>{object(v,k,['title','lines']);str(v.title,k+'.title',false,16);strings(v.lines,k+'.lines',2,4,22);});opt(['note']);break;
   case 'harness':for(const k of ['context','agent','executor','verifier'])record(s[k],p+'.'+k,['title','body'],{title:14,body:32});req(['owner','planLabel','resultLabel','feedback','feedbackDetail','audit','auditDetail']);break;
   case 'verdict':req(['permission','approval','principle','close']);recs('outcomes',3,3,['title','condition','action'],{title:22,condition:28,action:24});object(s.handoff,p+'.handoff',['title','lines']);str(s.handoff.title,p+'.handoff.title',false,12);strings(s.handoff.lines,p+'.handoff.lines',2,2,65);break;
   case 'cycle':recs('stages',5,5,['title','body'],{title:10,body:18});req(['center','feedback','note']);break;
   case 'table':strings(s.headers,p+'.headers',2,4,28);arr(s.rows,p+'.rows',2,5,(r,k)=>strings(r,k,s.headers.length,s.headers.length,80));if(s.widths){arr(s.widths,p+'.widths',s.headers.length,s.headers.length,(v,k)=>{if(!Number.isFinite(v)||v<=0)error(k,'列宽权重需大于零');});}opt(['lead','note']);break;
   case 'process':req(['lead','callout']);recs('steps',4,4,['label','title','body'],{label:22,title:28,body:60});break;
   case 'compare':for(const k of ['left','right']){object(s[k],p+'.'+k,['title','lines']);str(s[k].title,p+'.'+k+'.title',false,24);strings(s[k].lines,p+'.'+k+'.lines',2,4,42);}opt(['lead','note']);break;
   case 'discussion':recs('stages',3,3,['title','body'],{title:16,body:55});strings(s.questions,p+'.questions',2,2,60);opt(['note','transitionLabel']);break;
   case 'sources':arr(s.entries,p+'.entries',1,5,(v,k)=>{record(v,k,['title','url'],{title:65,url:2000});url(v.url,k+'.url');});opt(['note']);break;
  }
 });return plan;
}
