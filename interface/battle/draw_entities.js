/* Інтерфейс бою: малювання баз і бійців */
"use strict";

function drawBase(b,color,label){
  ctx.strokeStyle=color; ctx.lineWidth=2; ctx.setLineDash([6,6]);
  ctx.strokeRect(b.x-90,b.y-90,180,180); ctx.setLineDash([]);
  ctx.fillStyle=color; ctx.globalAlpha=0.08; ctx.fillRect(b.x-90,b.y-90,180,180); ctx.globalAlpha=1;
  const flag = flagSprite(color, 6);
  ctx.drawImage(flag, b.x-flag.width/2, b.y-flag.height-4);
  ctx.fillStyle=color; ctx.font='11px "Press Start 2P", monospace'; ctx.textAlign='center';
  ctx.fillText(label, b.x, b.y-98);
}
function drawEntity(e){
  const c = CLASSES[e.cls];
  const color = e.team==='ally' ? (e.isPlayer?'#a3e635':'#3b82f6') : '#ef4444';
  if(e.downed){
    const dspr = downedSprite(4);
    ctx.globalAlpha=0.55;
    ctx.drawImage(dspr, e.x-dspr.width/2, e.y-dspr.height/2);
    ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.arc(e.x,e.y,e.radius,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#ddd'; ctx.font='9px "Press Start 2P", monospace'; ctx.textAlign='center';
    ctx.fillText('ПІДБИТИЙ', e.x, e.y-22);
    return;
  }
  // видимість: показуємо ворогів лише якщо гравець їх бачить, або радар активний, або союзник
  if(!REPLAY.on && e.team!=='ally' && !e.isPlayer){
    const visCap = (RUN.player.cls==='sniper' && RUN.player.scoped) ? 900*1.35 : 900;
    const seenByPlayer = RUN.player && (canSee(RUN.player,e) && dist(RUN.player,e)<visCap);
    const radar = RUN.radarActive>0 || e.droneReveal>0;
    if(!seenByPlayer && !radar) return;
    if(!seenByPlayer && radar){ drawContactBlip(e); return; }
  }
  // напрям погляду (лінія прицілу під спрайтом)
  ctx.strokeStyle= e.team==='ally' ? 'rgba(190,215,255,.9)' : 'rgba(255,190,190,.9)';
  ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(e.x+Math.cos(e.angle)*22,e.y+Math.sin(e.angle)*22); ctx.stroke();
  const spr = getUnitSprite(e);
  ctx.drawImage(spr, e.x-spr.width/2, e.y-spr.height/2);
  if(e.stunT>0){ ctx.fillStyle='#ffe45a'; ctx.font='11px "Press Start 2P", monospace'; ctx.textAlign='center'; ctx.fillText('\u2726', e.x, e.y-e.radius-16); }
  // смужка hp
  ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(e.x-18,e.y-30,36,5);
  ctx.fillStyle= e.team==='ally'?'#3b82f6':'#ef4444';
  ctx.fillRect(e.x-18,e.y-30, 36*(e.hp/e.maxHp), 5);
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='9px sans-serif'; ctx.textAlign='center';
  ctx.fillText(c.icon+(e.isPlayer?' ВИ':''), e.x, e.y-34);
  if(e.isPlayer){
    ctx.strokeStyle='#a3e635'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(e.x,e.y,e.radius+5,0,Math.PI*2); ctx.stroke();
  }
}
/* Позначка "приблизного контакту" — коли ворога виявлено лише радаром/дроном, а не
   напряму. Точна модель/зброя/HP невідомі, тому малюємо лише розмитий маркер на
   ПРИБЛИЗНІЙ (fuzzy) позиції — reportedPos() — а не на справжніх координатах. */
function drawContactBlip(e){
  const p = reportedPos(e);
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(p.x-8,p.y); ctx.lineTo(p.x,p.y-8); ctx.lineTo(p.x+8,p.y); ctx.lineTo(p.x,p.y+8); ctx.closePath(); ctx.stroke();
  ctx.fillStyle='rgba(239,68,68,.35)'; ctx.fill();
  ctx.globalAlpha=0.5; ctx.setLineDash([3,4]);
  ctx.beginPath(); ctx.arc(p.x,p.y,16,0,Math.PI*2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
