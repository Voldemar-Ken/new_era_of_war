/* Спрайти персонажів і анімації (патчить drawEntity/render) */

/* NEW ERA OF WAR — спрайти персонажів і анімації (підключено після основного скрипта) */
(function(){
"use strict";
const S=window.__SPR,K=0.5,IMG={};
Object.keys(S).forEach(k=>{
  if(k==='drone'){const d=new Image();d.src=S.drone.src;IMG.drone=d;return;}
  const b=new Image(),l=new Image();b.src=S[k].base;l.src=S[k].legs;IMG[k]={b:b,l:l};
});
const ok=i=>!!i&&i.complete&&i.naturalWidth>0;
const SNP=window.__SNP,SNI={};Object.keys(SNP).forEach(k=>{const i=new Image();i.src=SNP[k].src;SNI[k]=i;});
window.__SPRITES={SNP:SNP,SNI:SNI};
function A(e){return e._an||(e._an={px:e.x,py:e.y,ph:Math.random()*6,mv:0,shot:0,hurt:0,melee:0,t:performance.now(),ls:e.shotT||0,hp:e.hp});}
const DR=window.__DRN,DRI=new Image();if(DR)DRI.src=DR.src;
const _draw=window.drawEntity,_render=window.render;
function body(I,M,sw){
  const ox=-M.px,oy=-M.py,sx=M.sx;
  ctx.drawImage(I.b,ox,oy,M.w,M.h);
  ctx.drawImage(I.l,0,0,sx,M.h,ox,oy+sw,sx,M.h);
  ctx.drawImage(I.l,sx,0,M.w-sx,M.h,ox+sx,oy-sw,M.w-sx,M.h);
}
function swapFrame(e,SD,dir,a){
  if(a.swapT>=.8)return null;
  const pr=SD.pairs;
  if(pr&&a.swapFrom){
    const f=pr[a.swapFrom+'>'+e.weaponKey],b=pr[e.weaponKey+'>'+a.swapFrom];
    const sf=(f&&f[dir]&&f[dir].length)?f[dir]:null,sb=(b&&b[dir]&&b[dir].length)?b[dir]:null,sq=sf||sb;
    if(sq){if(a.swapT>=sq.length*.12)return null;const i=Math.floor(a.swapT/.12);return sq[sf?i:sq.length-1-i];}
  }
  const sw=SD.swaps,g=k=>{const s=sw&&sw[k]&&sw[k][dir];return (s&&s.length)?s:null;};
  let seq=g(e.weaponKey),rev=false;
  if(!seq&&a.swapFrom){seq=g(a.swapFrom);rev=!!seq;}
  if(!seq&&SD.swap&&SD.swap[dir]&&SD.swap[dir].length)seq=SD.swap[dir];
  if(!seq||a.swapT>=seq.length*.12)return null;
  const i=Math.floor(a.swapT/.12);
  return seq[rev?seq.length-1-i:i];
}
window.drawEntity=function(e){
  const I=IMG[e.cls],M=S[e.cls];
  const SD=SNP[e.cls],SP=!!SD&&ok(SNI[e.cls]);
  if(!SP&&(!I||!ok(I.b)||!ok(I.l)))return _draw(e);
  if(!REPLAY.on&&!e.downed&&e.team!=='ally'&&!e.isPlayer){
    const visCap=(RUN.player.cls==='sniper'&&RUN.player.scoped)?900*1.35:900;
    const seen=RUN.player&&canSee(RUN.player,e)&&dist(RUN.player,e)<visCap;
    if(!seen){if(RUN.radarActive>0||e.droneReveal>0)drawContactBlip(e);return;}
  }
  const a=A(e),now=performance.now(),dt=Math.min(.1,(now-a.t)/1000);a.t=now;
  const mv=Math.hypot(e.x-a.px,e.y-a.py);a.px=e.x;a.py=e.y;
  a.ph+=mv*.11;a.mv+=((mv>.15?1:0)-a.mv)*Math.min(1,dt*12);
  const w=WEAPONS[e.weaponKey];
  if((e.shotT||0)>a.ls+.02){if(w&&w.melee){a.melee=1;a.meleeT=0;}else{a.shot=1;if(e.weaponKey==='mortar')a.fireT=0;}}
  a.ls=e.shotT||0;
  if(e.hp<a.hp-.01)a.hurt=1;
  a.hp=e.hp;
  a.shot=Math.max(0,a.shot-dt*7);a.hurt=Math.max(0,a.hurt-dt*4);a.melee=Math.max(0,a.melee-dt*4);
  const sn=Math.sin(a.ph),ang=e.angle-M.wa,c=Math.cos(M.wa),s=Math.sin(M.wa);
  const col=e.team==='ally'?(e.isPlayer?'#a3e635':'#3b82f6'):'#ef4444';
  ctx.save();ctx.translate(e.x,e.y);
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,4,17,12,0,0,7);ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash(e.downed?[3,3]:[]);
  ctx.beginPath();ctx.arc(0,0,e.radius+3,0,7);ctx.stroke();ctx.setLineDash([]);
  if(e.speedBuffT>0){ctx.strokeStyle='rgba(250,204,21,'+(.55+.3*Math.sin(now/120))+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,e.radius+8,0,7);ctx.stroke();}
  if(a.useT!==undefined&&a.useT<.5){ctx.save();ctx.strokeStyle=a.useCol;ctx.globalAlpha=1-a.useT/.5;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.radius+4+a.useT*70,0,7);ctx.stroke();ctx.restore();}
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(e.stunT>0)ctx.translate(Math.sin(now/30)*1.5,0);
  if(a.hurt>0){ctx.translate((Math.random()-.5)*a.hurt*3,(Math.random()-.5)*a.hurt*3);ctx.filter='brightness('+(1+a.hurt*1.8)+')';}
  if(SP){
    a.d=(a.d||0)+mv;a.meleeT=a.meleeT===undefined?9:a.meleeT+dt;a.fireT=a.fireT===undefined?9:a.fireT+dt;
    if(a.wk!==undefined&&a.wk!==e.weaponKey){a.swapT=0;a.swapFrom=a.wk;}
    a.wk=e.weaponKey;a.swapT=a.swapT===undefined?9:a.swapT+dt;
    const IA=SD.items&&SD.items[CLASSES[e.cls].item];
    if(IA&&(e.itemCd||0)>(a.ic||0)+1)a.mineT=0;
    a.ic=e.itemCd||0;a.mineT=a.mineT===undefined?9:a.mineT+dt;
    if(!IA&&(e.itemCd||0)>(a.ic0||0)+1){a.useT=0;a.useCol={energy:'#facc15',medkit:'#4ade80',mine:'#f97316',frag:'#84cc16'}[CLASSES[e.cls].item]||'#ffffff';}
    a.ic0=e.itemCd||0;if(a.useT!==undefined)a.useT+=dt;
    const AB=SD.abil;
    if(AB&&(e.abilityCd||0)>(a.ac||0)+5){a.abT=0;a.abK=(a.hd&&AB.revive.length)?'revive':'aura';}
    a.ac=e.abilityCd||0;a.abT=a.abT===undefined?9:a.abT+dt;
    a.hd=RUN.entities.some(t=>t.team===e.team&&t!==e&&t.downed&&dist(e,t)<120);
    const dx=Math.cos(e.angle),dy=Math.sin(e.angle);
    const dir=Math.abs(dy)>Math.abs(dx)?(dy>0?'down':'up'):'side';
    let fr;
    if(e.downed){
      ctx.filter='brightness(.6)';
      const W=SD.w&&SD.w[e.weaponKey],wd=W&&((W.dead.length&&W.dead)||(SD.w.pistol&&SD.w.pistol.dead.length&&SD.w.pistol.dead));
      if(SD.deadDir)fr=dx<0?SD.deadDir.left:SD.deadDir.right;
      else if(wd)fr=wd[0];else if(SD.dead.length)fr=SD.dead[0];else{fr=SD.down[0];ctx.rotate(1.45);}
    }else if(SD.fire&&SD.fire.length&&a.fireT<SD.fire.length*(SD.fireDt||.15)){
      fr=SD.fire[Math.min(SD.fire.length-1,Math.floor(a.fireT/(SD.fireDt||.15)))];
      if(dx<0)ctx.scale(-1,1);
    }else if(SD.drone&&e.droneState&&e.droneState!=='idle'){
      fr=e.droneState==='launching'?SD.drone.launch[Math.min(SD.drone.launch.length-1,Math.floor((1-(e.droneTimer||0)/5)*SD.drone.launch.length))]:SD.drone.hold[0];
      if(dx<0)ctx.scale(-1,1);
    }else if(AB&&AB[a.abK]&&a.abT<AB[a.abK].length*AB.dt){
      fr=AB[a.abK][Math.floor(a.abT/AB.dt)];
      if(dx<0)ctx.scale(-1,1);
    }else if(IA&&a.mineT<IA.side.length*IA.dt){
      fr=IA.side[Math.floor(a.mineT/IA.dt)];
      if(dx<0&&!IA.noFlip)ctx.scale(-1,1);
    }else if(SD.melee&&SD.melee[e.weaponKey]&&a.meleeT<SD.melee[e.weaponKey].side.length*SD.melee[e.weaponKey].dt){
      const M2=SD.melee[e.weaponKey];fr=M2.side[Math.floor(a.meleeT/M2.dt)];if(dx<0)ctx.scale(-1,1);
    }else if(SD.reload&&SD.reload[e.weaponKey]&&e.reloading){
      const R2=SD.reload[e.weaponKey].side,tot=(WEAPONS[e.weaponKey].reload||1.5)*(e.team==='enemy'?DIFFICULTY.reloadMult:1);
      fr=R2[Math.floor(Math.max(0,Math.min(.999,1-(e.reloadT||0)/tot))*R2.length)];if(dx<0)ctx.scale(-1,1);
    }else if(SD.hold&&SD.hold[e.weaponKey]&&a.mv<.4&&!swapFrame(e,SD,dir,a)){
      fr=SD.hold[e.weaponKey];if(dx<0)ctx.scale(-1,1);
    }else if((fr=swapFrame(e,SD,dir,a))){
      if(dir==='side'&&dx<0)ctx.scale(-1,1);
    }else{
      const wkUse=(a.swapFrom&&a.swapT<.14)?a.swapFrom:e.weaponKey;
      if(a.swapT<.28){const q=Math.sin(Math.PI*a.swapT/.28);ctx.rotate(.07*q);ctx.scale(1,1-.12*q);}
      let row=SD[dir];const W=SD.w&&SD.w[wkUse];
      if(W)row=(W[dir]&&W[dir].length&&W[dir])||(SD.w.pistol&&SD.w.pistol[dir]&&SD.w.pistol[dir].length&&SD.w.pistol[dir])||row;
      const n=row.length;
      fr=row[a.mv>.4?Math.floor(a.d/(n>4?6:11))%n:0];
      const r=a.shot*3-a.melee*6;ctx.translate(-dx*r,-dy*r);
      if(n<3&&a.mv>.4)ctx.translate(0,Math.sin(a.d/3)*.8);
      if(dir==='side'&&dx<0)ctx.scale(-1,1);
    }
    const k=SD.k*(1+.012*Math.sin(now/450+(e.id||0)));ctx.scale(k,k);
    ctx.drawImage(SNI[e.cls],fr[0],fr[1],fr[2],fr[3],-fr[4],-fr[5],fr[2],fr[3]);
  }else{
    if(e.downed){ctx.rotate(ang+1.3);ctx.filter='grayscale(.85) brightness(.55)';}
    else{
      ctx.rotate(ang+(e.reloading?Math.sin(now/55)*.05:0)+Math.sin(a.melee*3.14)*.6+sn*.04*a.mv);
      const r=a.shot*3-a.melee*6;ctx.translate(-c*r,-s*r);
    }
    const k=K*(1+.012*Math.sin(now/450+(e.id||0))+.03*Math.abs(sn)*a.mv)*(e.downed?.9:1);
    ctx.scale(k,k);
    body(I,M,e.downed?0:sn*a.mv*6);
  }
  ctx.restore();
  if(a.shot>.5&&!e.downed){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(253,224,71,'+a.shot+')';
    ctx.beginPath();ctx.arc(e.x+Math.cos(e.angle)*M.tip,e.y+Math.sin(e.angle)*M.tip,3+4*a.shot,0,7);ctx.fill();ctx.restore();
  }
  ctx.textAlign='center';
  if(e.downed){ctx.fillStyle='#ddd';ctx.font='9px "Press Start 2P", monospace';ctx.fillText('ПІДБИТИЙ',e.x,e.y-28);return;}
  if(e.stunT>0){ctx.fillStyle='#ffe45a';ctx.font='11px "Press Start 2P", monospace';ctx.fillText('\u2726',e.x,e.y-48);}
  ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(e.x-18,e.y-38,36,5);
  ctx.fillStyle=e.team==='ally'?'#3b82f6':'#ef4444';ctx.fillRect(e.x-18,e.y-38,36*Math.max(0,e.hp/e.maxHp),5);
  ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='9px sans-serif';
  ctx.fillText(CLASSES[e.cls].icon+(e.isPlayer?' ВИ':''),e.x,e.y-42);
};
window.render=function(){
  _render();
  if(!ctx||!(ok(DRI)||ok(IMG.drone)))return;
  const list=REPLAY.on?RUN.entities.filter(q=>q.droneState==='piloting'&&!q.dead):((RUN.player&&RUN.player.droneState==='piloting')?[RUN.player]:[]);
  if(!list.length)return;
  const D=S.drone,t=performance.now()/1000;
  list.forEach(p=>{
  ctx.save();ctx.scale(currentZoom,currentZoom);ctx.translate(-camX,-camY);
  ctx.imageSmoothingEnabled=true;
  ctx.translate(p.droneX,p.droneY-18+Math.sin(t*5)*1.5);ctx.rotate(Math.sin(t*3)*.06);
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,30,11,5,0,0,7);ctx.fill();
  if(DR&&ok(DRI)){const f=DR.frames[Math.floor(t*10)%DR.frames.length];ctx.scale(DR.k,DR.k);ctx.drawImage(DRI,f[0],f[1],f[2],f[3],-f[4],-f[5],f[2],f[3]);}
  else ctx.drawImage(IMG.drone,-D.w*K/2,-D.h*K/2,D.w*K,D.h*K);
  ctx.restore();
  });
};
})();
