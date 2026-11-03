/* Під час бою: клавіатура */
"use strict";

window.addEventListener('keydown',e=>{
  const wasDown = keys[e.code];
  keys[e.code]=true;
  if(!RUN.active) return;
  if(e.code==='KeyR') tryReload(RUN.player);
  if(e.code==='KeyE') tryAbility(RUN.player);
  if(e.code==='KeyQ') tryItem(RUN.player);
  if(['Digit1','Digit2','Digit3','Digit4'].includes(e.code)){
    const idx = parseInt(e.code.slice(-1),10)-1;
    if(RUN.player) switchWeapon(RUN.player,{index:idx});
  }
  if(e.code==='Space'){
    e.preventDefault();
    // снайпер: пробіл перемикає приціл (перше-особове наближення, вузька смуга огляду 100-300px/10px)
    // замість пострілу — вогонь для снайпера лишається на ЛКМ. Приціл можна увімкнути
    // лише коли в руках снайперська гвинтівка (з іншою зброєю оптика недоступна).
    if(!wasDown && RUN.player && RUN.player.cls==='sniper' && !RUN.player.downed && !RUN.player.dead){
      if(!RUN.player.scoped && RUN.player.weaponKey!=='sniper_rifle'){
        toast('Приціл доступний лише зі снайперською гвинтівкою в руках');
      } else {
        RUN.player.scoped = !RUN.player.scoped;
        if(RUN.player.scoped) RUN.player.scopeBaseAngle = RUN.player.angle;
        toast(RUN.player.scoped ? 'Приціл: увімкнено (смуга 100-300px/10px, хід \u00b190\u00b0)' : 'Приціл: вимкнено');
        SND.scope();
      }
    }
  }
  if(e.code==='Escape') endMission();
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
