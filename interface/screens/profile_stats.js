/* Інтерфейс: екран статистики профілю */
"use strict";

function renderStats(){
  document.getElementById('statMatches').textContent = STATS.matches;
  document.getElementById('statWinrate').textContent = (STATS.matches?Math.round(STATS.wins/STATS.matches*100):0)+'%';
  document.getElementById('statMvp').textContent = STATS.mvp;
  const rows = [
    ['Перемог', STATS.wins], ['Поразок', STATS.losses],
    ['Найкраща серія перемог', STATS.bestStreak], ['Поточна серія', STATS.curStreak],
    ['Усього уражень', STATS.totalKills], ['Найбільше уражень за бій', STATS.bestKills],
    ['Завдано шкоди (сумарно)', STATS.totalDamage], ['Вижив у боях', STATS.survived]
  ];
  document.getElementById('statList').innerHTML = rows.map(r=>`<div class="muted">${r[0]}</div><div style="text-align:right;font-weight:700;">${r[1]}</div>`).join('');
  const byClassKeys = Object.keys(STATS.byClass);
  document.getElementById('statByClass').innerHTML = byClassKeys.length ? byClassKeys.map(k=>{
    const c=CLASSES[k], st=STATS.byClass[k];
    return `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span>${c.icon} ${c.name}</span><span class="muted">${st.played} боїв · ${st.played?Math.round(st.wins/st.played*100):0}% W · ${st.kills} kills</span></div>`;
  }).join('') : '<p class="muted">Немає даних.</p>';
  drawRadarChart();
}
function drawRadarChart(){
  const cv = document.getElementById('radarChart'); if(!cv) return;
  const rctx = cv.getContext('2d');
  const cx=cv.width/2, cy=cv.height/2-6, R=110;
  rctx.clearRect(0,0,cv.width,cv.height);
  const m = STATS.matches||1;
  const vals = [
    clamp((STATS.totalKills/m)/8, 0, 1),                 // Ураження
    clamp((STATS.totalDamage/m)/900, 0, 1),               // Шкода
    clamp(STATS.survived/m, 0, 1),                         // Виживання
    clamp(STATS.wins/m, 0, 1),                             // Перемоги
    clamp(STATS.mvp/m, 0, 1),                              // MVP
    clamp(STATS.bestStreak/10, 0, 1)                       // Серія
  ];
  const labels = ['Ураження','Шкода','Виживання','Перемоги','MVP','Серія'];
  const n = 6, ang0=-Math.PI/2;
  // сітка
  rctx.strokeStyle='rgba(214,168,79,.35)'; rctx.fillStyle='rgba(255,255,255,.04)';
  for(let ring=1; ring<=3; ring++){
    rctx.beginPath();
    for(let i=0;i<=n;i++){ const a=ang0+i*(Math.PI*2/n); const r=R*ring/3; const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r; i===0?rctx.moveTo(x,y):rctx.lineTo(x,y); }
    rctx.stroke();
  }
  for(let i=0;i<n;i++){ const a=ang0+i*(Math.PI*2/n); rctx.beginPath(); rctx.moveTo(cx,cy); rctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R); rctx.stroke(); }
  // дані
  rctx.beginPath();
  for(let i=0;i<n;i++){ const a=ang0+i*(Math.PI*2/n); const r=R*vals[i]; const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r; i===0?rctx.moveTo(x,y):rctx.lineTo(x,y); }
  rctx.closePath();
  rctx.fillStyle='rgba(163,230,53,.32)'; rctx.strokeStyle='#a3e635'; rctx.lineWidth=2;
  rctx.fill(); rctx.stroke();
  // підписи
  rctx.fillStyle='#d5dccc'; rctx.font='11px sans-serif'; rctx.textAlign='center';
  for(let i=0;i<n;i++){ const a=ang0+i*(Math.PI*2/n); const x=cx+Math.cos(a)*(R+22), y=cy+Math.sin(a)*(R+22); rctx.fillText(labels[i], x, y+4); }
}
