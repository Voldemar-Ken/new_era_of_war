/* Інтерфейс бою: полотно, миша, мінікарта */
"use strict";

function resizeCanvas(){
  canvas = document.getElementById('gameCanvas');
  const wrap = document.getElementById('gameCanvasWrap');
  canvas.width = wrap.clientWidth; canvas.height = wrap.clientHeight;
  CW=canvas.width; CH=canvas.height;
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctxGlobalPatternHost = ctx;
  canvas.onmousemove = e=>{
    const r=canvas.getBoundingClientRect();
    mouse.x = e.clientX-r.left; mouse.y = e.clientY-r.top;
  };
  canvas.onmousedown = ()=>{mouse.down=true;};
  canvas.onwheel = ev=>{
    ev.preventDefault();
    if(!RUN.active || !RUN.player) return;
    switchWeapon(RUN.player,{dir: ev.deltaY>0?1:-1});
  };
  window.addEventListener('mouseup',()=>{mouse.down=false;});

  // Мінометник: клік по мінікарті призначає ціль для непрямого вогню (через стіни,
  // з розкидом ~10px від вказаної точки — див. fireMortarIndirect / MORTAR_MAP_ACCURACY)
  const miniEl = document.getElementById('minimap');
  if(miniEl && !miniEl._wired){
    miniEl._wired = true;
    miniEl.style.cursor = 'crosshair';
    miniEl.addEventListener('mousedown', ev=>{
      ev.preventDefault();
      if(!RUN.active || !RUN.player || RUN.player.dead) return;
      if(RUN.player.weaponKey!=='mortar'){ toast('Непряме наведення доступне лише мінометнику'); return; }
      const r = miniEl.getBoundingClientRect();
      const px = ev.clientX-r.left, py = ev.clientY-r.top;
      const scaleX = miniEl.width/r.width, scaleY = miniEl.height/r.height;
      const s = miniEl.width/RUN.mapSize;
      const worldX = (px*scaleX)/s, worldY = (py*scaleY)/s;
      fireMortarIndirect(RUN.player, worldX, worldY);
    });
  }
}
window.addEventListener('resize',()=>{ if(RUN.active) resizeCanvas(); });
