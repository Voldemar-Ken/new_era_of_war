/* Під час бою: кулі */
"use strict";

/* ---------- КУЛІ ---------- */
function updateBullets(dt){
  RUN.bullets.forEach(b=>{
    if(!b.alive) return;
    const step = b.spd*dt;
    b.x+=b.dx*step; b.y+=b.dy*step; b.traveled+=step;
    if(b.x<0||b.x>RUN.mapSize||b.y<0||b.y>RUN.mapSize){ b.alive=false; return; }
    if(b.weaponKey==='__frag'){
      b.life-=dt;
      if(b.life<=0){ explode(b.x,b.y,90,75,b.team,true); b.alive=false; }
      return;
    }
    if(b.weaponKey==='__mortar_indirect'){
      // непрямий вогонь: летить дугою над укриттями, вибухає лише по прильоту в ціль
      b.life-=dt;
      if(b.life<=0){ explode(b.targetX,b.targetY, WEAPONS.mortar.splash, WEAPONS.mortar.dmg, b.team, true); b.alive=false; }
      return;
    }
    const w = WEAPONS[b.weaponKey];
    const r = wRange(w);
    if(r.maxR && b.traveled > r.maxR*1.08 + 20){ b.alive=false; return; }
    // укриття блокує лінію пострілу
    if(blockedAt(b.x,b.y)){
      b.alive=false;
      if(w.splash) explode(b.x,b.y,w.splash,w.dmg*0.6,b.team,false);
      spawnParticle(b.x,b.y,'#8a8a80',10);
      return;
    }
    // перевірка попадання
    let hit=null;
    RUN.entities.forEach(t=>{
      if(hit||t.dead||t.team===b.team||t.downed) return;
      if(dist(b,t)<t.radius+4) hit=t;
    });
    if(hit){
      if(w.splash){
        b.alive=false;
        explode(b.x,b.y,w.splash,w.dmg,b.team,true);
      } else {
        let dmg = w.dmg;
        if(w.dmgMax!==undefined){
          const t2 = clamp((b.traveled-r.minR)/Math.max(1,(r.maxR-r.minR)),0,1);
          dmg = w.dmgMax - t2*(w.dmgMax-w.dmgMin);
        }
        if(b.pierceDmg!=null) dmg = b.pierceDmg; // залишок від попереднього наскрізного влучання цим же пострілом
        const overkill = dealDamage(hit,dmg,b.owner);
        if(b.pierce && overkill>0){
          // снайпер "Наскрізний постріл": вбивчий постріл у прицілі несе надлишковий урон далі
          b.pierceDmg = overkill;
          spawnParticle(b.x,b.y,'#facc15',6);
        } else {
          b.alive=false;
        }
      }
    }
  });
  RUN.bullets = RUN.bullets.filter(b=>b.alive);
}
/* Під час бою: нанесення шкоди */

function dealDamage(target,rawDmg,attacker,attackerTeam){
  if(target.dead||target.downed) return 0;
  { const _at = attacker ? attacker.team : attackerTeam; if(_at==='enemy') rawDmg *= DIFFICULTY.dmgMult; }
  // штурмовик: важка броня — впритул (0-5px) урону не отримує взагалі, а поза цим
  // мінімальний "пробивний" урон нижчий (0.5 замість звичайного 1)
  if(target.cls==='assault' && attacker && dist(target,attacker) <= 5*RSCALE) return 0;
  const floor = target.cls==='assault' ? 0.5 : 1;
  const mitig = Math.max(floor, rawDmg - target.armor);
  const hpBefore = target.hp;
  target.hp -= mitig;
  SND.hit();
  if(target.isPlayer){ flashDamage(); }
  if(target.hp<=0 && !target.downed){
    target.hp=0; target.downed=true; target.downedAt=0; target.scoped=false; target.droneState='idle'; target.droneTimer=0;
    SND.down();
    const kt = attacker? attacker.team : attackerTeam;
    if(kt && kt!==target.team){
      const killer = attacker;
      if(killer){ killer.kills=(killer.kills||0)+1; }
    }
    pushLog(`${teamLabel(target.team)} ${CLASSES[target.cls].name} підбитий${target.team==='ally'&&target.isPlayer?' (ВИ)':''}.`);
    if(target.isPlayer) toast('Вас підбито! Союзний медик може вас врятувати протягом 60с.');
  }
  // надлишковий (понад HP цілі) урон - використовується снайперським "Наскрізним пострілом" у прицілі
  const overkill = mitig - hpBefore;
  return overkill>0 ? overkill : 0;
}
let dmgFlashT=0;
function flashDamage(){ dmgFlashT=0.18; }

/* Під час бою: вибухи та частинки */

function explode(x,y,radius,dmg,team,stun){
  spawnParticle(x,y,'#f97316',radius);
  SND.explosion();
  RUN.entities.forEach(t=>{
    if(t.dead||t.downed) return;
    const d=dist({x,y},t);
    if(d<radius){
      const falloff = 1-(d/radius)*0.5;
      dealDamage(t, dmg*falloff, null, team);
      if(stun && t.team!==team){ t.stunT=Math.max(t.stunT||0,0.5); }
    }
  });
}
function spawnParticle(x,y,color,r){
  RUN.particles.push({x,y,color,r:r||30,t:0,life:0.4});
}
function updateParticles(dt){
  RUN.particles.forEach(p=>p.t+=dt);
  RUN.particles = RUN.particles.filter(p=>p.t<p.life);
}
