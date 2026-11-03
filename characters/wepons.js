/* Зброя: удар холодною зброєю */
"use strict";

function meleeAttack(e,dmg,range){
  RUN.entities.forEach(t=>{
    if(t.team!==e.team && !t.dead && !t.downed && dist(e,t)<(range||38)){
      dealDamage(t,dmg,e);
    }
  });
}
/* Зброя: непрямий вогонь міномета по мінікарті */

/* ---------- НЕПРЯМИЙ ВОГОНЬ МІНОМЕТА ПО МІНІКАРТІ ----------
   Мінометник може призначити ціль кліком по мінікарті: снаряд летить по
   дузі (ігнорує укриття, що блокують звичайні кулі) і падає з розкидом
   ~10px від вказаної точки (в масштабі гри — MORTAR_MAP_ACCURACY). */
function fireMortarIndirect(e, tx, ty){
  if(!e || e.downed || e.dead) return;
  if(e.weaponKey!=='mortar'){ if(e.isPlayer) toast('Непряме наведення доступне лише з мінометом'); return; }
  if(e.reloading){ if(e.isPlayer) toast('Йде перезарядка міномета'); return; }
  if(e.shotT>0) return;
  const w = WEAPONS.mortar;
  if(e.ammoMag<=0){ tryReload(e); if(e.isPlayer) toast('Немає снарядів — перезарядка'); return; }

  const r = wRange(w);
  let dx=tx-e.x, dy=ty-e.y, d=Math.hypot(dx,dy);
  if(d>r.maxR){ const k=r.maxR/d; tx=e.x+dx*k; ty=e.y+dy*k; d=r.maxR; if(e.isPlayer) toast('Ціль поза дальністю — скориговано'); }

  // розкид влучання: випадкова точка в колі радіусом MORTAR_MAP_ACCURACY навколо цілі
  const sa=Math.random()*Math.PI*2, sr=Math.random()*MORTAR_MAP_ACCURACY;
  const fx=tx+Math.cos(sa)*sr, fy=ty+Math.sin(sa)*sr;

  e.ammoMag--; e.shotT=w.shotCd;
  e.angle=Math.atan2(ty-e.y,tx-e.x);
  const travelD=Math.max(1,Math.hypot(fx-e.x,fy-e.y));
  const travelT=travelD/w.bSpeed;
  RUN.bullets.push({
    x:e.x,y:e.y,dx:(fx-e.x)/travelD,dy:(fy-e.y)/travelD,spd:w.bSpeed,
    team:e.team,owner:e,weaponKey:'__mortar_indirect',traveled:0,alive:true,
    life:travelT,targetX:fx,targetY:fy
  });
  RUN.mortarMarkers.push({x:fx,y:fy,team:e.team,t:0,dur:travelT});
  SND.explosion();
  if(CLASSES[e.cls].ability==='mortar_reveal') e._mortarStealthDrop=4.5;
  if(e.isPlayer) toast('Міномет: ціль призначено · підліт '+travelT.toFixed(1)+'с');
  pushLog(`${teamLabel(e.team)} мінометник відкрив непрямий вогонь по координатах.`);
}
function updateMortarMarkers(dt){
  RUN.mortarMarkers.forEach(m=>m.t+=dt);
  RUN.mortarMarkers = RUN.mortarMarkers.filter(m=>m.t<m.dur+0.15);
}
/* Зброя: перемикання (колесо миші / клавіші 1-4) */

/* ---------- ПЕРЕМИКАННЯ ЗБРОЇ (колесо миші / клавіші 1-4) ----------
   Кожен клас має по кілька видів зброї (див. CLASSES[cls].weapons). Стан щойно
   залишеної зброї (боєзапас у магазині й у резерві) кешується в e.ammoCache і
   відновлюється, якщо гравець/бот повертається до неї пізніше. */
function switchWeapon(e,opts){
  if(!e||e.dead||e.downed) return;
  if(e.reloading) return; // не можна змінювати зброю під час перезарядки
  const list = e.weapons;
  if(!list||list.length<2) return;
  const idx = list.indexOf(e.weaponKey);
  let newIdx;
  if(opts && typeof opts.index==='number'){
    if(opts.index<0 || opts.index>=list.length) return;
    newIdx = opts.index;
  } else {
    const dir = (opts && opts.dir) || 1;
    newIdx = (idx + dir + list.length) % list.length;
  }
  if(newIdx===idx) return;
  const oldKey = e.weaponKey;
  e.ammoCache[oldKey] = {mag:e.ammoMag, reserve:e.ammoReserve};
  const newKey = list[newIdx];
  e.weaponKey = newKey;
  const cached = e.ammoCache[newKey];
  const nw = WEAPONS[newKey];
  if(nw.melee){ e.ammoMag=0; e.ammoReserve=0; }
  else if(cached){ e.ammoMag=cached.mag; e.ammoReserve=cached.reserve; }
  else { e.ammoMag=nw.mag||0; e.ammoReserve=nw.maxAmmo||0; }
  e.reloading=false; e.reloadT=0; e.shotT=Math.max(e.shotT,0.15);
  if(e.scoped && newKey!=='sniper_rifle'){
    e.scoped=false;
    if(e.isPlayer) toast('Приціл вимкнено: інша зброя в руках');
  }
  if(e.isPlayer){ toast('Зброя: '+nw.name); updateWeaponWheelUI(); }
}
/* Зброя: характеристики (WEAPONS) і ефективна дальність */

/* ---------- ДАНІ: ЗБРОЯ ---------- */
const WEAPONS = {
  // minR/maxR — точно дальність зі специфікації × RSCALE. Ефективна дальність у бою
  // додатково множиться на модифікатор карти "дальність" (map.rangeMod) — див. wRange().
  sniper_rifle:{name:'Снайперська гвинтівка',minR:100*RSCALE,maxR:300*RSCALE,dmg:100,mag:5,maxAmmo:30,shotCd:1.0,reload:5.0,bSpeed:1400,color:'#facc15'},
  pistol:{name:'Пістолет',minR:0*RSCALE,maxR:30*RSCALE,dmg:24,mag:7,maxAmmo:35,shotCd:0.28,reload:2.0,bSpeed:1100,color:'#e5e7eb'},
  shotgun:{name:'Дробовик',minR:30*RSCALE,maxR:50*RSCALE,dmgMax:45,dmgMin:15,mag:7,maxAmmo:25,shotCd:0.85,reload:4.0,bSpeed:1100,pellets:5,spreadDeg:16,color:'#f97316'},
  heavy_mg:{name:'Важкий кулемет',minR:45*RSCALE,maxR:100*RSCALE,dmg:22,mag:50,maxAmmo:300,shotCd:0.1,reload:5.0,bSpeed:1300,color:'#fb923c'},
  assault_rifle:{name:'Автомат',minR:60*RSCALE,maxR:150*RSCALE,dmg:26,mag:35,maxAmmo:150,shotCd:0.13,reload:3.0,bSpeed:1300,color:'#38bdf8'},
  grenade_launcher:{name:'Гранатомет',minR:50*RSCALE,maxR:200*RSCALE,dmg:70,mag:6,maxAmmo:30,shotCd:1.3,reload:6.0,bSpeed:820,splash:15*RSCALE,color:'#84cc16'},
  mortar:{name:'Міномет',minR:100*RSCALE,maxR:550*RSCALE,dmg:120,mag:1,maxAmmo:20,shotCd:5.2,reload:0.0,bSpeed:620,splash:40*RSCALE,rooted:true,color:'#c084fc'},
  sawed_off:{name:'Обріз',minR:10*RSCALE,maxR:30*RSCALE,dmgMax:35,dmgMin:5,mag:2,maxAmmo:10,shotCd:0.6,reload:3.0,bSpeed:1000,pellets:4,spreadDeg:24,color:'#eab308'},
  // Холодна зброя: без магазину/перезарядки, лише дальність ближнього бою і кулдаун удару
  knife:{name:'Ніж',minR:0,maxR:15*RSCALE,dmg:20,melee:true,shotCd:0.5,color:'#cbd5e1'},
  bayonet:{name:'Штик-ніж',minR:5*RSCALE,maxR:20*RSCALE,dmg:25,melee:true,shotCd:0.5,color:'#cbd5e1'},
  iron_knuckles:{name:'Рукавиці із залізними вставками',minR:0,maxR:10*RSCALE,dmg:25,melee:true,shotCd:0.42,color:'#cbd5e1'}
};
// Ефективна (з урахуванням карти) дальність зброї у світових одиницях
function wRange(w){
  const m = MAPS[RUN.mapKey].rangeMod;
  return {minR:w.minR*m, maxR:w.maxR*m};
}

/* Зброя: стрільба та перезарядка */

/* ---------- СТРІЛЬБА ---------- */
function tryShoot(e){
  if(e.downed||e.dead) return;
  const w = WEAPONS[e.weaponKey];
  if(e.shotT>0) return;
  if(w.melee){
    e.shotT = w.shotCd||0.5;
    meleeAttack(e,w.dmg,w.maxR);
    SND.shot();
    return;
  }
  if(e.reloading) return;
  if(e.ammoMag<=0){
    tryReload(e);
    return;
  }
  e.ammoMag--; e.shotT=w.shotCd;
  const pellets = w.pellets||1;
  for(let i=0;i<pellets;i++){
    let ang = e.angle;
    if(w.spreadDeg){ ang += (rand(-1,1)) * (w.spreadDeg*Math.PI/180); }
    else if(w.mag>10){ ang += rand(-1,1)*0.03; }
    RUN.bullets.push({
      x:e.x+Math.cos(e.angle)*e.radius, y:e.y+Math.sin(e.angle)*e.radius,
      dx:Math.cos(ang), dy:Math.sin(ang), spd:w.bSpeed, team:e.team, owner:e,
      weaponKey:e.weaponKey, traveled:0, alive:true,
      // снайпер "Наскрізний постріл": вбивчий постріл у прицілі несе надлишковий урон далі
      pierce: (e.cls==='sniper' && e.scoped && e.weaponKey==='sniper_rifle')
    });
  }
  if(e.weaponKey==='sniper_rifle') SND.sniperShot(); else if(e.weaponKey==='mortar'||e.weaponKey==='grenade_launcher') SND.explosion(); else SND.shot();
  if(CLASSES[e.cls].ability==='mortar_reveal' && e.weaponKey==='mortar'){
    e._mortarStealthDrop = 4.5;
  }
  if(e.ammoMag<=0 && e.ammoReserve>0) { /* авто-перезарядку лишаємо на дії гравця/бота */ }
}
function tryReload(e){
  if(e.reloading||e.downed||e.dead) return;
  const w=WEAPONS[e.weaponKey];
  if(w.melee) return;
  if(e.ammoMag>=w.mag || e.ammoReserve<=0) return;
  e.reloading=true; e.reloadT=(w.reload||1.5)*(e.team==='enemy'?DIFFICULTY.reloadMult:1);
}
