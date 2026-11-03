/* Онлайн: пошук гравців і показ карти */
"use strict";

const SEARCH_NAMES = ['Shadow_Wolf','Viper','Nika','Rex_UA','Falcon','Ghost77','Storm',' Данило','Оксана','Kraken','Byk','Zmiy','Fenix','Vovk','Orel','Tigr','Barsuk','Sokil','Kolibri','Yastrub'];
function runSearchingAnimation(){
  const total = ONLINE_MODE_CHOICE.teamSize*2;
  const grid = document.getElementById('searchGrid'); grid.innerHTML='';
  grid.style.gridTemplateColumns = `repeat(${Math.min(10,total)},1fr)`;
  const cells=[];
  for(let i=0;i<total;i++){ const d=document.createElement('div'); d.style.cssText='aspect-ratio:1;border-radius:5px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:.55rem;color:var(--muted);'; grid.appendChild(d); cells.push(d); }
  let found=0;
  document.getElementById('searchCount').textContent = `0 / ${total} знайдено · ${ONLINE_MODE_CHOICE.label}`;
  const iv = setInterval(()=>{
    if(!document.getElementById('screen-searching').classList.contains('active')){ clearInterval(iv); return; }
    if(found>=total){ clearInterval(iv); setTimeout(()=>goto_('mapreveal'), 500); return; }
    const name = found===0 ? 'ВИ' : SEARCH_NAMES[(found-1)%SEARCH_NAMES.length];
    cells[found].style.background='rgba(163,230,53,.18)'; cells[found].style.borderColor='var(--primary)'; cells[found].style.color='var(--primary)';
    cells[found].textContent = name.slice(0,6);
    found++;
    document.getElementById('searchCount').textContent = `${found} / ${total} знайдено · ${ONLINE_MODE_CHOICE.label}`;
  }, 160);
}
function runMapReveal(){
  const mapKeys = Object.keys(MAPS);
  const mapKey = mapKeys[Math.floor(Math.random()*mapKeys.length)];
  const size = SIZES[Math.floor(Math.random()*SIZES.length)];
  GAME_MODE = ONLINE_MODE_CHOICE;
  CHOICE.map = mapKey; CHOICE.size = size;
  const m = MAPS[mapKey];
  document.getElementById('revealIcon').textContent = m.icon;
  document.getElementById('revealMapName').textContent = m.name;
  document.getElementById('revealSizeInfo').textContent = size.label+' · '+size.desc+' · '+GAME_MODE.label;
  setTimeout(()=>{
    if(document.getElementById('screen-mapreveal').classList.contains('active')){
      VIA_ONLINE = true;
      goto_('class');
      startClassTimer();
    }
  }, 2200);
}
