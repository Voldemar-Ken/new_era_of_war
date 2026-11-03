/* Інтерфейс бою: головний рендер */
"use strict";

/* ---------- РЕНДЕР ---------- */
const SCOPE_FORWARD_OFFSET = 50*RSCALE; // у прицілі камера дивиться на 50px ВПЕРЕД від снайпера, а не на самого снайпера
function render(){
  if(!ctx) return;
  const p = RUN.player;
  const scopedNow = p && p.cls==='sniper' && p.scoped;
  // приціл снайпера (пробіл): камера трохи віддаляється (щоб смуга 100-300px повністю влізла в кадр)
  const zoom = REPLAY.on ? REPLAY.zoom : (scopedNow ? (1/1.35) : 1);
  currentZoom = zoom;
  const viewW = CW/zoom, viewH = CH/zoom;
  const focusX = (REPLAY.on&&REPLAY.free) ? REPLAY.cx : scopedNow ? p.x+Math.cos(p.angle)*SCOPE_FORWARD_OFFSET : (p?p.x:RUN.mapSize/2);
  const focusY = (REPLAY.on&&REPLAY.free) ? REPLAY.cy : scopedNow ? p.y+Math.sin(p.angle)*SCOPE_FORWARD_OFFSET : (p?p.y:RUN.mapSize/2);
  camX = clamp(focusX - viewW/2, 0, Math.max(0,RUN.mapSize-viewW));
  camY = clamp(focusY - viewH/2, 0, Math.max(0,RUN.mapSize-viewH));

  ctx.save();
  ctx.scale(zoom,zoom);
  ctx.translate(-camX,-camY);

  // піксельна текстура землі, що замощує видиму область (тайл 32×32, без розмиття), у світових координатах
  const tile = groundTile(RUN.mapKey), T = tile.width;
  const startX = Math.floor(camX/T)*T - T, startY = Math.floor(camY/T)*T - T;
  for(let x=startX; x<camX+viewW+T; x+=T){
    for(let y=startY; y<camY+viewH+T; y+=T){ ctx.drawImage(tile, x, y); }
  }
  // легка тактична сітка поверх текстури
  ctx.strokeStyle='rgba(214,168,79,0.06)'; ctx.lineWidth=1/zoom;
  const gridStep=64;
  const gStartX = Math.floor(camX/gridStep)*gridStep, gStartY = Math.floor(camY/gridStep)*gridStep;
  for(let x=gStartX; x<camX+viewW; x+=gridStep){ ctx.beginPath(); ctx.moveTo(x,camY); ctx.lineTo(x,camY+viewH); ctx.stroke(); }
  for(let y=gStartY; y<camY+viewH; y+=gridStep){ ctx.beginPath(); ctx.moveTo(camX,y); ctx.lineTo(camX+viewW,y); ctx.stroke(); }

  // важка місцевість (болото/дюни/озеро — сповільнює, крім рейнджера)
  RUN.swamps.forEach(s=>{
    ctx.fillStyle=s.fill||'rgba(60,90,70,0.35)';
    ctx.beginPath(); ctx.ellipse(s.x,s.y,s.r,s.r*0.7,0,0,Math.PI*2); ctx.fill();
  });
  // укриття (будівлі/скелі/кущі/крижані брили — блокують рух і постріли)
  RUN.covers.forEach(c=>{
    const flat = c.fill||'rgba(90,80,60,0.55)';
    ctx.fillStyle = flat.startsWith('#') ? coverPattern(flat) : flat;
    ctx.strokeStyle=c.stroke||'rgba(214,168,79,0.35)'; ctx.lineWidth=2;
    ctx.beginPath();
    if(c.shape==='rect'){ ctx.rect(c.x-c.w/2,c.y-c.h/2,c.w,c.h); }
    else { ctx.arc(c.x,c.y,c.r,0,Math.PI*2); }
    ctx.fill(); ctx.stroke();
    if(c.shape==='rect'){
      // невеликі пікселі-вікна на будівлях для читабельності силуету
      ctx.fillStyle='rgba(255,220,150,.22)';
      const wpx=6, gap=14;
      for(let ix=c.x-c.w/2+8; ix<c.x+c.w/2-8; ix+=gap) ctx.fillRect(ix, c.y-c.h/2+8, wpx, wpx);
    }
  });

  // бази
  drawBase(RUN.allyBase,'#3b82f6','СОЮЗНА БАЗА');
  drawBase(RUN.enemyBase,'#ef4444','ВОРОЖА БАЗА');

  // точка захоплення
  const cap=RUN.capture;
  const capColor = RUN.captureLeader==='ally'?'#3b82f6':RUN.captureLeader==='enemy'?'#ef4444':'#a3e635';
  ctx.beginPath(); ctx.arc(cap.x,cap.y,RUN.capRadius,0,Math.PI*2);
  ctx.strokeStyle = capColor;
  ctx.lineWidth=3; ctx.setLineDash([10,8]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='rgba(163,230,53,0.06)'; ctx.fill();
  const capFlag = flagSprite(capColor, 7);
  ctx.drawImage(capFlag, cap.x-capFlag.width/2, cap.y-capFlag.height-34);
  ctx.fillStyle=capColor; ctx.font='11px "Press Start 2P", monospace'; ctx.textAlign='center';
  ctx.fillText('ЦЕНТР', cap.x, cap.y-6);
  ctx.fillText(Math.max(RUN.captureHold.ally,RUN.captureHold.enemy).toFixed(0)+'/'+POINT_HOLD_TARGET, cap.x, cap.y+14);

  // міни (маленькі пікселізовані заряди)
  RUN.mines.forEach(m=>{
    const mc = m.team==='ally'?'#5aa0ff':'#ff5a5a';
    ctx.fillStyle = mc;
    ctx.fillRect(m.x-3,m.y-3,6,6);
    ctx.fillStyle='#1a1a1a';
    ctx.fillRect(m.x-1,m.y-1,2,2);
  });

  // частинки вибухів
  RUN.particles.forEach(pt=>{
    const alpha = 1-(pt.t/pt.life);
    ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.r*(pt.t/pt.life+0.2),0,Math.PI*2);
    ctx.fillStyle=`rgba(249,115,22,${alpha*0.5})`; ctx.fill();
  });

  // цілі непрямого вогню міномета (мигаючий маркер прильоту)
  RUN.mortarMarkers.forEach(m=>{
    const p = clamp(m.t/m.dur,0,1);
    const pulse = 0.5+0.5*Math.sin(p*Math.PI*8);
    ctx.strokeStyle = m.team==='ally' ? 'rgba(90,160,255,.9)' : 'rgba(255,90,90,.9)';
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(m.x,m.y, 10+pulse*4, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(m.x-2,m.y-2,4,4);
  });

  // кулі
  RUN.bullets.forEach(b=>{
    if(b.weaponKey==='__mortar_indirect'){
      ctx.fillStyle='#c084fc';
      ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#2a1a33'; ctx.lineWidth=1.5; ctx.stroke();
      return;
    }
    const w = WEAPONS[b.weaponKey]||{color:'#facc15'};
    ctx.fillStyle = b.weaponKey==='__frag'?'#84cc16':w.color;
    ctx.beginPath(); ctx.arc(b.x,b.y, b.weaponKey==='__frag'?5:3,0,Math.PI*2); ctx.fill();
  });

  // власний дрон розвідника (якщо у повітрі): позначка + радіус виявлення
  (REPLAY.on ? RUN.entities.filter(q=>q.droneState==='piloting'&&!q.dead) : (p && p.droneState==='piloting' ? [p] : [])).forEach(p=>{
    ctx.save();
    ctx.strokeStyle='rgba(167,139,250,.9)'; ctx.setLineDash([5,5]); ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(p.droneX,p.droneY,DRONE_REVEAL_R,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle='rgba(167,139,250,.4)';
    ctx.beginPath(); ctx.arc(p.x,p.y,DRONE_TETHER,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.droneX,p.droneY); ctx.strokeStyle='rgba(167,139,250,.5)'; ctx.stroke();
    ctx.fillStyle='#a78bfa';
    ctx.beginPath(); ctx.arc(p.droneX,p.droneY,7,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#3a2a55'; ctx.lineWidth=2; ctx.stroke();
    ctx.font='9px monospace'; ctx.textAlign='center'; ctx.fillStyle='#e9d8ff';
    ctx.fillText('ДРОН', p.droneX, p.droneY-14);
    ctx.restore();
  });

  // сутності
  RUN.entities.forEach(e=>{ if(!e.dead && !(scopedNow && e===p)) drawEntity(e); });
  if(REPLAY.on && !REPLAY.free && p && !p.dead){
    ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=2; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.arc(p.x,p.y,p.radius+11,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
  }

  ctx.restore();

  if(dmgFlashT>0){
    dmgFlashT-=1/60;
    ctx.fillStyle=`rgba(239,68,68,${dmgFlashT*1.6})`;
    ctx.fillRect(0,0,CW,CH);
  }

  if(p && p.cls==='sniper' && p.scoped) drawScopeOverlay(p);

  drawMinimap();
}
