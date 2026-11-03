/* Вміння персонажів (ABILITIES) */
"use strict";

/* ---------- ДАНІ: ЗДІБНОСТІ ---------- */
const ABILITIES = {
  piercing_shot:{name:'Наскрізний постріл',desc:'Якщо вбивчий постріл у прицілі завдає більше урону, ніж було в цілі HP — надлишок урону летить далі й вражає наступного на лінії пострілу.',passive:true},
  heavy_armor:{name:'Важка броня',desc:'Мінімальний отриманий урон 0.5 (замість 1). Впритул (0-5px) урону не отримує взагалі.',passive:true},
  map_adapted:{name:'Пристосований',desc:'Дебафи карти на нас не діють: не сповільнюється у болотах/воді, ігнорує від\u2019ємні модифікатори карти (швидкість/броня/маскування/дальність огляду) - бонуси карти лишаються.',passive:true},
  splash_stun:{name:'Приголомшення вибухом',desc:'Вибухи гранатомета оглушують противника на 0,5 с: він майже не рухається й не може стріляти.',passive:true},
  heal_revive:{name:'Аура лікування / Порятунок',desc:'Лікує союзників поруч і рятує підбитих.',cd:30},
  drone:{name:'Розвідувальний дрон',desc:'Нерухомість під час керування. Радіус виявлення 600 навколо дрона, керування в межах 50 від бійця.',cd:20},
  mortar_reveal:{name:'Демаскування пострілом',desc:'Маскування падає після пострілу з міномета.',passive:true}
};
/* Вміння: застосування здібності (E) */

/* ---------- ЗДІБНОСТІ ТА ПРЕДМЕТИ ---------- */
function tryAbility(e){
  if(e.downed||e.dead) return;
  const ab = CLASSES[e.cls].ability;
  if(ab==='heal_revive'){
    if(e.abilityCd>0) return;
    e.abilityCd = ABILITIES.heal_revive.cd;
    let did=false;
    RUN.entities.forEach(t=>{
      if(t.team===e.team && t!==e && dist(e,t)<110){
        if(t.downed){ t.downed=false; t.hp=Math.round(t.maxHp*0.5); did=true; pushLog(`Медик врятував союзника (${CLASSES[t.cls].name}).`); SND.heal(); }
        else if(!t.dead && t.hp<t.maxHp){ t.hp=Math.min(t.maxHp,t.hp+30); did=true; }
      }
    });
    if(!e.dead && e.hp<e.maxHp){ e.hp=Math.min(e.maxHp,e.hp+15); did=true; }
    if(did){ SND.heal(); spawnParticle(e.x,e.y,'#4ade80'); if(e.isPlayer) toast('Аура лікування активована'); }
    else if(e.isPlayer) toast('Немає кого лікувати поруч');
  } else if(ab==='drone'){
    if(e.droneState==='idle'){
      if(e.abilityCd>0){ if(e.isPlayer) toast('Дрон ще перезаряджається: '+Math.ceil(e.abilityCd)+'с'); return; }
      e.droneState='launching'; e.droneTimer=DRONE_LAUNCH_T; e.droneX=e.x; e.droneY=e.y;
      if(e.isPlayer) toast('Запуск дрона... '+DRONE_LAUNCH_T+'с нерухомості');
      pushLog(`${teamLabel(e.team)} розвідник запускає дрон.`);
    } else {
      recallDrone(e);
    }
  } else if(e.isPlayer){
    toast('Пасивна здібність: ' + ABILITIES[ab].name);
  }
}
/* Вміння: дрон розвідника, радар, приблизне виявлення */

function recallDrone(e){
  e.droneState='idle'; e.droneTimer=0;
  e.abilityCd = ABILITIES.drone.cd;
  if(e.isPlayer) toast('Дрон повернуто');
  pushLog(`${teamLabel(e.team)} розвідник повернув дрон.`);
}
/* Поки дрон у повітрі ('piloting'), кожного кадру освітлює ворогів у радіусі
   DRONE_REVEAL_R навколо ПОЗИЦІЇ ДРОНА (не бійця): робить їх видимими на екрані/
   мінікарті та тимчасово знижує їхнє маскування на 20% (effectiveStealth). */
/* ---------- ПРИБЛИЗНЕ ВИЯВЛЕННЯ (маскування = похибка позиції) ----------
   1 маскування = 1px похибки в тому, де гра ПОКАЗУЄ бійця, коли його бачать не
   напряму (оком), а через сенсор (радар кожні 35с, дрон розвідника). Для дрона
   похибка вдвічі менша (0.5px/маскування), бо він точніший за загальний радар. */
function setFuzzyReport(e, source){
  const err = effectiveStealth(e) * RSCALE * (source==='drone' ? 0.5 : 1.0);
  const ang = Math.random()*Math.PI*2, rad = Math.random()*err;
  const rx = clamp(e.x+Math.cos(ang)*rad, 0, RUN.mapSize);
  const ry = clamp(e.y+Math.sin(ang)*rad, 0, RUN.mapSize);
  if(source==='drone'){ e.droneReportX=rx; e.droneReportY=ry; }
  else { e.radarReportX=rx; e.radarReportY=ry; }
}
// позиція, яку гра фактично показує для бійця, коли його не видно напряму
// (пріоритет — точніший дрон, потім радар, інакше справжня позиція)
function reportedPos(e){
  if(e.droneReveal>0 && e.droneReportX!=null) return {x:e.droneReportX,y:e.droneReportY};
  if(RUN.radarActive>0 && e.radarReportX!=null) return {x:e.radarReportX,y:e.radarReportY};
  return {x:e.x,y:e.y};
}
function updateDroneScans(dt){
  RUN.entities.forEach(e=>{
    if(e.dead || e.droneState!=='piloting') return;
    RUN.entities.forEach(t=>{
      if(t.team===e.team || t.dead) return;
      if(Math.hypot(t.x-e.droneX,t.y-e.droneY) <= DRONE_REVEAL_R){
        t.droneReveal = Math.max(t.droneReveal,0.35);
        t.droneReportTimer = (t.droneReportTimer||0) - dt;
        if(!(t.droneReportTimer>0)){
          setFuzzyReport(t,'drone');
          t.droneReportTimer = 1.0; // оновлення "приблизної" позиції раз на секунду
        }
      }
    });
  });
}
