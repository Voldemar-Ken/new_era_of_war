/* Інтерфейс бою: снайперський приціл */
"use strict";

/* Прицільна сітка від першого лиця для снайпера (пробіл): усе поле зору чорне, крім
   вузької смуги 100-300px завдовжки і 10px завширшки вздовж поточного напрямку (p.angle) —
   саме туди й летить постріл. Дві тьмяні риски позначають межі сектора ±90° від напрямку,
   зафіксованого в момент прицілювання — далі цих меж смугу повернути не можна. */
function drawScopeOverlay(p){
  const zoom = currentZoom;
  // екранна позиція самого снайпера (камера тепер зміщена на 50px вперед від нього, тож це не центр екрана)
  const psx = (p.x-camX)*zoom, psy = (p.y-camY)*zoom;
  const rr = wRange(WEAPONS.sniper_rifle); // {minR,maxR} у світових одиницях (100-300px зі специфікації)
  const minR = rr.minR*zoom, maxR = rr.maxR*zoom, halfW = SCOPE_WIDTH_HALF*zoom;
  const base = p.scopeBaseAngle!=null ? p.scopeBaseAngle : p.angle;
  const reach = Math.max(CW,CH); // довжина індикаторів меж повороту, з запасом за екран

  ctx.save();
  // чорне все, крім вузької смуги огляду (100-300px, 10px завширшки) вздовж поточного напрямку
  ctx.beginPath();
  ctx.rect(0,0,CW,CH);
  ctx.save();
  ctx.translate(psx,psy); ctx.rotate(p.angle);
  ctx.rect(minR,-halfW,maxR-minR,halfW*2);
  ctx.restore();
  ctx.fillStyle='#000';
  ctx.fill('evenodd');

  // межі повороту прицілу (±90° від зафіксованого напрямку — далі лінія не йде)
  ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.setLineDash([4,5]); ctx.lineWidth=1.5;
  [base-SCOPE_TRAVERSE, base+SCOPE_TRAVERSE].forEach(a=>{
    ctx.beginPath(); ctx.moveTo(psx,psy); ctx.lineTo(psx+Math.cos(a)*reach, psy+Math.sin(a)*reach); ctx.stroke();
  });
  ctx.setLineDash([]);

  // контур і центральна лінія самої смуги огляду
  ctx.save();
  ctx.translate(psx,psy); ctx.rotate(p.angle);
  ctx.strokeStyle='rgba(163,230,53,.9)'; ctx.lineWidth=1.5;
  ctx.strokeRect(minR,-halfW,maxR-minR,halfW*2);
  ctx.beginPath(); ctx.moveTo(minR,0); ctx.lineTo(maxR,0); ctx.stroke();
  ctx.restore();

  ctx.fillStyle='rgba(163,230,53,.85)'; ctx.font='10px "Press Start 2P", monospace'; ctx.textAlign='center';
  ctx.fillText('ОГЛЯД 100-300px \u00b7 10px \u00b7 ХІД \u00b190\u00b0', CW/2, CH-18);
  ctx.restore();
}
