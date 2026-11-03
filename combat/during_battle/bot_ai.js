/* Під час бою: ШІ ботів */
"use strict";

/* ---------- ШІ БОТІВ ---------- */
const COVER_SEEKERS = ['sniper','mortarman','fpv','medic','grenadier'];
function updateBot(e,dt){
  if(e.downed) return;
  if(e.droneState!=='idle'){
    // тіло бота нерухоме, поки він керує дроном — але може відстрілюватись
    if(e.droneState==='launching'){
      e.droneTimer-=dt; e.droneX=e.x; e.droneY=e.y;
      if(e.droneTimer<=0){ e.droneState='piloting'; e.droneTimer=DRONE_BOT_DURATION; }
    } else {
      // бот тримає дрон у повітрі обмежений час, потім автоматично повертає його
      e.droneTimer-=dt;
      if(e.droneTimer<=0) recallDrone(e);
    }
    const enemies = RUN.entities.filter(t=>t.team!==e.team && !t.dead && !t.downed);
    let target=null, bestD=Infinity;
    enemies.forEach(t=>{ const d=dist(e,t); if(canSee(e,t) && d<bestD){ bestD=d; target=t; } });
    if(target){
      e.angle = Math.atan2(target.y-e.y, target.x-e.x);
      const w=WEAPONS[e.weaponKey], r=wRange(w);
      if(bestD<=r.maxR*1.05 && hasLineOfSight(e,target)) tryShoot(e);
      if(!w.melee && e.ammoMag<=0 && !e.reloading) tryReload(e);
    }
    e.standStill+=dt;
    return;
  }
  const w = WEAPONS[e.weaponKey];
  const r = wRange(w);
  const enemies = RUN.entities.filter(t=>t.team!==e.team && !t.dead && !t.downed);
  let target=null, bestD=Infinity;
  enemies.forEach(t=>{
    const d=dist(e,t);
    if(canSee(e,t) && d<bestD){ bestD=d; target=t; }
  });

  let moveX=0,moveY=0, wantShoot=false;

  if(target){
    e.state='engage';
    e.angle = Math.atan2(target.y-e.y, target.x-e.x);
    const wantsCover = e.hp < e.maxHp*0.55 || COVER_SEEKERS.includes(e.cls);
    let handled=false;
    if(wantsCover){
      const cov = nearestCover(e.x,e.y, Math.min(520, r.maxR*0.9));
      if(cov){
        // стати з протилежного від ворога боку укриття
        const awayA = Math.atan2(e.y-target.y, e.x-target.x);
        const rad = (cov.r||Math.max(cov.w||0,cov.h||0)/2)+30;
        const standX = cov.x+Math.cos(awayA)*rad, standY = cov.y+Math.sin(awayA)*rad;
        const dCover = Math.hypot(e.x-standX, e.y-standY);
        if(dCover>28){ moveX=(standX-e.x)/dCover; moveY=(standY-e.y)/dCover; handled=true; }
        else { moveX=0; moveY=0; handled=true; } // вже в укритті — стоїмо й стріляємо
      }
    }
    if(!handled){
      if(bestD > r.maxR*0.85){ moveX=Math.cos(e.angle); moveY=Math.sin(e.angle); }
      else if(r.minR>0 && bestD < r.minR*0.7){ moveX=-Math.cos(e.angle); moveY=-Math.sin(e.angle); }
      else if(!['sniper','mortarman','grenadier'].includes(e.cls)){ moveX=Math.cos(e.angle)*0.2; moveY=Math.sin(e.angle)*0.2; }
    }
    if(bestD <= r.maxR*1.05 && hasLineOfSight(e,target)) wantShoot=true;
  } else {
    e.state='patrol';
    if(!e.patrolTarget || dist(e,e.patrolTarget)<40){
      const cap = RUN.capture;
      let dest;
      if(Math.random()<0.55){ dest = {x:cap.x+rand(-160,160), y:cap.y+rand(-160,160)}; }
      else { const base = e.team==='ally'?RUN.allyBase:RUN.enemyBase;
        dest = {x:clamp(base.x+rand(-260,260),40,RUN.mapSize-40), y:clamp(base.y+rand(-260,260),40,RUN.mapSize-40)}; }
      // рух від укриття до укриття замість прямої лінії по відкритому простору
      const step = nearestCover((e.x+dest.x)/2,(e.y+dest.y)/2, 260);
      e.patrolTarget = (step && Math.random()<0.6) ? {x:step.x+rand(-20,20),y:step.y+rand(-20,20)} : dest;
    }
    const a = Math.atan2(e.patrolTarget.y-e.y, e.patrolTarget.x-e.x);
    e.angle=a; moveX=Math.cos(a); moveY=Math.sin(a);
  }

  // медик-бот: пріоритетно лікує/рятує
  if(CLASSES[e.cls].ability==='heal_revive'){
    let downedAlly=null, hurtAlly=null, bestHurt=1e9;
    RUN.entities.forEach(t=>{
      if(t.team===e.team && t!==e){
        if(t.downed && !downedAlly && dist(e,t)<450) downedAlly=t;
        if(!t.dead && !t.downed && t.hp<t.maxHp*0.6 && dist(e,t)<450 && t.hp<bestHurt){ hurtAlly=t; bestHurt=t.hp; }
      }
    });
    const goal = downedAlly||hurtAlly;
    if(goal && !target){
      const d=dist(e,goal);
      if(d>90){ e.angle=Math.atan2(goal.y-e.y,goal.x-e.x); moveX=Math.cos(e.angle); moveY=Math.sin(e.angle); }
      else if(e.abilityCd<=0){ tryAbility(e); }
    }
  }

  if(isRooted(e)){            // з міномета в руках не рухається; без цілі бот перемикається на зброю для ходьби
    moveX=0; moveY=0;
    if(!target){ const wk=e.weapons.find(k=>!(WEAPONS[k].rooted)); if(wk){ e.weaponKey=wk; e.weaponIdx=e.weapons.indexOf(wk); } }
  }
  const sp = e.speed*(e.speedBuffT>0?1.5:1) * (inSwamp(e)&&CLASSES[e.cls].ability!=='map_adapted'?0.45:1) * (e.stunT>0?0.2:1);
  const len=Math.hypot(moveX,moveY);
  if(len>0.01){
    moveX/=len; moveY/=len;
    moveEntity(e, e.x+moveX*sp*dt, e.y+moveY*sp*dt);
    e.standStill=0;
  } else e.standStill+=dt;

  if(wantShoot && e.stunT<=0 && Math.random()<(e.team==='enemy'?DIFFICULTY.fireChance:0.9)) tryShoot(e);
  if(e.ammoMag<=0 && !e.reloading && e.stunT<=0) tryReload(e);

  // випадкове застосування предметів ботами
  if(CLASSES[e.cls].item && e.itemCd<=0 && target && Math.random()<0.01){
    if(CLASSES[e.cls].item==='frag' && bestD<300) tryItem(e);
    if(CLASSES[e.cls].item==='mine' && !target) tryItem(e);
    if(CLASSES[e.cls].item==='energy' && e.hp<e.maxHp*0.7) tryItem(e);
  }
  if(CLASSES[e.cls].ability==='drone' && e.abilityCd<=0 && Math.random()<0.003) tryAbility(e);
}
