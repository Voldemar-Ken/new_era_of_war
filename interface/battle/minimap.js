/* Інтерфейс бою: мінікарта */
"use strict";

function drawMinimap(){
  if(!mini){ mini=document.getElementById('minimap'); mctx=mini.getContext('2d'); mctx.imageSmoothingEnabled=false; }
  const s=mini.width/RUN.mapSize;
  mctx.fillStyle='#080c08'; mctx.fillRect(0,0,mini.width,mini.height);
  mctx.strokeStyle='rgba(214,168,79,.3)'; mctx.strokeRect(0,0,mini.width,mini.height);
  mctx.fillStyle='rgba(59,130,246,.5)'; mctx.fillRect(RUN.allyBase.x*s-8,RUN.allyBase.y*s-8,16,16);
  mctx.fillStyle='rgba(239,68,68,.5)'; mctx.fillRect(RUN.enemyBase.x*s-8,RUN.enemyBase.y*s-8,16,16);
  mctx.strokeStyle='#a3e635'; mctx.beginPath(); mctx.arc(RUN.capture.x*s,RUN.capture.y*s,RUN.capRadius*s,0,Math.PI*2); mctx.stroke();
  // видима зона камери
  mctx.strokeStyle='rgba(255,255,255,.4)';
  mctx.strokeRect(camX*s,camY*s,(REPLAY.on?CW/currentZoom:CW)*s,(REPLAY.on?CH/currentZoom:CH)*s);
  if(RUN.player && RUN.player.droneState==='piloting'){
    mctx.fillStyle='#a78bfa';
    mctx.beginPath(); mctx.arc(RUN.player.droneX*s,RUN.player.droneY*s,3,0,Math.PI*2); mctx.fill();
    mctx.strokeStyle='rgba(167,139,250,.5)';
    mctx.beginPath(); mctx.arc(RUN.player.droneX*s,RUN.player.droneY*s,DRONE_REVEAL_R*s,0,Math.PI*2); mctx.stroke();
  }
  RUN.entities.forEach(e=>{
    if(e.dead) return;
    if(e.team==='ally'){
      mctx.fillStyle = e.isPlayer?'#a3e635':'#3b82f6';
      const bs = e.isPlayer?5:3;
      mctx.fillRect(e.x*s-bs/2, e.y*s-bs/2, bs, bs);
    } else if(REPLAY.on || RUN.radarActive>0 || e.droneReveal>0){
      const rp = REPLAY.on ? e : reportedPos(e);
      mctx.fillStyle='#ef4444';
      mctx.fillRect(rp.x*s-1.5, rp.y*s-1.5, 3, 3);
    }
  });
}
