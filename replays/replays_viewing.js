/* Повтори / перегляд: керування (кнопки, клавіші, миша) */

(function(){
"use strict";
const {$, clampN} = window.__NEOW_RP;
const P=REPLAY;   // стан перегляду повтору (replays/replay_state.js)
/* ---------- керування ---------- */
$('rpPlay').onclick=()=>{ P.setPlaying(!P.playing); };
$('rpBack').onclick=()=>P.seek(P.t-10);
$('rpFwd').onclick=()=>P.seek(P.t+10);
$('rpFollow').onclick=()=>P.toggleFree();
$('rpExit').onclick=()=>P.exit();
$('rpSpeeds').addEventListener('click',ev=>{ const b=ev.target.closest('[data-s]'); if(b) P.setSpeed(+b.dataset.s); });
const seekEl=$('rpSeek');
seekEl.addEventListener('pointerdown',()=>{ P.drag=true; });
window.addEventListener('pointerup',()=>{ P.drag=false; });
seekEl.addEventListener('input',()=>{ P.seek(+seekEl.value/10); P.refreshBtns(); });
document.querySelectorAll('#rpBar button').forEach(b=>b.addEventListener('mouseup',()=>b.blur()));

window.addEventListener('keydown',ev=>{
  if(!P.on) return;
  const k=ev.code; let used=true;
  if(k==='Escape') P.exit();
  else if(k==='Space') P.setPlaying(!P.playing);
  else if(k==='ArrowLeft') P.seek(P.t-(ev.shiftKey?30:5));
  else if(k==='ArrowRight') P.seek(P.t+(ev.shiftKey?30:5));
  else if(k==='ArrowUp'||k==='ArrowDown'){
    const S=[0.5,1,2,4,8],i=S.indexOf(P.speed); P.setSpeed(S[clampN((i<0?1:i)+(k==='ArrowUp'?1:-1),0,S.length-1)]);
  }
  else if(k==='Tab') P.cycle(ev.shiftKey?-1:1);
  else if(k==='KeyF') P.toggleFree();
  else used=false;
  if(used){ ev.preventDefault(); if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); }
},true);

// мишка на полотні: тягнути — вільна камера, клік по бійцю — стежити, колесо — масштаб
(function(){
  const cv=$('gameCanvas'); let down=null;
  const toCanvas=ev=>{ const r=cv.getBoundingClientRect(); return {x:(ev.clientX-r.left)*CW/r.width,y:(ev.clientY-r.top)*CH/r.height,k:CW/r.width}; };
  cv.addEventListener('mousedown',ev=>{ if(!P.on||ev.button!==0) return; down={x:ev.clientX,y:ev.clientY,moved:false}; });
  window.addEventListener('mousemove',ev=>{
    if(!P.on||!down) return;
    const dx=ev.clientX-down.x,dy=ev.clientY-down.y;
    if(!down.moved&&Math.hypot(dx,dy)>4){ down.moved=true; if(!P.free){ P.cx=camX+CW/currentZoom/2; P.cy=camY+CH/currentZoom/2; P.free=true; P.refreshBtns(); } }
    if(down.moved){
      const r=cv.getBoundingClientRect(),k=CW/r.width;
      P.cx-=dx*k/currentZoom; P.cy-=dy*k/currentZoom;
      P.cx=clampN(P.cx,0,RUN.mapSize); P.cy=clampN(P.cy,0,RUN.mapSize);
      down.x=ev.clientX; down.y=ev.clientY;
    }
  });
  window.addEventListener('mouseup',ev=>{
    if(!down) return;
    const wasClick=!down.moved; down=null;
    if(!P.on||!wasClick||ev.target!==cv) return;
    const c=toCanvas(ev),wx=camX+c.x/currentZoom,wy=camY+c.y/currentZoom;
    let best=-1,bd=34/currentZoom+10;
    P.ents.forEach((e,i)=>{ if(e.dead) return; const dd=Math.hypot(e.x-wx,e.y-wy); if(dd<bd){ bd=dd; best=i; } });
    if(best>=0) P.follow(best);
  });
  cv.addEventListener('wheel',ev=>{ if(!P.on) return; ev.preventDefault(); P.zoom*=ev.deltaY>0?0.9:1.1; },{passive:false});
  $('minimap').addEventListener('mousedown',ev=>{
    if(!P.on) return; ev.preventDefault();
    const mini=ev.currentTarget,r=mini.getBoundingClientRect();
    P.cx=clampN((ev.clientX-r.left)/r.width*RUN.mapSize,0,RUN.mapSize); P.cy=clampN((ev.clientY-r.top)/r.height*RUN.mapSize,0,RUN.mapSize);
    P.free=true; P.refreshBtns();
  });
  window.addEventListener('resize',()=>{ if(P.on) resizeCanvas(); });
})();
})();

/* Повтори / перегляд: підключення до навігації */

(function(){
const {REC, encode, decode, RDB, RPUI} = window.__NEOW_RP;
const P=REPLAY;   // стан перегляду повтору (replays/replay_state.js)
window.__NEOW_REPLAY={REC,RDB,RPUI,decode,encode};   // для налагодження
const _goto=window.goto_;
window.goto_=function(name){
  if(P.on&&name!=='battle') P.close();
  const r=_goto.apply(this,arguments);
  if(name==='replays') RPUI.render();
  return r;
};
})();

/* Повтори / перегляд: плеєр повтору */

(function(){

const {$, esc, num, clampN, STRIDE, TWO_PI, DSTATES, LEADERS, pad2, fmtTime, fmtDate} = window.__NEOW_RP;
/* =====================================================================
   ПЛЕЄР ПОВТОРУ — використовує той самий екран бою й той самий render()
   ===================================================================== */
const P=REPLAY;
Object.assign(P,{playing:true,speed:1,t:0,total:0,d:null,ents:[],i0:0,raf:0,last:0,uiAt:0,logIdx:-2,drag:false,prevRun:null});

function findFrame(t){
  const T=P.d.times,n=P.d.frames;
  let i=Math.min(P.i0,n-1);
  if(T[i]<=t){ while(i+1<n&&T[i+1]<=t) i++; }
  else{ let lo=0,hi=i; while(lo<hi){ const mid=(lo+hi+1)>>1; if(T[mid]<=t) lo=mid; else hi=mid-1; } i=lo; }
  return P.i0=i;
}
function upper(arr,t,idx){ let lo=0,hi=arr.length; while(lo<hi){ const mid=(lo+hi)>>1; if(arr[mid][idx]<=t) lo=mid+1; else hi=mid; } return lo; }   // перший елемент з часом > t

function applyTime(t){
  const d=P.d,N=d.N,i=findFrame(t),j=Math.min(i+1,d.frames-1);
  const t0=d.times[i],t1=d.times[j],f=t1>t0?clampN((t-t0)/(t1-t0),0,1):0,s=f<0.5?i:j;
  const D=d.data,a=i*N*STRIDE,b=j*N*STRIDE,c=s*N*STRIDE;
  for(let n=0;n<N;n++){
    const e=P.ents[n],ka=a+n*STRIDE,kb=b+n*STRIDE,ks=c+n*STRIDE;
    e.x=(D[ka]+(D[kb]-D[ka])*f)/10; e.y=(D[ka+1]+(D[kb+1]-D[ka+1])*f)/10;
    let da=(D[kb+2]-D[ka+2])/1000; if(da>Math.PI)da-=TWO_PI; else if(da<-Math.PI)da+=TWO_PI;
    e.angle=D[ka+2]/1000+da*f;
    e.hp=(D[ka+3]+(D[kb+3]-D[ka+3])*f)/10;
    const fl=D[ks+4];
    e.dead=!!(fl&1); e.downed=!!(fl&2); e.reloading=!!(fl&4); e.droneState=DSTATES[(fl>>3)&3]||'idle'; e.scoped=false;
    const wk=d.keys[D[ks+5]]; e.weaponKey=WEAPONS[wk]?wk:CLASSES[e.cls].weapons[0];
    e.shotT=D[ks+6]/100; e.itemCd=D[ks+7]/10; e.abilityCd=D[ks+8]/10; e.reloadT=D[ks+9]/100;
    e.stunT=D[ks+10]/100; e.speedBuffT=D[ks+11]/10; e.droneTimer=D[ks+12]/100;
    e.droneX=(D[ka+13]+(D[kb+13]-D[ka+13])*f)/10; e.droneY=(D[ka+14]+(D[kb+14]-D[ka+14])*f)/10;
  }
  const H=d.hdr,hi=i*4,hj=j*4;
  RUN.captureHold.ally=(H[hi]+(H[hj]-H[hi])*f)/10; RUN.captureHold.enemy=(H[hi+1]+(H[hj+1]-H[hi+1])*f)/10;
  RUN.captureLeader=LEADERS[H[hi+2]]||null; RUN.timeLeft=d.meta.totalTime-t;
  // кулі: пряма від точки появи з постійною швидкістю до часу зникнення
  const te=t+0.001;   // Float32-час кадру може бути трохи меншим за точний час події
  const B=d.bullets,bl=[],bTop=upper(B,te,0),minTs=t-d.maxLife-0.1;
  for(let k=bTop-1;k>=0;k--){
    const bb=B[k]; if(bb[0]<minTs) break;
    if(bb[1]>=0&&te>bb[1]) continue;
    const sp=bb[6]*Math.max(0,t-bb[0]);
    bl.push({x:bb[2]+bb[4]*sp,y:bb[3]+bb[5]*sp,weaponKey:d.keys[bb[7]],team:bb[8]?'enemy':'ally'});
  }
  RUN.bullets=bl;
  RUN.mines=d.mines.filter(m=>te>=m[0]&&(m[1]<0||te<m[1])).map(m=>({x:m[2],y:m[3],team:m[4]?'enemy':'ally'}));
  const pl=[],pTop=upper(d.parts,te,0);
  for(let k=pTop-1;k>=0;k--){ const p=d.parts[k]; if(p[0]<t-0.4) break; pl.push({x:p[1],y:p[2],r:p[3],t:Math.max(0,t-p[0]),life:0.4,color:'#f97316'}); }
  RUN.particles=pl;
  RUN.mortarMarkers=d.markers.filter(m=>te>=m[0]&&t-m[0]<m[3]+0.15).map(m=>({x:m[1],y:m[2],team:m[4]?'enemy':'ally',t:Math.max(0,t-m[0]),dur:m[3]}));
  RUN.player=P.ents[P.sel>=0?P.sel:0];
}

P.seek=function(t){
  t=clampN(t,0,P.total);
  if(Math.abs(t-P.t)>0.4) P.ents.forEach(e=>{ e._an=null; });   // скидаємо анімації, щоб після перемотки не було «стрибків»
  P.t=t;
  if(t>=P.total) P.playing=false;
};
P.setPlaying=function(v){
  if(v&&P.t>=P.total-0.05) P.seek(0);
  P.playing=v; P.refreshBtns();
};
P.setSpeed=function(s){ P.speed=s; P.refreshBtns(); };
P.follow=function(i){ P.sel=i; P.free=false; P.refreshBtns(); };
P.toggleFree=function(){
  if(P.free){ P.free=false; }
  else{ P.cx=camX+CW/currentZoom/2; P.cy=camY+CH/currentZoom/2; P.free=true; }
  P.refreshBtns();
};
P.cycle=function(dir){
  const n=P.ents.length; let i=P.sel;
  for(let k=0;k<n;k++){ i=(i+dir+n)%n; if(!P.ents[i].dead) break; }
  P.follow(i);
};
P.refreshBtns=function(){
  $('rpPlay').textContent=(P.t>=P.total-0.05&&!P.playing)?'↻':(P.playing?'⏸':'▶');
  document.querySelectorAll('#rpSpeeds .rp-btn').forEach(b=>b.classList.toggle('on',+b.dataset.s===P.speed));
  $('rpFollow').textContent=P.free?'🎯 Стежити':'🎥 Вільна камера';
  P.rows&&P.rows.forEach((r,i)=>r.classList.toggle('sel',!P.free&&i===P.sel));
};

P.build=function(){
  const m=P.d.meta,cls=CLASSES[m.playerCls];
  const w=m.winner==='ally'?'ПЕРЕМОГА':m.winner==='enemy'?'ПОРАЗКА':'НІЧИЯ';
  $('rpTitle').textContent=w;
  $('rpTitle').style.color=m.winner==='ally'?'#a3e635':m.winner==='enemy'?'#ef4444':'#e5e7eb';
  $('rpSub').innerHTML=esc(m.mapIcon+' '+m.mapName)+' · '+esc(m.sizeLabel)+'<br>'+esc(m.modeLabel)+' · '+esc(cls.icon+' '+cls.name)+'<br>'+esc(fmtDate(m.ts))+' · '+fmtTime(m.duration)+' · ураження '+num(m.killsA)+' : '+num(m.killsE);
  const roster=$('rpRoster'); roster.innerHTML=''; P.rows=[];
  ['ally','enemy'].forEach(team=>{
    const h=document.createElement('div'); h.className='muted'; h.style.cssText='font-size:.6rem;letter-spacing:.12em;margin:8px 0 3px;color:'+(team==='ally'?'var(--ally)':'var(--enemy)');
    h.textContent=team==='ally'?'СОЮЗНІ':'ВОРОГИ'; roster.appendChild(h);
    P.ents.forEach((e,i)=>{
      if(e.team!==team) return;
      const c=CLASSES[e.cls],r=document.createElement('div'); r.className='rpr'; r.dataset.i=i;
      r.innerHTML='<span style="color:'+c.color+';width:16px;text-align:center;flex:none;">'+c.icon+'</span><span class="nm">'+esc(c.name)+(e.isPlayer?' <b style="color:var(--primary)">ВИ</b>':'')+'</span><span class="hp"><i style="background:'+(team==='ally'?'var(--ally)':'var(--enemy)')+'"></i></span><span class="st"></span>';
      roster.appendChild(r); P.rows[i]=r;
    });
  });
  const ev=$('rpEvents'); ev.innerHTML=''; P.evRows=[];
  P.d.log.forEach((l,k)=>{
    const r=document.createElement('div'); r.className='rpe'; r.dataset.t=l[0];
    const b=document.createElement('b'); b.textContent=fmtTime(l[0]); const sp=document.createElement('span'); sp.textContent=l[1];
    r.appendChild(b); r.appendChild(sp); ev.appendChild(r); P.evRows[k]=r;
  });
  const marks=$('rpMarks'); marks.innerHTML='';
  P.d.log.forEach(l=>{ if(l[0]<=0) return; const i=document.createElement('i'); i.style.left=(l[0]/P.total*100)+'%'; if(/підбитий|вибув|Міна знищила/.test(l[1])) i.className='k'; marks.appendChild(i); });
  $('rpSeek').max=Math.round(P.total*10); $('rpSeek').value=0;
};
$('rpEvents').addEventListener('click',ev=>{ const r=ev.target.closest('.rpe'); if(r&&P.on){ P.seek(Math.max(0,+r.dataset.t-2)); P.setPlaying(true); } });
$('rpRoster').addEventListener('click',ev=>{ const r=ev.target.closest('.rpr'); if(r&&P.on) P.follow(+r.dataset.i); });

P.updateUI=function(now){
  if(now-P.uiAt<120) return; P.uiAt=now;
  $('rpTime').textContent=fmtTime(P.t)+' / '+fmtTime(P.total);
  if(!P.drag) $('rpSeek').value=Math.round(P.t*10);
  const mm=Math.max(0,RUN.timeLeft); $('matchClock').textContent=pad2(Math.floor(mm/60))+':'+pad2(Math.floor(mm%60));
  let aa=0,ee=0;
  P.ents.forEach((e,i)=>{
    const alive=!e.dead&&!e.downed; if(e.team==='ally'&&alive) aa++; else if(e.team==='enemy'&&alive) ee++;
    const r=P.rows[i]; if(!r) return;
    r.classList.toggle('dead',e.dead||e.downed);
    r.querySelector('.hp i').style.width=(e.dead?0:clampN(e.hp/e.maxHp*100,0,100))+'%';
    r.querySelector('.st').textContent=e.dead?'✖':(e.downed?'⚠':'');
  });
  const ts=P.d.meta.teamSize||P.ents.filter(e=>e.team==='ally').length;
  $('rpAllyCnt').textContent=aa+'/'+ts; $('rpEnemyCnt').textContent=ee+'/'+ts;
  $('rpAllyBar').style.width=clampN(aa/ts*100,0,100)+'%'; $('rpEnemyBar').style.width=clampN(ee/ts*100,0,100)+'%';
  const hold=Math.max(RUN.captureHold.ally,RUN.captureHold.enemy);
  const cb=$('rpCapBar'); cb.style.width=clampN(hold/POINT_HOLD_TARGET*100,0,100)+'%';
  cb.style.background=RUN.captureLeader==='ally'?'#3b82f6':RUN.captureLeader==='enemy'?'#ef4444':'#a3e635';
  $('rpCapLabel').textContent=RUN.captureLeader==='ally'?'Союзники':RUN.captureLeader==='enemy'?'Вороги':RUN.captureLeader==='contested'?'Бій за точку':'Вільна';
  // стрічка подій на полотні + підсвітка в списку
  const li=upper(P.d.log,P.t+0.001,0)-1;
  if(li!==P.logIdx){
    if(P.evRows[P.logIdx]) P.evRows[P.logIdx].classList.remove('cur');
    P.logIdx=li;
    if(P.evRows[li]){ P.evRows[li].classList.add('cur'); }
    const feed=$('logfeed'); feed.innerHTML='';
    for(let k=Math.max(0,li-5);k<=li;k++){ const dv=document.createElement('div'); dv.textContent='› '+P.d.log[k][1]; feed.appendChild(dv); }
  }
};

function loop(now){
  if(!P.on) return;
  const dt=Math.min(0.1,(now-P.last)/1000); P.last=now;
  if(P.playing){
    P.t+=dt*P.speed;
    if(P.t>=P.total){ P.t=P.total; P.playing=false; P.refreshBtns(); }
  }
  const minZ=Math.max(0.2,Math.max(CW,CH)/RUN.mapSize);
  P.zoom=clampN(P.zoom,minZ,1.8);
  applyTime(P.t);
  render();
  P.updateUI(now);
  P.raf=requestAnimationFrame(loop);
}

P.start=function(rep){
  if(P.on) P.close();
  const m=rep.meta;
  Object.assign(P,{d:rep,t:0,total:Math.max(0.1,rep.times[rep.frames-1]),playing:true,speed:1,free:false,zoom:1,i0:0,logIdx:-2,drag:false});
  P.prevRun=RUN;
  P.ents=rep.ents.map(en=>({
    id:en.id,team:en.team,cls:en.cls,isPlayer:en.isPlayer,x:0,y:0,angle:0,radius:15,hp:en.maxHp,maxHp:en.maxHp,
    weapons:CLASSES[en.cls].weapons.slice(),weaponKey:CLASSES[en.cls].weapons[0],downed:false,dead:false,reloading:false,reloadT:0,shotT:0,
    itemCd:0,abilityCd:0,stunT:0,speedBuffT:0,droneState:'idle',droneTimer:0,droneX:0,droneY:0,droneReveal:0,scoped:false,kills:0,
    ammoMag:0,ammoReserve:0,ammoCache:{}
  }));
  const me=P.ents.find(e=>e.isPlayer)||P.ents.find(e=>e.team==='ally')||P.ents[0];
  RUN={
    active:false,replay:true,mapKey:m.mapKey,sizeInfo:{size:m.mapSize,time:m.totalTime,label:m.sizeLabel},playerCls:m.playerCls,
    mapSize:m.mapSize,timeLeft:m.totalTime,radarTimer:0,radarActive:0,entities:P.ents,bullets:[],mines:[],particles:[],mortarMarkers:[],
    captureHold:{ally:0,enemy:0},captureLeader:null,baseHold:{ally:0,enemy:0},ended:false,seed:m.seed||0,
    allyBase:{x:+m.allyBase.x,y:+m.allyBase.y},enemyBase:{x:+m.enemyBase.x,y:+m.enemyBase.y},capture:{x:+m.capture.x,y:+m.capture.y},capRadius:m.capRadius,
    covers:rep.covers,swamps:rep.swamps,player:me
  };
  P.sel=P.ents.indexOf(me);
  goto_('battle');               // REPLAY.on ще false — звичайний перехід на екран бою
  P.on=true;
  $('screen-battle').classList.add('replay-mode');
  $('hud').style.display='none'; $('replayPanel').style.display='';
  $('battleGrid').style.gridTemplateColumns='1fr 300px';
  $('opLabel').textContent='ПОВТОР: '+m.mapName.toUpperCase()+' // MAP '+m.mapSize+' // '+m.modeLabel;
  $('logfeed').innerHTML='';
  P.build();
  resizeCanvas();
  P.refreshBtns();
  P.last=performance.now(); P.uiAt=0;
  applyTime(0);
  P.raf=requestAnimationFrame(loop);
};
P.close=function(){
  if(!P.on) return;
  P.on=false; cancelAnimationFrame(P.raf);
  RUN=P.prevRun||{active:false}; P.prevRun=null;
  $('screen-battle').classList.remove('replay-mode');
  $('hud').style.display=''; $('replayPanel').style.display='none';
  $('logfeed').innerHTML=''; $('opLabel').textContent='ОПЕРАЦІЯ: FRONTLINE';
  P.d=null; P.ents=[]; P.rows=[]; P.evRows=[];
};
P.exit=function(){ goto_('replays'); };
})();
