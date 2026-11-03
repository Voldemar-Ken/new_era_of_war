/* Під час бою: точка захоплення та база */
"use strict";

/* ---------- ТОЧКА ЗАХОПЛЕННЯ ТА БАЗА ---------- */
function updateCapture(dt){
  const cap=RUN.capture;
  let a=0,b=0;
  RUN.entities.forEach(e=>{ if(!e.dead && !e.downed && dist(e,cap)<RUN.capRadius){ if(e.team==='ally') a++; else b++; } });
  if(a>0&&b===0){ RUN.captureHold.ally+=dt; RUN.captureHold.enemy=Math.max(0,RUN.captureHold.enemy-dt*2); RUN.captureLeader='ally'; }
  else if(b>0&&a===0){ RUN.captureHold.enemy+=dt; RUN.captureHold.ally=Math.max(0,RUN.captureHold.ally-dt*2); RUN.captureLeader='enemy'; }
  else { RUN.captureHold.ally=Math.max(0,RUN.captureHold.ally-dt*0.5); RUN.captureHold.enemy=Math.max(0,RUN.captureHold.enemy-dt*0.5); if(a===0&&b===0) RUN.captureLeader=null; else RUN.captureLeader='contested'; }
}
function updateBase(dt){
  let a=0,b=0;
  RUN.entities.forEach(e=>{ if(!e.dead && !e.downed && e.team==='ally' && dist(e,RUN.enemyBase)<130) a++; });
  RUN.entities.forEach(e=>{ if(!e.dead && !e.downed && e.team==='enemy' && dist(e,RUN.allyBase)<130) b++; });
  if(a>0) RUN.baseHold.ally+=dt; else RUN.baseHold.ally=Math.max(0,RUN.baseHold.ally-dt);
  if(b>0) RUN.baseHold.enemy+=dt; else RUN.baseHold.enemy=Math.max(0,RUN.baseHold.enemy-dt);
}
