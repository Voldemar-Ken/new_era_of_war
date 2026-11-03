/* Повтори / запис: рекордер бою (REC) */

(function(){
"use strict";
const {STRIDE, FRAME_DT, TWO_PI, DSTATES, LEADERS, q} = window.__NEOW_RP;
/* =====================================================================
   ЗАПИС БОЮ
   Позиції/стани бійців — кадрами по 10 Гц (Int16), кулі/міни/маркери/вибухи/лог —
   подіями з точним часом. Під час перегляду кадри інтерполюються.
   ===================================================================== */
const REC={on:false,sealed:false,T:0};
REC.begin=function(){
  const N=RUN.entities.length;
  Object.assign(REC,{
    on:true,sealed:false,T:0,next:FRAME_DT,N,frames:0,rid:0,maxLife:0,
    cap:Math.ceil((RUN.sizeInfo.time+15)/FRAME_DT)+20,
    keys:Object.keys(WEAPONS).concat(['__frag','__mortar_indirect']),
    bullets:[],liveB:new Map(),mines:[],liveM:new Map(),markers:[],liveK:new Set(),parts:[],log:[]
  });
  REC.data=new Int16Array(REC.cap*N*STRIDE);
  REC.times=new Float32Array(REC.cap);
  REC.hdr=new Int16Array(REC.cap*4);
  REC.ents=RUN.entities.map(e=>({id:e.id,team:e.team,cls:e.cls,isPlayer:!!e.isPlayer,maxHp:Math.round(e.maxHp*10)/10}));
  REC.covers=JSON.parse(JSON.stringify(RUN.covers||[]));
  REC.swamps=JSON.parse(JSON.stringify(RUN.swamps||[]));
  REC.log.push([0,'Місію розпочато. Клас: '+CLASSES[RUN.playerCls].name+'.']);
  REC.sample(0);
};
REC.kIdx=function(k){ let i=REC.keys.indexOf(k); if(i<0){ REC.keys.push(String(k)); i=REC.keys.length-1; } return i; };
REC.grow=function(){
  const nc=Math.ceil(REC.cap*1.5);
  const d=new Int16Array(nc*REC.N*STRIDE); d.set(REC.data); REC.data=d;
  const t=new Float32Array(nc); t.set(REC.times); REC.times=t;
  const h=new Int16Array(nc*4); h.set(REC.hdr); REC.hdr=h;
  REC.cap=nc;
};
REC.sample=function(T){
  if(REC.frames>=REC.cap) REC.grow();
  const f=REC.frames,d=REC.data,o=f*REC.N*STRIDE;
  for(let i=0;i<REC.N;i++){
    const e=RUN.entities[i],k=o+i*STRIDE;
    let a=(e.angle||0)%TWO_PI; if(a>Math.PI)a-=TWO_PI; else if(a<-Math.PI)a+=TWO_PI;
    const ds=Math.max(0,DSTATES.indexOf(e.droneState));
    d[k]=q(e.x,10); d[k+1]=q(e.y,10); d[k+2]=q(a,1000); d[k+3]=q(Math.max(0,e.hp),10);
    d[k+4]=(e.dead?1:0)|(e.downed?2:0)|(e.reloading?4:0)|(ds<<3);
    d[k+5]=REC.kIdx(e.weaponKey);
    d[k+6]=q(e.shotT||0,100); d[k+7]=q(e.itemCd||0,10); d[k+8]=q(e.abilityCd||0,10);
    d[k+9]=q(e.reloadT||0,100); d[k+10]=q(e.stunT||0,100); d[k+11]=q(e.speedBuffT||0,10);
    d[k+12]=q(e.droneTimer||0,100); d[k+13]=q(e.droneX||0,10); d[k+14]=q(e.droneY||0,10);
  }
  REC.times[f]=T;
  const h=f*4;
  REC.hdr[h]=q(RUN.captureHold.ally,10); REC.hdr[h+1]=q(RUN.captureHold.enemy,10);
  REC.hdr[h+2]=Math.max(0,LEADERS.indexOf(RUN.captureLeader)); REC.hdr[h+3]=RUN.radarActive>0?1:0;
  REC.frames++;
};
REC.pre=function(dt){ if(REC.on&&!REC.sealed){ REC.T+=dt; REC.dt=dt; } };
REC.post=function(){
  if(!REC.on||REC.sealed) return;
  const T=REC.T, Tr=Math.round(T*1000)/1000, r1=v=>Math.round(v*10)/10;
  // кулі (прямолінійний політ: достатньо точки появи, вектора і часу зникнення)
  const cur=new Set();
  for(const b of RUN.bullets){
    let id=b._rid;
    if(id===undefined){
      id=b._rid=++REC.rid;
      const rec=[Tr,-1,r1(b.x),r1(b.y),Math.round(b.dx*1e4)/1e4,Math.round(b.dy*1e4)/1e4,Math.round(b.spd),REC.kIdx(b.weaponKey),b.team==='enemy'?1:0];
      REC.bullets.push(rec); REC.liveB.set(id,rec);
    }
    cur.add(id);
  }
  for(const [id,rec] of REC.liveB){
    if(!cur.has(id)){ rec[1]=Tr; REC.liveB.delete(id); const life=Tr-rec[0]; if(life>REC.maxLife) REC.maxLife=life; }
  }
  // міни
  const curM=new Set();
  for(const m of RUN.mines){
    let id=m._rid;
    if(id===undefined){ id=m._rid=++REC.rid; const rec=[Tr,-1,r1(m.x),r1(m.y),m.team==='enemy'?1:0]; REC.mines.push(rec); REC.liveM.set(id,rec); }
    curM.add(id);
  }
  for(const [id,rec] of REC.liveM){ if(!curM.has(id)){ rec[1]=Tr; REC.liveM.delete(id); } }
  // маркери прильоту міномета
  for(const m of RUN.mortarMarkers){
    if(m._rid===undefined){ m._rid=++REC.rid; REC.markers.push([Math.round((T-m.t)*1000)/1000,r1(m.x),r1(m.y),Math.round(m.dur*1000)/1000,m.team==='enemy'?1:0]); }
  }
  const ended=!!RUN.ended;
  if(T+1e-9>=REC.next||ended){ REC.sample(T); while(REC.next<=T+1e-9) REC.next+=FRAME_DT; }
  if(ended) REC.seal(T);
};
REC.seal=function(T){
  const Tr=Math.round(T*1000)/1000;
  for(const [id,rec] of REC.liveB){ rec[1]=Tr; const life=Tr-rec[0]; if(life>REC.maxLife) REC.maxLife=life; }
  REC.liveB.clear(); REC.sealed=true;
};
REC.finish=function(winner,reason){
  if(!REC.sealed){ REC.sample(REC.T); REC.seal(REC.T); }
  REC.on=false;
  const kills=t=>RUN.entities.filter(e=>e.team===t).reduce((s,e)=>s+(e.kills||0),0);
  const pl=RUN.player;
  const meta={
    v:1,id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),ts:Date.now(),
    mapKey:RUN.mapKey,mapName:MAPS[RUN.mapKey].name,mapIcon:MAPS[RUN.mapKey].icon,
    sizeLabel:RUN.sizeInfo.label,mapSize:RUN.mapSize,totalTime:RUN.sizeInfo.time,duration:Math.round(REC.T*10)/10,
    modeLabel:GAME_MODE.label,teamSize:GAME_MODE.teamSize,playerCls:RUN.playerCls,
    online:!!VIA_ONLINE,diff:VIA_ONLINE?'':(DIFFICULTY&&DIFFICULTY.label||''),
    winner,reason,killsA:kills('ally'),killsE:kills('enemy'),
    myKills:pl?(pl.kills||0):0,myDmg:Math.round(pl&&pl._st?pl._st.dmg:0),
    allyBase:RUN.allyBase,enemyBase:RUN.enemyBase,capture:RUN.capture,capRadius:RUN.capRadius,seed:RUN.seed
  };
  return {
    meta,ents:REC.ents,keys:REC.keys,covers:REC.covers,swamps:REC.swamps,
    bullets:REC.bullets,mines:REC.mines,markers:REC.markers,parts:REC.parts,log:REC.log,
    maxLife:Math.round(REC.maxLife*1000)/1000,
    frames:REC.frames,N:REC.N,times:REC.times,hdr:REC.hdr,data:REC.data
  };
};
Object.assign(window.__NEOW_RP,{REC});
})();

/* Повтори / запис: підключення рекордера до гри */

(function(){
const {REC} = window.__NEOW_RP;
/* --- підключення до гри --- */
const _startMatch=window.startMatch;
window.startMatch=function(){ const r=_startMatch.apply(this,arguments); try{ REC.begin(); }catch(err){ REC.on=false; console.error('replay begin',err); } return r; };
const _update=window.update;
window.update=function(dt){
  const was=RUN&&RUN.ended;
  if(!was){ try{ REC.pre(dt); }catch(e){} }
  _update(dt);
  if(!was){ try{ REC.post(); }catch(err){ REC.on=false; console.error('replay tick',err); } }
};
const _pushLog=window.pushLog;
window.pushLog=function(t){ if(REC.on&&!REC.sealed) REC.log.push([Math.round(REC.T*10)/10,String(t)]); return _pushLog.apply(this,arguments); };
const _spawnParticle=window.spawnParticle;
window.spawnParticle=function(x,y,color,r){ if(REC.on&&!REC.sealed) REC.parts.push([Math.round((REC.T-(REC.dt||0))*100)/100,Math.round(x),Math.round(y),Math.round(r||30)]); return _spawnParticle.apply(this,arguments); };
const _stopMatch=window.stopMatch;
window.stopMatch=function(){ REC.on=false; return _stopMatch.apply(this,arguments); };   // перерваний бій (Esc / «Завершити місію») не зберігається
})();
