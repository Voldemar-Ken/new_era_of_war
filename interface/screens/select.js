/* Інтерфейс: екран вибору персонажа */
"use strict";

function buildClassGrid(){
  const el=document.getElementById('classGrid'); el.innerHTML='';
  const order = GAME_MODE.classOrder;
  order.forEach((key,i)=>{
    const c=CLASSES[key];
    const weaponNames = c.weapons.map(wk=>WEAPONS[wk].name).join(' · ');
    const d=document.createElement('div');
    d.className='panel card';
    d.innerHTML=`<div style="display:flex;justify-content:space-between;"><span style="font-size:2.2rem;color:${c.color};">${c.icon}</span><span style="font-size:.68rem;color:var(--primary);">0${i+1}/0${order.length}</span></div>
      <h2 class="heading">${c.name}</h2><p class="muted" style="margin:2px 0 0;font-size:.85rem;">${c.role}</p>
      <div class="statrow"><span>HP <b>${c.hp}</b></span><span>SPD <b>${c.speed}</b></span><span>ARM <b>${c.armor}</b></span><span>STL <b>${c.stealth}</b></span></div>
      <div class="muted" style="font-size:.68rem;margin-top:8px;">Зброя (колесо миші): ${weaponNames}</div>`;
    d.onclick=()=>{stopClassTimer(); CHOICE.cls=key; startMatch();};
    el.appendChild(d);
  });
  if(GAME_MODE.key==='five'){
    const note=document.createElement('p');
    note.className='muted'; note.style.cssText='grid-column:1/-1;font-size:.72rem;margin-top:4px;';
    note.textContent='Режим 5 на 5: мінометник і розвідник (FPV) недоступні.';
    el.appendChild(note);
  } else if(GAME_MODE.key==='duel'){
    const note=document.createElement('p');
    note.className='muted'; note.style.cssText='grid-column:1/-1;font-size:.72rem;margin-top:4px;';
    note.textContent='Режим 1 на 1: суперника гра обирає випадково з усіх 7 класів.';
    el.appendChild(note);
  }
}

/* Інтерфейс: екран вибору складності */

function buildDifficultyGrid(){
  const el=document.getElementById('difficultyGrid'); el.innerHTML='';
  Object.values(DIFFICULTIES).forEach(d=>{
    const card=document.createElement('div');
    card.className='panel card';
    card.innerHTML=`<div class="heading" style="font-size:1.6rem;color:var(--primary);">${d.icon}</div>
      <h2 class="heading" style="margin-top:18px;">${d.label}</h2>
      <p class="muted" style="margin:2px 0 0;">${d.sub}</p>
      <p class="muted" style="font-size:.75rem;margin-top:12px;">${d.desc}</p>`;
    card.onclick=()=>{ DIFFICULTY=d; goto_('map'); };
    el.appendChild(card);
  });
}

/* Інтерфейс: екран вибору карти */

function buildMapGrid(){
  const el=document.getElementById('mapGrid'); el.innerHTML='';
  Object.keys(MAPS).forEach(key=>{
    const m=MAPS[key];
    const d=document.createElement('div');
    d.className='panel card';
    d.style.background=`linear-gradient(145deg, ${m.grad[0]}55, ${m.grad[1]}f0)`;
    d.innerHTML=`<div style="font-size:2.2rem;">${m.icon}</div><h2 class="heading">${m.name}</h2><p class="muted" style="margin:4px 0 0;">${m.desc}</p>`;
    d.onclick=()=>{CHOICE.map=key; goto_('size');};
    el.appendChild(d);
  });
}

/* Інтерфейс: екран вибору режиму */

function buildModeGrid(){
  const el=document.getElementById('modeGrid'); if(!el) return; el.innerHTML='';
  Object.values(MODES).forEach(m=>{
    const d=document.createElement('div');
    d.className='panel card';
    d.innerHTML=`<div class="heading" style="font-size:1.8rem;color:var(--primary);">${m.icon}</div>
      <h2 class="heading" style="margin-top:18px;">${m.label}</h2>
      <p class="muted" style="font-size:.78rem;margin-top:10px;">${m.desc}</p>`;
    d.onclick=()=>{ GAME_MODE=m; goto_('class'); };
    el.appendChild(d);
  });
}

/* Інтерфейс: екран вибору розміру карти */

function buildSizeGrid(){
  const el=document.getElementById('sizeGrid'); el.innerHTML='';
  SIZES.forEach((s,i)=>{
    const d=document.createElement('div');
    d.className='panel card';
    d.innerHTML=`<div class="heading" style="font-size:2rem;color:var(--primary);">0${i+1}</div><h2 class="heading" style="margin-top:26px;">${s.label}</h2><p class="muted" style="margin-top:6px;">${s.desc}</p>`;
    d.onclick=()=>{CHOICE.size=s; goto_('mode');};
    el.appendChild(d);
  });
}
