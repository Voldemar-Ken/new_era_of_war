/* Онлайн: вибір режиму в лобі */
"use strict";

// Онлайн — окремо від головного бою: лише малі склади, перемикається в лобі
let ONLINE_MODE_CHOICE = MODES.classic;
const ONLINE_MODE_SUB = {classic:'повний склад, усі 7 класів', five:'без мінометника й розвідника', duel:'дуель, усі класи'};
function renderOnlineModeToggle(){
  const el = document.getElementById('onlineModeToggle'); if(!el) return;
  el.innerHTML = ['classic','five','duel'].map(k=>{
    const m = MODES[k];
    return `<div class="mode-pill ${ONLINE_MODE_CHOICE.key===k?'active':''}" onclick="ONLINE_MODE_CHOICE=MODES['${k}']; renderOnlineModeToggle();"><b>${m.label}</b>${ONLINE_MODE_SUB[k]}</div>`;
  }).join('');
}
