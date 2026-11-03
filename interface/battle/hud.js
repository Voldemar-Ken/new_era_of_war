/* Інтерфейс бою: приховування панелі HUD */
"use strict";

let hudHidden = false;
function toggleHud(){
  hudHidden = !hudHidden;
  const hud = document.getElementById(REPLAY.on ? 'replayPanel' : 'hud');
  const grid = document.getElementById('battleGrid');
  const btn = document.getElementById('hudToggleBtn');
  hud.style.display = hudHidden ? 'none' : '';
  grid.style.gridTemplateColumns = hudHidden ? '1fr' : '1fr 300px';
  btn.textContent = hudHidden ? '☰' : '✕';
  if(RUN.active) resizeCanvas();
}
let hudExtrasHidden = false;
function toggleHudExtras(){
  hudExtrasHidden = !hudExtrasHidden;
  document.getElementById('hudExtras').style.display = hudExtrasHidden ? 'none' : '';
  document.getElementById('hudExtrasToggleBtn').textContent = hudExtrasHidden ? 'Показати ▼' : 'Приховати ▲';
}

/* Інтерфейс бою: HUD */

/* ---------- HUD ---------- */
function updateHUD(){
  const p=RUN.player; if(!p) return;
  document.getElementById('hudClassName').textContent = CLASSES[p.cls].icon+' '+CLASSES[p.cls].name;
  document.getElementById('hpFill').style.width = Math.max(0,(p.hp/p.maxHp*100))+'%';
  document.getElementById('hpText').textContent = Math.max(0,Math.round(p.hp))+'/'+p.maxHp;
  document.getElementById('statSpeed').textContent = Math.round(p.speed/SPD);
  document.getElementById('statStealth').textContent = Math.round(effectiveStealth(p));
  document.getElementById('statArmor').textContent = p.armor;
  document.getElementById('statAmmo').textContent = WEAPONS[p.weaponKey].melee ? '\u221E' : p.ammoMag+'/'+p.ammoReserve;

  const aa = RUN.entities.filter(e=>e.team==='ally'&&!e.dead).length;
  const ee = RUN.entities.filter(e=>e.team==='enemy'&&!e.dead).length;
  document.getElementById('allyCount').textContent = aa+'/'+GAME_MODE.teamSize;
  document.getElementById('enemyCount').textContent = ee+'/'+GAME_MODE.teamSize;
  document.getElementById('allyBar').style.width=(aa/GAME_MODE.teamSize*100)+'%';
  document.getElementById('enemyBar').style.width=(ee/GAME_MODE.teamSize*100)+'%';

  const holdMax = Math.max(RUN.captureHold.ally,RUN.captureHold.enemy);
  document.getElementById('captureBar').style.width = clamp(holdMax/POINT_HOLD_TARGET*100,0,100)+'%';
  document.getElementById('captureBar').style.background = RUN.captureLeader==='ally'?'#3b82f6':RUN.captureLeader==='enemy'?'#ef4444':'#a3e635';
  document.getElementById('captureLabel').textContent = RUN.captureLeader==='ally'?'Союзники':RUN.captureLeader==='enemy'?'Вороги':'Вільна';

  const mm = Math.max(0,RUN.timeLeft);
  const mi = Math.floor(mm/60), se=Math.floor(mm%60);
  document.getElementById('matchClock').textContent = String(mi).padStart(2,'0')+':'+String(se).padStart(2,'0');

  const box=document.getElementById('cooldownsBox');
  let html='';
  const abKey=CLASSES[p.cls].ability, ab=ABILITIES[abKey];
  if(abKey==='drone'){
    let stTxt = p.abilityCd>0 ? Math.ceil(p.abilityCd)+'с' : 'Готово';
    if(p.droneState==='launching') stTxt = 'Запуск '+Math.ceil(p.droneTimer)+'с';
    else if(p.droneState==='piloting') stTxt = 'У повітрі (E — повернути)';
    html+=`<div class="cooldown-pill"><span>E · ${ab.name}</span><span>${stTxt}</span></div>`;
  } else if(!ab.passive){ html+=`<div class="cooldown-pill"><span>E · ${ab.name}</span><span>${p.abilityCd>0?Math.ceil(p.abilityCd)+'с':'Готово'}</span></div>`; }
  else { html+=`<div class="cooldown-pill"><span>Пасивно · ${ab.name}</span><span>—</span></div>`; }
  const itKey=CLASSES[p.cls].item;
  if(itKey){ html+=`<div class="cooldown-pill"><span>Q · ${ITEMS[itKey].name}</span><span>${p.itemCd>0?Math.ceil(p.itemCd)+'с':'Готово'}</span></div>`; }
  box.innerHTML=html;
  updateWeaponWheelUI();
}
/* Малює ряд кнопок зброї бійця: активна підсвічена, показує боєзапас (або ∞ для
   холодної зброї); клік мишею одразу перемикає на цю зброю. */
function updateWeaponWheelUI(){
  const p=RUN.player; if(!p) return;
  const wrap=document.getElementById('weaponWheel'); if(!wrap) return;
  document.getElementById('weaponName').textContent = WEAPONS[p.weaponKey].name;
  wrap.innerHTML = p.weapons.map((wk,i)=>{
    const w=WEAPONS[wk];
    const active = wk===p.weaponKey;
    const cached = p.ammoCache[wk];
    const ammoTxt = w.melee ? '\u221E' : (active ? p.ammoMag+'/'+p.ammoReserve : (cached? cached.mag+'/'+cached.reserve : w.mag+'/'+w.maxAmmo));
    const isEmpty = !w.melee && !active && cached && cached.mag<=0 && cached.reserve<=0;
    return `<div class="wbtn${active?' active':''}${isEmpty?' empty':''}" data-i="${i}" onclick="switchWeapon(RUN.player,{index:${i}});updateWeaponWheelUI();">
      <span>${i+1}</span><b>${w.name}</b><span>${ammoTxt}</span>
    </div>`;
  }).join('');
}
