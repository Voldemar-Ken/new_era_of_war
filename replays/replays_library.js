/* Повтори / файли: кодування й декодування .nowr */

(function(){
"use strict";
const {num, clampN, MAGIC, STRIDE, MAX_JSON, MAX_RAW} = window.__NEOW_RP;
/* =====================================================================
   КОДУВАННЯ ФАЙЛУ (.nowr): "NEOWRPL1" | u32 довжина JSON | JSON | вирівнювання | Float32 часи | Int16 заголовки | Int16 кадри — усе gzip
   ===================================================================== */
async function readAll(stream,limit){
  const r=stream.getReader(),parts=[];let n=0;
  for(;;){
    const {done,value}=await r.read(); if(done) break;
    n+=value.length; if(n>limit){ try{r.cancel();}catch(e){} throw new Error('Файл повтору завеликий'); }
    parts.push(value);
  }
  const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}
  return out.buffer;
}
async function gzip(u8){
  if(typeof CompressionStream==='undefined') return u8.buffer.slice(u8.byteOffset,u8.byteOffset+u8.byteLength);
  return readAll(new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip')),MAX_RAW);
}
async function gunzipIfNeeded(ab){
  const h=new Uint8Array(ab,0,Math.min(2,ab.byteLength));
  if(h.length>=2&&h[0]===0x1f&&h[1]===0x8b){
    if(typeof DecompressionStream==='undefined') throw new Error('Цей браузер не вміє розпаковувати файл повтору');
    return readAll(new Blob([ab]).stream().pipeThrough(new DecompressionStream('gzip')),MAX_RAW);
  }
  return ab;
}
async function encode(rep){
  const F=rep.frames,N=rep.N;
  const head={meta:rep.meta,ents:rep.ents,keys:rep.keys,covers:rep.covers,swamps:rep.swamps,bullets:rep.bullets,mines:rep.mines,markers:rep.markers,parts:rep.parts,log:rep.log,maxLife:rep.maxLife,frames:F,N,stride:STRIDE};
  const jb=new TextEncoder().encode(JSON.stringify(head));
  const pad=(4-jb.length%4)%4, off=12+jb.length+pad;
  const buf=new ArrayBuffer(off+F*12+F*N*STRIDE*2), u8=new Uint8Array(buf);
  u8.set(new TextEncoder().encode(MAGIC),0);
  new DataView(buf).setUint32(8,jb.length,true);
  u8.set(jb,12);
  new Float32Array(buf,off,F).set(rep.times.subarray(0,F));
  new Int16Array(buf,off+F*4,F*4).set(rep.hdr.subarray(0,F*4));
  new Int16Array(buf,off+F*12,F*N*STRIDE).set(rep.data.subarray(0,F*N*STRIDE));
  return gzip(u8);
}
const bad=()=>new Error('Файл пошкоджено або це не повтор New Era of War');
async function decode(ab0){
  const ab=await gunzipIfNeeded(ab0);
  if(ab.byteLength<24) throw bad();
  const u8=new Uint8Array(ab);
  if(new TextDecoder().decode(u8.subarray(0,8))!==MAGIC) throw bad();
  const jlen=new DataView(ab).getUint32(8,true);
  if(jlen>MAX_JSON||12+jlen>ab.byteLength) throw bad();
  let h; try{ h=JSON.parse(new TextDecoder().decode(u8.subarray(12,12+jlen))); }catch(e){ throw bad(); }
  const F=h.frames|0,N=h.N|0,off=12+jlen+(4-jlen%4)%4;
  if(h.stride!==STRIDE||F<1||F>300000||N<1||N>64||off+F*12+F*N*STRIDE*2>ab.byteLength) throw bad();
  const m=h.meta;
  if(!m||!MAPS[m.mapKey]||!CLASSES[m.playerCls]||!Array.isArray(h.ents)||h.ents.length!==N||!Array.isArray(h.keys)) throw bad();
  h.ents.forEach(e=>{ if(!CLASSES[e.cls]||(e.team!=='ally'&&e.team!=='enemy')) throw bad(); e.id=num(e.id); e.maxHp=Math.max(1,num(e.maxHp,100)); e.isPlayer=!!e.isPlayer; });
  const pt=p=>p&&isFinite(+p.x)&&isFinite(+p.y);
  if(!pt(m.allyBase)||!pt(m.enemyBase)||!pt(m.capture)) throw bad();
  m.mapSize=clampN(num(m.mapSize,2000),200,10000); m.totalTime=Math.max(1,num(m.totalTime,600)); m.capRadius=num(m.capRadius,150);
  ['mapName','mapIcon','sizeLabel','modeLabel','diff','reason'].forEach(k=>{ m[k]=String(m[k]==null?'':m[k]).slice(0,60); });
  m.winner=(m.winner==='ally'||m.winner==='enemy')?m.winner:'draw';
  ['duration','killsA','killsE','myKills','myDmg','teamSize','ts','seed'].forEach(k=>{ m[k]=num(m[k]); });
  m.id=String(m.id||'').replace(/[^a-z0-9]/gi,'').slice(0,24)||(Date.now().toString(36));
  h.keys=h.keys.map(String);
  const okRow=(a,n)=>Array.isArray(a)&&a.length>=n&&a.every(v=>typeof v==='number'&&isFinite(v));
  h.bullets=(Array.isArray(h.bullets)?h.bullets:[]).filter(a=>okRow(a,9));
  h.mines=(Array.isArray(h.mines)?h.mines:[]).filter(a=>okRow(a,5));
  h.markers=(Array.isArray(h.markers)?h.markers:[]).filter(a=>okRow(a,5));
  h.parts=(Array.isArray(h.parts)?h.parts:[]).filter(a=>okRow(a,4));
  h.log=(Array.isArray(h.log)?h.log:[]).filter(a=>Array.isArray(a)&&isFinite(+a[0])).map(a=>[+a[0],String(a[1]).slice(0,200)]);
  const cleanShape=a=>(Array.isArray(a)?a:[]).filter(c=>c&&typeof c==='object').map(c=>{ c.fill=typeof c.fill==='string'?c.fill:undefined; c.stroke=typeof c.stroke==='string'?c.stroke:undefined; return c; });
  h.covers=cleanShape(h.covers); h.swamps=cleanShape(h.swamps);
  h.maxLife=Math.max(0.5,num(h.maxLife,6));
  return Object.assign(h,{
    times:new Float32Array(ab,off,F),
    hdr:new Int16Array(ab,off+F*4,F*4),
    data:new Int16Array(ab,off+F*12,F*N*STRIDE)
  });
}
Object.assign(window.__NEOW_RP,{encode, decode});
})();

/* Повтори / файли: сховище IndexedDB */

(function(){
"use strict";
const {MAX_REPLAYS} = window.__NEOW_RP;
/* =====================================================================
   СХОВИЩЕ: IndexedDB (запасний варіант — пам'ять вкладки)
   ===================================================================== */
const RDB={db:null,ready:null,mem:new Map(),memOnly:false};
RDB.open=function(){
  if(RDB.ready) return RDB.ready;
  RDB.ready=new Promise(res=>{
    try{
      const rq=indexedDB.open('neow_replays_v1',1);
      rq.onupgradeneeded=()=>{ const d=rq.result; d.createObjectStore('meta',{keyPath:'id'}); d.createObjectStore('data',{keyPath:'id'}); };
      rq.onsuccess=()=>{ RDB.db=rq.result; res(true); };
      rq.onerror=rq.onblocked=()=>{ RDB.memOnly=true; res(false); };
    }catch(e){ RDB.memOnly=true; res(false); }
  });
  return RDB.ready;
};
const idbDone=t=>new Promise((res,rej)=>{ t.oncomplete=()=>res(); t.onerror=t.onabort=()=>rej(t.error||new Error('Помилка сховища')); });
const idbReq=r=>new Promise((res,rej)=>{ r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error||new Error('Помилка сховища')); });
RDB.put=async function(meta,buf){
  await RDB.open();
  if(!RDB.memOnly){
    try{
      const t=RDB.db.transaction(['meta','data'],'readwrite');
      t.objectStore('meta').put(meta); t.objectStore('data').put({id:meta.id,buf});
      await idbDone(t);
    }catch(e){ RDB.memOnly=true; console.warn('IndexedDB недоступна, повтор лише в пам’яті',e); }
  }
  if(RDB.memOnly) RDB.mem.set(meta.id,{meta,buf});
};
RDB.list=async function(){
  await RDB.open();
  let out=[];
  if(!RDB.db){ out=[...RDB.mem.values()].map(x=>x.meta); }
  else{
    out=await idbReq(RDB.db.transaction('meta').objectStore('meta').getAll());
    RDB.mem.forEach(x=>{ if(!out.some(m=>m.id===x.meta.id)) out.push(x.meta); });
  }
  return out.sort((a,b)=>(b.ts||0)-(a.ts||0));
};
RDB.get=async function(id){
  await RDB.open();
  if(RDB.mem.has(id)) return RDB.mem.get(id).buf;
  if(!RDB.db) return null;
  const r=await idbReq(RDB.db.transaction('data').objectStore('data').get(id));
  return r?r.buf:null;
};
RDB.del=async function(id){
  await RDB.open(); RDB.mem.delete(id);
  if(!RDB.db) return;
  const t=RDB.db.transaction(['meta','data'],'readwrite');
  t.objectStore('meta').delete(id); t.objectStore('data').delete(id);
  await idbDone(t);
};
RDB.clear=async function(){
  await RDB.open(); RDB.mem.clear();
  if(!RDB.db) return;
  const t=RDB.db.transaction(['meta','data'],'readwrite');
  t.objectStore('meta').clear(); t.objectStore('data').clear();
  await idbDone(t);
};
RDB.save=async function(meta,buf){
  await RDB.put(meta,buf);
  const all=await RDB.list();
  for(const m of all.slice(MAX_REPLAYS)) await RDB.del(m.id);   // зберігаємо останні MAX_REPLAYS
};
Object.assign(window.__NEOW_RP,{RDB});
})();

/* Повтори / файли: екран «Повтори», завантаження, імпорт, видалення */

(function(){
"use strict";
const {$, esc, num, MAX_REPLAYS, pad2, fmtTime, fmtDate, fmtSize, decode, RDB} = window.__NEOW_RP;
const P=REPLAY;   // стан перегляду повтору (replays/replay_state.js)
/* =====================================================================
   ЕКРАН «ПОВТОРИ»
   ===================================================================== */
const RPUI={last:null};
RPUI.msg=function(text,bad){ const el=$('rpMsg'); el.textContent=text||''; el.style.color=bad?'#ef4444':'var(--primary)'; };
RPUI.render=async function(){
  const box=$('rpList'),info=$('rpInfo');
  box.innerHTML='<p class="muted">Завантаження…</p>';
  let list=[];
  try{ list=await RDB.list(); }catch(e){ box.innerHTML='<p class="muted">Не вдалося прочитати сховище: '+esc(e.message)+'</p>'; return; }
  const total=list.reduce((s,m)=>s+num(m.size),0);
  info.textContent=(list.length?list.length+' з '+MAX_REPLAYS+' · '+fmtSize(total)+' · ':'')+'Зберігаються останні '+MAX_REPLAYS+' боїв. Щоб зберегти повтор назавжди — завантажте його файлом.'+(RDB.memOnly?' ⚠ Сховище браузера недоступне: повтори живуть лише до закриття вкладки.':'');
  $('rpClearAll').style.display=list.length?'':'none';
  if(!list.length){
    box.innerHTML='<div class="panel" style="padding:26px;text-align:center;"><div style="font-size:2.4rem;">🎞</div><p class="muted" style="margin:10px 0 0;">Збережених повторів ще немає. Зіграйте бій — запис з’явиться тут автоматично (за умови, що збереження ввімкнене в «Налаштуваннях»). Також можна імпортувати файл .nowr.</p></div>';
    return;
  }
  box.innerHTML=list.map(m=>{
    const cls=CLASSES[m.playerCls]||{name:'—',icon:'?',color:'#fff'};
    const w=m.winner==='ally'?['win','ПЕРЕМОГА']:m.winner==='enemy'?['lose','ПОРАЗКА']:['draw','НІЧИЯ'];
    const meta=[cls.icon+' '+cls.name,m.modeLabel,m.online?'Онлайн':(m.diff||'Офлайн'),fmtTime(m.duration),fmtDate(m.ts)].filter(Boolean).map(esc).join(' · ');
    return `<div class="panel rp-card" data-id="${esc(m.id)}">
      <div class="rp-badge ${w[0]}">${w[1]}</div>
      <div class="rp-main"><b>${esc(m.mapIcon)} ${esc(m.mapName)}</b> <span class="muted">· ${esc(m.sizeLabel)}</span><br><span class="muted" style="font-size:.78rem;">${meta}</span></div>
      <div class="rp-score" title="Ураження: союзники : вороги"><span style="color:var(--ally)">${num(m.killsA)}</span> : <span style="color:var(--enemy)">${num(m.killsE)}</span></div>
      <div class="rp-actions">
        <button class="btn btn-primary" data-act="watch" style="padding:.6rem 1rem;">▶ Дивитись</button>
        <button class="btn btn-ghost" data-act="dl" style="padding:.6rem 1rem;" title="Завантажити файл повтору">⬇ ${fmtSize(num(m.size))}</button>
        <button class="btn btn-ghost" data-act="del" style="padding:.6rem 1rem;color:#ef4444;border-color:rgba(239,68,68,.45);" title="Видалити">🗑</button>
      </div></div>`;
  }).join('');
};
RPUI.watch=async function(id){
  try{
    RPUI.msg('Завантаження повтору…');
    const buf=await RDB.get(id); if(!buf) throw new Error('Повтор не знайдено');
    const rep=await decode(buf);
    RPUI.msg('');
    P.start(rep);
  }catch(err){ RPUI.msg('⚠ '+(err&&err.message||err),true); console.error(err); }
};
RPUI.download=async function(id){
  try{
    const buf=await RDB.get(id); if(!buf) throw new Error('Повтор не знайдено');
    const metas=await RDB.list(); const m=metas.find(x=>x.id===id)||{};
    const d=new Date(m.ts||Date.now());
    const name='NEW-ERA_'+(m.mapKey||'replay')+'_'+d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+'-'+pad2(d.getHours())+pad2(d.getMinutes())+'.nowr';
    const url=URL.createObjectURL(new Blob([buf],{type:'application/octet-stream'}));
    const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    RPUI.msg('Файл «'+name+'» завантажено.');
  }catch(err){ RPUI.msg('⚠ '+(err&&err.message||err),true); }
};
$('rpList').addEventListener('click',async ev=>{
  const btn=ev.target.closest('button[data-act]'); if(!btn) return;
  const id=btn.closest('.rp-card').dataset.id, act=btn.dataset.act;
  if(act==='watch') RPUI.watch(id);
  else if(act==='dl') RPUI.download(id);
  else if(act==='del'){
    if(!btn.dataset.armed){ btn.dataset.armed='1'; btn.textContent='Точно?'; setTimeout(()=>{ if(btn.isConnected){ delete btn.dataset.armed; btn.textContent='🗑'; } },3000); return; }
    try{ await RDB.del(id); }catch(e){ RPUI.msg('⚠ '+e.message,true); }
    RPUI.render();
  }
});
let clearArmed=false;
$('rpClearAll').addEventListener('click',async ev=>{
  const b=ev.currentTarget;
  if(!clearArmed){ clearArmed=true; b.textContent='Точно видалити все?'; setTimeout(()=>{ clearArmed=false; b.textContent='🗑 Очистити все'; },3000); return; }
  clearArmed=false; b.textContent='🗑 Очистити все';
  try{ await RDB.clear(); RPUI.msg('Усі повтори видалено.'); }catch(e){ RPUI.msg('⚠ '+e.message,true); }
  RPUI.render();
});
$('rpImport').addEventListener('change',async ev=>{
  const f=ev.target.files&&ev.target.files[0]; ev.target.value='';
  if(!f) return;
  try{
    if(f.size>120e6) throw new Error('Файл завеликий');
    const buf=await f.arrayBuffer();
    const rep=await decode(buf.slice(0));
    const exists=(await RDB.list()).some(m=>m.id===rep.meta.id);
    if(exists){ RPUI.msg('Цей повтор уже є в списку.'); return; }
    rep.meta.size=buf.byteLength; rep.meta.imported=true;
    await RDB.save(rep.meta,buf);
    RPUI.msg('Повтор імпортовано.');
    RPUI.render();
  }catch(err){ RPUI.msg('⚠ '+(err&&err.message||err),true); }
});
Object.assign(window.__NEOW_RP,{RPUI});
})();
