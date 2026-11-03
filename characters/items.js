/* Предмети: застосування спорядження (Q) */
"use strict";

function tryItem(e){
  if(e.downed||e.dead) return;
  const itemKey = CLASSES[e.cls].item;
  if(!itemKey) { if(e.isPlayer) toast('У цього класу немає спорядження'); return; }
  if(e.itemCd>0) return;
  e.itemCd = ITEMS[itemKey].cd;
  if(itemKey==='mine'){
    RUN.mines.push({x:e.x,y:e.y,team:e.team,armed:0});
    if(e.isPlayer) toast('Міну встановлено');
  } else if(itemKey==='frag'){
    const wx=e.x+Math.cos(e.angle)*260, wy=e.y+Math.sin(e.angle)*260;
    RUN.bullets.push({x:e.x,y:e.y,dx:(wx-e.x)/260,dy:(wy-e.y)/260,spd:520,team:e.team,owner:e,weaponKey:'__frag',traveled:0,alive:true,life:260/520});
    if(e.isPlayer) toast('Граната кинута');
  } else if(itemKey==='energy'){
    e.speedBuffT=10; e.hp=Math.min(e.maxHp,e.hp+10);
    if(e.isPlayer) toast('Енергетик: +швидкість, +10 HP');
  } else if(itemKey==='medkit'){
    let target=e;
    RUN.entities.forEach(t=>{ if(t.team===e.team && t!==e && !t.dead && !t.downed && dist(e,t)<70 && t.hp<t.maxHp) target=t; });
    target.hp=Math.min(target.maxHp,target.hp+60);
    SND.heal();
    if(e.isPlayer) toast('Аптечку використано (+60 HP)');
  }
}
/* Предмети/спорядження (ITEMS) */

/* ---------- ДАНІ: ПРЕДМЕТИ ---------- */
const ITEMS = {
  mine:{name:'Міна',desc:'Ставить пастку. Вибухає під ворогом.',cd:8},
  frag:{name:'Осколкова граната',desc:'75 урону у радіусі, кидок по курсору.',cd:12},
  energy:{name:'Енергетик',desc:'+3 швидкості на 10с, +10 HP.',cd:14},
  medkit:{name:'Аптечка',desc:'Відновлює 60 HP собі або союзнику поруч.',cd:15}
};
/* Предмети: міни */

function updateMines(dt){
  RUN.mines.forEach(m=>{ m.armed+=dt; });
  RUN.mines = RUN.mines.filter(m=>{
    if(m.armed<0.6) return true;
    let hit=null;
    RUN.entities.forEach(t=>{ if(!hit && !t.dead && !t.downed && t.team!==m.team && dist(m,t)<26) hit=t; });
    if(hit){ dealDamage(hit,999,null,m.team); explode(m.x,m.y,60,20,m.team,false); pushLog(`Міна знищила ${CLASSES[hit.cls].name}.`); return false; }
    return true;
  });
}
