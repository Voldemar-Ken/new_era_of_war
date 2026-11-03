/* Після бою: завершення матчу та екран результату */
"use strict";

function finishMatch(winner,reason){
  RUN.ended=true;
  setTimeout(()=>showEndScreen(winner,reason), 400);
}
function endMission(){ stopMatch(true); goto_('menu'); }
function stopMatch(navigate){
  RUN.active=false;
  if(navigate){ /* нічого */ }
}

function showEndScreen(winner,reason){
  RUN.active=false;
  recordMatchStats(winner);
  const primaryBtn = document.getElementById('endPrimaryBtn');
  if(VIA_ONLINE){ primaryBtn.textContent='Новий пошук бою'; primaryBtn.onclick=()=>goto_('searching'); }
  else { primaryBtn.textContent='Нова операція'; primaryBtn.onclick=()=>goto_('map'); }
  const titleEl=document.getElementById('endTitle');
  const subEl=document.getElementById('endSub');
  const playerWon = winner==='ally';
  titleEl.textContent = winner==='draw' ? 'НІЧИЯ' : (playerWon?'ПЕРЕМОГА':'ПОРАЗКА');
  titleEl.style.color = winner==='draw' ? '#e5e7eb' : (playerWon?'#a3e635':'#ef4444');
  const reasons = {
    elimination:'Знищено весь склад противника.',
    capture:'Центральну точку утримано '+POINT_HOLD_TARGET+'с поспіль.',
    base:'Ворожу базу захоплено.',
    'timeout-hold':'Час вийшов — перемогла команда, що утримувала точку.',
    'timeout-count':'Час вийшов — перемогла команда з більшою кількістю бійців.',
    'timeout-draw':'Час вийшов — сили рівні.'
  };
  subEl.textContent = reasons[reason]||'';
  const aliveAlly = RUN.entities.filter(e=>e.team==='ally'&&!e.dead).length;
  const aliveEnemy = RUN.entities.filter(e=>e.team==='enemy'&&!e.dead).length;
  const kills = RUN.player? (RUN.player.kills||0):0;
  document.getElementById('endStats').innerHTML = `
    <div class="hud-grid" style="grid-template-columns:1fr 1fr;font-size:.85rem;gap:14px;">
      <div class="hud-stat"><b>${MAPS[RUN.mapKey].name}</b><br><span class="muted">Карта</span></div>
      <div class="hud-stat"><b>${RUN.sizeInfo.label}</b><br><span class="muted">Розмір</span></div>
      <div class="hud-stat"><b>${CLASSES[RUN.playerCls].name}</b><br><span class="muted">Ваш клас</span></div>
      <div class="hud-stat"><b>${kills}</b><br><span class="muted">Ваші підтверджені ураження</span></div>
      <div class="hud-stat"><b style="color:var(--ally)">${aliveAlly}/${GAME_MODE.teamSize}</b><br><span class="muted">Союзники живі</span></div>
      <div class="hud-stat"><b style="color:var(--enemy)">${aliveEnemy}/${GAME_MODE.teamSize}</b><br><span class="muted">Вороги живі</span></div>
    </div>`;
  goto_('end');
}
/* Статистика після бою: таблиця, рейтинг, MVP */

/* NEW ERA OF WAR — статистика після бою (двоколонкова таблиця з рейтингом і MVP) */
(function(){
const ST=e=>e._st||(e._st={dmg:0,taken:0,deaths:0,assists:0,point:0,hits:{}});
const _deal=window.dealDamage;
window.dealDamage=function(t,d,a,at){
  const hp0=t.hp,dn0=t.downed,r=_deal(t,d,a,at);
  const lost=Math.max(0,hp0-Math.max(0,t.hp));
  if(lost>0){ST(t).taken+=lost;if(a&&a.team!==t.team){ST(a).dmg+=lost;ST(t).hits[a.id]=RUN.timeLeft;}}
  if(!dn0&&t.downed){
    const S=ST(t);S.deaths++;
    for(const id in S.hits){if(!(a&&+id===a.id)&&S.hits[id]-RUN.timeLeft<8){const o=RUN.entities.find(x=>x.id==id);if(o)ST(o).assists++;}}
  }
  return r;
};
const _upd=window.update;
window.update=function(dt){
  _upd(dt);
  if(RUN&&RUN.entities&&!RUN.ended&&RUN.capture){
    const c=RUN.capture,R=RUN.capRadius;
    RUN.entities.forEach(e=>{if(!e.dead&&!e.downed&&Math.hypot(e.x-c.x,e.y-c.y)<R)ST(e).point+=dt;});
  }
};
const rate=(e,S)=>Math.max(0,Math.min(20,3.5+(e.kills||0)*1.3+S.assists*.7-S.deaths*1+S.dmg/380+S.point/25));
const nm=(e,i,team)=>{
  if(e.isPlayer)return 'Боєць';
  const L=(typeof SEARCH_NAMES!=='undefined')?SEARCH_NAMES:[];
  return (L.length?L[(i*2+(team==='ally'?0:1))%L.length]:('Бот '+(i+1))).trim();
};
const fmt=n=>Math.round(n).toLocaleString('uk-UA').replace(/\u00a0/g,' ');
let DATA=null,TAB='dmg';
function collect(winner){
  const out={};
  ['ally','enemy'].forEach(t=>{
    const list=RUN.entities.filter(e=>e.team===t).map((e,i)=>{const S=ST(e);return {e,S,k:e.kills||0,name:nm(e,i,t),r:rate(e,S)};});
    list.sort((a,b)=>b.r-a.r);
    const sum=f=>list.reduce((s,o)=>s+f(o),0);
    out[t]={list,dmg:sum(o=>o.S.dmg),taken:sum(o=>o.S.taken),point:sum(o=>o.S.point),kills:sum(o=>o.k),assists:sum(o=>o.S.assists)};
  });
  DATA={teams:out,winner};
}
const pct=(v,t)=>t>0?Math.round(v/t*100):0;
const cell=(label,val,p,color)=>`<div class="sb-cell"><span class="sb-lbl">${label}</span><b>${val}</b><div class="sb-line"><div class="sb-bar"><i style="width:${Math.min(100,p)}%;background:${color}"></i></div><em>${p}%</em></div></div>`;
function row(o,team,tot,idx){
  const c=CLASSES[o.e.cls],S=o.S,me=o.e.isPlayer?' me':'';
  const mvp=idx===0?`<span class="sb-mvp ${(DATA.winner===team||DATA.winner==='draw')?'gold':'silver'}">MVP</span>`:'';
  const med=o.r>=9?'gold':o.r>=5?'silver':'bronze';
  const medal=`<div class="sb-rate"><div class="sb-medal ${med}">${med==='bronze'?'●':'⚔'}</div><b>${o.r.toFixed(1)}</b></div>`;
  let cols;
  if(TAB==='dmg'){
    const part=pct(o.k+S.assists,tot.kills);
    cols=cell('Шкода',fmt(S.dmg),pct(S.dmg,tot.dmg),'#e0507a')+cell('Отримано',fmt(S.taken),pct(S.taken,tot.taken),'#3aa7d9')+cell('Точка',Math.round(S.point)+' с',pct(S.point,tot.point),'#d9a93a')+cell('Участь',Math.min(100,part)+'%',Math.min(100,part),'#2fbf9b');
  }else{
    cols=`<div class="sb-cell kda"><span class="sb-lbl">У / С / П</span><b>${o.k} <u>${S.deaths}</u> ${S.assists}</b></div>`+cell('Шкода',fmt(S.dmg),pct(S.dmg,tot.dmg),'#e0507a')+medal;
  }
  return `<div class="sb-row ${team}${me}"><div class="sb-ava"><canvas width="46" height="46" data-cls="${o.e.cls}"></canvas></div><div class="sb-name"><b>${o.name}${mvp}</b><small style="color:${c.color}">${c.icon} ${c.name}</small></div>${cols}</div>`;
}
function paint(){
  const box=document.getElementById('scoreboard');if(!box||!DATA)return;
  const T=DATA.teams;
  box.innerHTML=`<div class="sb-cols"><div class="sb-team ally">${T.ally.list.map((o,i)=>row(o,'ally',T.ally,i)).join('')}</div><div class="sb-team enemy">${T.enemy.list.map((o,i)=>row(o,'enemy',T.enemy,i)).join('')}</div></div>`;
  box.querySelectorAll('canvas').forEach(cv=>{
    const cls=cv.dataset.cls,g=cv.getContext('2d'),SP=window.__SPRITES,d=SP&&SP.SNP[cls],im=SP&&SP.SNI[cls];
    g.fillStyle=CLASSES[cls].color+'33';g.fillRect(0,0,46,46);
    if(d&&im&&im.complete&&d.down&&d.down.length){
      const f=d.down[0],side=Math.min(f[2],f[3]*.62),sx=f[0]+Math.max(0,Math.min(f[2]-side,f[4]-side/2));
      g.imageSmoothingEnabled=false;g.drawImage(im,sx,f[1],side,side,0,0,46,46);
    }else{g.fillStyle=CLASSES[cls].color;g.font='22px sans-serif';g.textAlign='center';g.fillText(CLASSES[cls].icon,23,31);}
  });
  document.querySelectorAll('.sb-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===TAB));
}
window.sbTab=function(t){TAB=t;paint();};
const _show=window.showEndScreen;
window.showEndScreen=function(winner,reason){
  _show(winner,reason);
  try{
    collect(winner);TAB='dmg';
    document.getElementById('sbA').textContent=DATA.teams.ally.kills;
    document.getElementById('sbE').textContent=DATA.teams.enemy.kills;
    const el=Math.max(0,(RUN.sizeInfo.time||0)-Math.max(0,RUN.timeLeft)),mm=Math.floor(el/60),ss=Math.floor(el%60);
    document.getElementById('sbMeta').textContent=`${MAPS[RUN.mapKey].name} · ${RUN.sizeInfo.label} · ${GAME_MODE.label} · тривалість ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    paint();
  }catch(err){console.error('scoreboard',err);}
};
})();

/* Після бою: умови перемоги */

/* ---------- ПЕРЕМОГА/ПОРАЗКА ---------- */
const POINT_HOLD_TARGET = 100; // секунд безперервного утримання центральної точки для перемоги
const BASE_HOLD_TARGET = 20;   // секунд безперервного стояння на ворожій базі для перемоги
function checkWinConditions(){
  if(RUN.ended) return;
  // "мертвий" тут = вибув з бою (підбитий/downed або остаточно dead) — команда без жодного
  // боєздатного бійця вважається знищеною одразу, а не лише через 60с очікування
  const aliveAlly = RUN.entities.filter(e=>e.team==='ally' && !e.dead && !e.downed).length;
  const aliveEnemy = RUN.entities.filter(e=>e.team==='enemy' && !e.dead && !e.downed).length;

  if(aliveEnemy===0) return finishMatch('ally','elimination');
  if(aliveAlly===0) return finishMatch('enemy','elimination');
  if(RUN.captureHold.ally>=POINT_HOLD_TARGET) return finishMatch('ally','capture');
  if(RUN.captureHold.enemy>=POINT_HOLD_TARGET) return finishMatch('enemy','capture');
  if(RUN.baseHold.ally>=BASE_HOLD_TARGET) return finishMatch('ally','base');
  if(RUN.baseHold.enemy>=BASE_HOLD_TARGET) return finishMatch('enemy','base');
  if(RUN.timeLeft<=0){
    if(RUN.captureLeader==='ally') return finishMatch('ally','timeout-hold');
    if(RUN.captureLeader==='enemy') return finishMatch('enemy','timeout-hold');
    if(aliveAlly>aliveEnemy) return finishMatch('ally','timeout-count');
    if(aliveEnemy>aliveAlly) return finishMatch('enemy','timeout-count');
    return finishMatch('draw','timeout-draw');
  }
}
