/* Перед боєм: таймер вибору персонажа */

/* ---------- ТАЙМЕР ВИБОРУ ПЕРСОНАЖА (30с + 10с додаткового часу) ---------- */
let classTimerHandle=null;
function startClassTimer(){
  stopClassTimer();
  let t=30, extra=false;
  const box=document.getElementById('classTimerBox'), num=document.getElementById('classTimerNum'), lbl=document.getElementById('classTimerLabel');
  box.style.display='flex'; num.textContent=t; num.style.color='var(--primary)';
  lbl.textContent='⏱ Час на вибір:'; lbl.style.color='';
  classTimerHandle = setInterval(()=>{
    t--;
    if(t<=0 && !extra){ extra=true; t=10; num.style.color='#ef4444'; lbl.style.color='#ef4444'; lbl.textContent='⏱ Додатковий час:'; }
    else if(t<=0 && extra){
      clearInterval(classTimerHandle); classTimerHandle=null;
      const keys=GAME_MODE.classOrder; CHOICE.cls = keys[Math.floor(Math.random()*keys.length)];
      startMatch();
      return;
    }
    num.textContent=t;
  }, 1000);
}
function stopClassTimer(){
  if(classTimerHandle){ clearInterval(classTimerHandle); classTimerHandle=null; }
  const box=document.getElementById('classTimerBox'); if(box) box.style.display='none';
}

/* Перед боєм: старт матчу */

/* ---------- СТАРТ МАТЧУ ---------- */
function startMatch(){
  RUN = {
    active:true, mapKey:CHOICE.map, sizeInfo:CHOICE.size, playerCls:CHOICE.cls,
    mapSize:CHOICE.size.size, timeLeft:CHOICE.size.time, radarTimer:0, radarActive:0,
    entities:[], bullets:[], mines:[], particles:[], mortarMarkers:[],
    captureHold:{ally:0,enemy:0}, captureLeader:null,
    baseHold:{ally:0,enemy:0},
    ended:false, seed: Math.floor(Math.random()*99999)
  };
  logLines=[];
  const ms = RUN.mapSize;
  const allyBase = {x:130,y:ms-130};
  const enemyBase = {x:ms-130,y:130};
  const cap = {x:ms/2,y:ms/2};
  RUN.allyBase=allyBase; RUN.enemyBase=enemyBase; RUN.capture=cap; RUN.capRadius=Math.max(120,ms*0.09);

  // формуємо команди
  const rng = seededRng(RUN.seed);
  function spawnTeam(team, base, comp, playerCls){
    let placedPlayer=false;
    comp.forEach((clsKey,i)=>{
      const isP = (team==='ally' && !placedPlayer && clsKey===playerCls);
      const ang = rng()*Math.PI*2, r=rng()*90;
      const x = clamp(base.x+Math.cos(ang)*r,40,ms-40);
      const y = clamp(base.y+Math.sin(ang)*r,40,ms-40);
      const ent = makeEntity(team,clsKey,x,y, isP);
      if(isP){ placedPlayer=true; RUN.player=ent; }
      RUN.entities.push(ent);
    });
  }
  let allyComp, enemyComp;
  if(GAME_MODE.key==='duel'){
    allyComp = [CHOICE.cls];
    const pool = GAME_MODE.classOrder;
    enemyComp = [pool[Math.floor(Math.random()*pool.length)]];
  } else { allyComp = GAME_MODE.composition; enemyComp = GAME_MODE.composition; }
  spawnTeam('ally',allyBase,allyComp,CHOICE.cls);
  spawnTeam('enemy',enemyBase,enemyComp,null);

  // рельєф карти — власна структура для кожної з 4 карт, детерміновано за сідом
  const layout = buildMapLayout(RUN.mapKey, ms, RUN.seed+7, allyBase, enemyBase, cap, RUN.capRadius);
  RUN.covers = layout.covers; RUN.swamps = layout.swamps;

  const diffTag = VIA_ONLINE ? '' : ` // ${DIFFICULTY.label.toUpperCase()}`;
  document.getElementById('opLabel').textContent = `ОПЕРАЦІЯ: ${MAPS[RUN.mapKey].name.toUpperCase()} // MAP ${ms} // ${GAME_MODE.label}${diffTag}`;
  goto_('battle');
  pushLog(`Місію розпочато. Клас: ${CLASSES[CHOICE.cls].name}.`);
  RUN.lastT = performance.now();
  requestAnimationFrame(loop);
}
