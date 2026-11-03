/* Під час бою: оновлення гравця */

"use strict";
/* ---------- ГРАВЕЦЬ ---------- */
function isRooted(e){ const w=WEAPONS[e.weaponKey]; return !!(w&&w.rooted); }   // зброя, з якою не можна рухатись (міномет)
function updatePlayer(dt){
  const p = RUN.player;
  if(!p || p.dead) return;
  if(p.downed) return;

  if(p.droneState!=='idle'){
    if(p.droneState==='launching'){
      p.droneTimer-=dt; p.droneX=p.x; p.droneY=p.y;
      if(p.droneTimer<=0){ p.droneState='piloting'; toast('Дрон у повітрі — керуйте WASD (в межах '+Math.round(DRONE_TETHER/RSCALE)+'px від вас)'); }
    } else {
      // піші клавіші тепер керують дроном, а не тілом бійця
      let ddx=0,ddy=0;
      if(keys['KeyW']||keys['ArrowUp']) ddy-=1;
      if(keys['KeyS']||keys['ArrowDown']) ddy+=1;
      if(keys['KeyA']||keys['ArrowLeft']) ddx-=1;
      if(keys['KeyD']||keys['ArrowRight']) ddx+=1;
      const dl=Math.hypot(ddx,ddy);
      if(dl>0){
        ddx/=dl; ddy/=dl;
        let nx=p.droneX+ddx*DRONE_SPEED*dt, ny=p.droneY+ddy*DRONE_SPEED*dt;
        const dFromPlayer = Math.hypot(nx-p.x, ny-p.y);
        if(dFromPlayer>DRONE_TETHER){
          const a=Math.atan2(ny-p.y, nx-p.x);
          nx = p.x+Math.cos(a)*DRONE_TETHER; ny = p.y+Math.sin(a)*DRONE_TETHER;
        }
        p.droneX=clamp(nx,0,RUN.mapSize); p.droneY=clamp(ny,0,RUN.mapSize);
      }
    }
    // тіло бійця нерухоме весь час керування дроном, але він може відбиватися своєю зброєю
    p.standStill+=dt;
    const worldMouseX = mouse.x/currentZoom+camX, worldMouseY=mouse.y/currentZoom+camY;
    p.angle = Math.atan2(worldMouseY-p.y, worldMouseX-p.x);
    if(mouse.down) tryShoot(p);
    return;
  }

  let dx=0,dy=0;
  if(keys['KeyW']||keys['ArrowUp']) dy-=1;
  if(keys['KeyS']||keys['ArrowDown']) dy+=1;
  if(keys['KeyA']||keys['ArrowLeft']) dx-=1;
  if(keys['KeyD']||keys['ArrowRight']) dx+=1;
  const len=Math.hypot(dx,dy);
  {
    const scoped = p.scoped && p.cls==='sniper';
    let sp = p.speed * (p.speedBuffT>0?1.5:1) * (inSwamp(p) && CLASSES[p.cls].ability!=='map_adapted' ? 0.45:1);
    const rooted = isRooted(p);
    if(!scoped && !rooted && len>0){
      dx/=len; dy/=len;
      moveEntity(p, p.x+dx*sp*dt, p.y+dy*sp*dt);
      p.standStill=0;
    } else {
      p.standStill+=dt;
      if(rooted && len>0){ const t=performance.now(); if(!p._rootHint||t-p._rootHint>2500){ p._rootHint=t; toast('З мінометом у руках рухатись не можна — перемкніть зброю (2–3)'); } }
    }
    const worldMouseX = mouse.x/currentZoom+camX, worldMouseY=mouse.y/currentZoom+camY;
    const desiredAngle = Math.atan2(worldMouseY-p.y, worldMouseX-p.x);
    if(scoped){
      // приціл рухається лише в секторі ±90° від напрямку, зафіксованого на момент прицілювання
      if(p.scopeBaseAngle==null) p.scopeBaseAngle = desiredAngle;
      const off = clamp(normAngle(desiredAngle - p.scopeBaseAngle), -SCOPE_TRAVERSE, SCOPE_TRAVERSE);
      p.angle = normAngle(p.scopeBaseAngle + off);
    } else {
      p.angle = desiredAngle;
    }
    if(mouse.down || (keys['Space'] && p.cls!=='sniper')) tryShoot(p);
  }
}
function inSwamp(e){
  return RUN.swamps.some(s=>Math.hypot(e.x-s.x,e.y-s.y)<s.r);
}

/* Під час бою: спільне оновлення бійців */


/* ---------- СПІЛЬНЕ ОНОВЛЕННЯ (перезарядка, кулдауни, відродження/порятунок) ---------- */
function updateCommon(e,dt){
  if(e.reloading){
    e.reloadT-=dt;
    if(e.reloadT<=0){ e.reloading=false;
      const w=WEAPONS[e.weaponKey];
      const need = w.mag-e.ammoMag;
      const take = Math.min(need,e.ammoReserve);
      e.ammoMag+=take; e.ammoReserve-=take;
    }
  }
  if(e.shotT>0) e.shotT-=dt;
  if(e.abilityCd>0) e.abilityCd-=dt;
  if(e.itemCd>0) e.itemCd-=dt;
  if(e.speedBuffT>0) e.speedBuffT-=dt;
  if(e.droneReveal>0) e.droneReveal-=dt;
  if(e.stunT>0) e.stunT-=dt;
  if(e._mortarStealthDrop>0) e._mortarStealthDrop-=dt;

  // якщо поточна (не холодна) зброя повністю без набоїв — автоматично береться наступна з арсеналу
  const curW = WEAPONS[e.weaponKey];
  if(!curW.melee && e.ammoMag<=0 && e.ammoReserve<=0 && !e.reloading && e.weapons && e.weapons.length>1){
    switchWeapon(e,{dir:1});
  }

  if(e.downed){
    e.downedAt+=dt;
    if(e.downedAt>60){ e.dead=true; e.downed=false; pushLog(`${teamLabel(e.team)} ${CLASSES[e.cls].name} остаточно вибув з бою.`); }
  }
}
function teamLabel(t){ return t==='ally'?'Союзний':'Ворожий'; }
