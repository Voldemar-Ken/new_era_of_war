/* Інтерфейс бою: імпульс радара */
"use strict";

/* ---------- РАДАР ---------- */
function showRadarPulse(){
  const el=document.getElementById('radarNotice');
  el.style.opacity=1;
  setTimeout(()=>{el.style.opacity=0;},2600);
  pushLog('Супутникова розвідка: позиції ворогів оновлено.');
  // знімок приблизних позицій на момент спрацювання радару (не оновлюється, поки триває)
  RUN.entities.forEach(e=>{ if(!e.dead) setFuzzyReport(e,'radar'); });
}
