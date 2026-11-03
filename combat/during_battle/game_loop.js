/* Під час бою: головний цикл */
"use strict";

/* ---------- ГОЛОВНИЙ ЦИКЛ ---------- */
function loop(now){
  if(!RUN.active) return;
  let dt = (now - RUN.lastT)/1000; RUN.lastT = now;
  dt = Math.min(dt,0.05);
  update(dt);
  render();
  if(RUN.active) requestAnimationFrame(loop);
}

function update(dt){
  if(RUN.ended) return;
  RUN.timeLeft -= dt;
  RUN.radarTimer += dt;
  if(RUN.radarTimer>=35){ RUN.radarTimer=0; RUN.radarActive=4; showRadarPulse(); }
  if(RUN.radarActive>0){ RUN.radarActive-=dt; }

  updatePlayer(dt);
  RUN.entities.forEach(e=>{ if(e!==RUN.player && !e.dead) updateBot(e,dt); });
  RUN.entities.forEach(e=>{ if(!e.dead) updateCommon(e,dt); });
  updateDroneScans(dt);
  updateBullets(dt);
  updateMortarMarkers(dt);
  updateMines(dt);
  updateCapture(dt);
  updateBase(dt);
  updateParticles(dt);
  checkWinConditions();
  updateHUD();
}
