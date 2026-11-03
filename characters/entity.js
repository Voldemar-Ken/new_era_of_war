/* Створення бійця (makeEntity) та ефективне маскування */
"use strict";

/* ---------- СУТНІСТЬ ---------- */
let ENTID=0;
function makeEntity(team,clsKey,x,y,isPlayer){
  const c = CLASSES[clsKey];
  const map = MAPS[RUN.mapKey];
  // рейнджер: "Пристосований" - дебафи карти (від'ємні модифікатори) на нього не діють,
  // а бонуси карти (додатні модифікатори) лишаються як є
  const immune = clsKey==='ranger';
  const effSpeedMod = immune ? Math.max(0, map.speedMod) : map.speedMod;
  const effArmorMod = immune ? Math.max(0, map.armorMod||0) : (map.armorMod||0);
  const effStealthMod = immune ? Math.max(0, map.stealthMod) : map.stealthMod;
  const spd = Math.max(0.6,(c.speed+effSpeedMod)) * SPD;
  const armor = c.armor + effArmorMod;
  const hpMult = team==='enemy' ? DIFFICULTY.hpMult : 1.0;
  return {
    id:ENTID++, team, cls:clsKey, isPlayer:!!isPlayer,
    x,y, angle:0, radius:15,
    hp:c.hp*hpMult, maxHp:c.hp*hpMult, armor, baseStealth:c.stealth, mapStealthMod:effStealthMod,
    speed:spd, weapons:c.weapons.slice(), weaponKey:c.weapons[0], ammoMag:WEAPONS[c.weapons[0]].mag||0, ammoReserve:WEAPONS[c.weapons[0]].maxAmmo||0,
    ammoCache:{}, reloading:false, reloadT:0, shotT:0, standStill:0,
    state:'patrol', downed:false, downedAt:0, dead:false,
    abilityCd:0, itemCd:0, itemActiveT:0, speedBuffT:0,
    patrolTarget:null, kills:0,
    droneReveal:0, droneState:'idle', droneTimer:0, droneX:0, droneY:0, scoped:false
  };
}
function effectiveStealth(e){
  let s = e.baseStealth + e.mapStealthMod;
  if(e._mortarStealthDrop>0) s = Math.min(s,10);
  if(e.droneReveal>0) s*=0.8; // під наглядом дрона маскування -20%
  return clamp(s,0,140);
}
