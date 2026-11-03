/* Карти: укриття, колізії, рух із зіткненням */
"use strict";

/* ---------- УКРИТТЯ / КОЛІЗІЇ ---------- */
function collideCircleAt(x,y,rad,c){
  if(c.shape==='rect'){
    const hw=c.w/2, hh=c.h/2;
    const cx=clamp(x,c.x-hw,c.x+hw), cy=clamp(y,c.y-hh,c.y+hh);
    return Math.hypot(x-cx,y-cy) < rad;
  }
  return Math.hypot(x-c.x,y-c.y) < rad+c.r;
}
function blockedAt(x,y){
  if(!RUN.covers) return false;
  for(const c of RUN.covers){ if(c.blocksLOS && collideCircleAt(x,y,3,c)) return true; }
  return false;
}
function segmentBlocked(a,b){
  if(!RUN.covers || !RUN.covers.length) return false;
  const d = dist(a,b);
  const steps = Math.max(2, Math.floor(d/26));
  for(let i=1;i<steps;i++){
    const t=i/steps;
    const x=a.x+(b.x-a.x)*t, y=a.y+(b.y-a.y)*t;
    if(blockedAt(x,y)) return true;
  }
  return false;
}
function hasLineOfSight(a,b){
  if(dist(a,b)<70) return true; // впритул завжди видно
  return !segmentBlocked(a,b);
}
function nearestCover(x,y,maxDist){
  if(!RUN.covers) return null;
  let best=null,bd=maxDist;
  RUN.covers.forEach(c=>{
    const d=Math.hypot(x-c.x,y-c.y);
    if(d<bd){ bd=d; best=c; }
  });
  return best;
}
// рух із зіткненням об суцільні перешкоди (окремо по осях X/Y — дає ковзання вздовж стін)
function moveEntity(e, nx, ny){
  nx = clamp(nx,20,RUN.mapSize-20); ny = clamp(ny,20,RUN.mapSize-20);
  let blockedX=false, blockedY=false;
  if(RUN.covers){
    for(const c of RUN.covers){
      if(!c.solid) continue;
      if(collideCircleAt(nx, e.y, e.radius, c)) blockedX=true;
      if(collideCircleAt(e.x, ny, e.radius, c)) blockedY=true;
    }
  }
  if(!blockedX) e.x = nx;
  if(!blockedY) e.y = ny;
}
/* Карти: дані карт і розмірів */

/* ---------- ДАНІ: КАРТИ ---------- */

const MAPS = {
  snow:  {name:'Сніги',           icon:'❄', speedMod:-3, stealthMod:+2, armorMod:0, rangeMod:1.0, grad:['#26313a','#131a1f'], swamp:false, desc:'Швидкість −3 · Маскування +2'},
  desert:{name:'Пустиня',         icon:'☀', speedMod:0,  stealthMod:-1, armorMod:0, rangeMod:1.5, grad:['#5b4526','#1a140b'], swamp:false, desc:'Маскування −1 · Дальність +50%'},
  city:  {name:'Покинуте місто',  icon:'▦', speedMod:-1, stealthMod:0,  armorMod:3, rangeMod:1.0, grad:['#3a3a35','#131311'], swamp:true,  desc:'Броня +3 · Швидкість −1'},
  field: {name:'Поле',            icon:'⌁', speedMod:0,  stealthMod:-4, armorMod:0, rangeMod:2.0, grad:['#3a4a28','#131a10'], swamp:true,  desc:'Маскування −4 · Дальність +100%'},
  forest:{name:'Ліс',             icon:'♣', speedMod:-1, stealthMod:+4, armorMod:0, rangeMod:0.6, grad:['#1e3315','#0a1408'], swamp:true,  desc:'Маскування +4 · Дальність −40%'}
};
const SIZES = [
  {size:1000, time:600,  label:'1000 × 1000', desc:"Ближній бій · швидке зіткнення"},
  {size:2000, time:900,  label:'2000 × 2000', desc:'Збалансований фронт · рекомендовано'},
  {size:3000, time:1200, label:'3000 × 3000', desc:'Велика операція · розвідка вирішує'}
];
/* Карти: генерація рельєфу */

/* ---------- ГЕНЕРАЦІЯ РЕЛЬЄФУ КАРТИ ---------- */
function buildMapLayout(mapKey, ms, seed, allyBase, enemyBase, cap, capR){
  const rng = seededRng(seed);
  const covers=[], swamps=[];
  function clearOfBases(x,y,pad){
    return Math.hypot(x-allyBase.x,y-allyBase.y)>150+pad && Math.hypot(x-enemyBase.x,y-enemyBase.y)>150+pad;
  }
  function clearOfCap(x,y,pad){ return Math.hypot(x-cap.x,y-cap.y) > capR+pad; }

  if(mapKey==='city'){
    // квартали покинутого міста: прямокутні будівлі вздовж вулиць
    const cell = ms/9;
    for(let gx=0;gx<9;gx++) for(let gy=0;gy<9;gy++){
      if(rng()>0.52) continue;
      const cx = cell*gx+cell*0.5+rand(-cell*0.1,cell*0.1);
      const cy = cell*gy+cell*0.5+rand(-cell*0.1,cell*0.1);
      if(!clearOfBases(cx,cy,50) || !clearOfCap(cx,cy,60)) continue;
      const w = cell*rand(0.4,0.62), h = cell*rand(0.4,0.62);
      covers.push({x:cx,y:cy,w,h,shape:'rect',solid:true,blocksLOS:true,fill:'#3a3a35',stroke:'#54544c'});
    }
  } else if(mapKey==='desert'){
    // скельні виходи та піщані дюни, розкидані рідше — відкриті прострільні коридори
    const n = Math.max(8,Math.floor(ms/300));
    for(let i=0;i<n;i++){
      const x=rng()*ms, y=rng()*ms;
      if(!clearOfBases(x,y,40) || !clearOfCap(x,y,50)) continue;
      const clusters = 1+Math.floor(rng()*3);
      for(let k=0;k<clusters;k++){
        covers.push({x:x+rand(-40,40),y:y+rand(-40,40),r:rand(22,48),shape:'circle',solid:true,blocksLOS:true,fill:'#8a5a2e',stroke:'#c2793e'});
      }
    }
    for(let i=0;i<Math.max(2,Math.floor(ms/900));i++){
      swamps.push({x:rng()*ms,y:rng()*ms,r:rand(140,240),fill:'rgba(230,190,120,0.18)'});
    }
  } else if(mapKey==='field'){
    // відкрите поле: рідкі кущі/дерева, кілька заболочених ділянок
    const n = Math.max(10,Math.floor(ms/260));
    for(let i=0;i<n;i++){
      const x=rng()*ms, y=rng()*ms;
      if(!clearOfBases(x,y,30) || !clearOfCap(x,y,40)) continue;
      covers.push({x,y,r:rand(13,24),shape:'circle',solid:true,blocksLOS:true,fill:'#3f5f28',stroke:'#5c8a3a'});
    }
    for(let i=0;i<Math.max(2,Math.floor(ms/950));i++){
      swamps.push({x:rng()*ms,y:rng()*ms,r:rand(90,170),fill:'rgba(90,110,60,0.28)'});
    }
  } else if(mapKey==='snow'){
    // засніжена місцевість: льодові валуни, рідкісні ялини, замерзле озеро
    const n = Math.max(9,Math.floor(ms/280));
    for(let i=0;i<n;i++){
      const x=rng()*ms, y=rng()*ms;
      if(!clearOfBases(x,y,40) || !clearOfCap(x,y,50)) continue;
      covers.push({x,y,r:rand(18,36),shape:'circle',solid:true,blocksLOS:true,fill:'#324352',stroke:'#5b7a8c'});
    }
    const lakeCount = Math.max(1,Math.floor(ms/1400));
    for(let i=0;i<lakeCount;i++){
      swamps.push({x:ms*rand(0.3,0.7),y:ms*rand(0.3,0.7),r:ms*rand(0.09,0.14),fill:'rgba(180,220,245,0.22)'});
    }
  } else if(mapKey==='forest'){
    // густий ліс: дерева розкидані по всій карті (значно щільніше, ніж на полі),
    // і дві великі болотисті ділянки — компонування за наданим ескізом карти
    // (сині/червоні бази по кутах, жовта зона захвату в центрі, болота між ними).
    const n = Math.max(26,Math.floor(ms/95));
    for(let i=0;i<n;i++){
      const x=rng()*ms, y=rng()*ms;
      if(!clearOfBases(x,y,35) || !clearOfCap(x,y,45)) continue;
      covers.push({x,y,r:rand(12,22),shape:'circle',solid:true,blocksLOS:true,fill:'#2c4a1d',stroke:'#4a7030'});
    }
    swamps.push({x:ms*0.12,y:ms*0.30,r:ms*rand(0.08,0.11),fill:'rgba(70,90,45,0.35)'});
    swamps.push({x:ms*0.88,y:ms*0.62,r:ms*rand(0.08,0.11),fill:'rgba(70,90,45,0.35)'});
  }
  return {covers, swamps};
}
/* Карти: текстури землі й укриттів */

// procedural dithered ground tile per map (cached per mapKey)
const GROUND_TILE_CACHE={};
function groundTile(mapKey){
  if(GROUND_TILE_CACHE[mapKey]) return GROUND_TILE_CACHE[mapKey];
  const PAL = {
    snow:{base:'#dfeaf0',dots:['#c9dbe6','#eef6fa','#b9cedd']},
    desert:{base:'#d9b876',dots:['#c9a55f','#e6c88c','#b98f4d']},
    city:{base:'#4c4c47',dots:['#3f3f3a','#5a5a53','#333330']},
    field:{base:'#4f6e33',dots:['#446028','#5c7d3f','#3c5726']},
    forest:{base:'#203a17',dots:['#183012','#2c4a20','#14260e']}
  }[mapKey];
  const T=32, cv=document.createElement('canvas'); cv.width=T; cv.height=T;
  const g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
  g.fillStyle=PAL.base; g.fillRect(0,0,T,T);
  const rnd=seededRng(mapKey.length*97+13);
  const px=4;
  for(let y=0;y<T;y+=px) for(let x=0;x<T;x+=px){
    if(rnd()<0.22){ g.fillStyle=PAL.dots[Math.floor(rnd()*PAL.dots.length)]; g.fillRect(x,y,px,px); }
  }
  GROUND_TILE_CACHE[mapKey]=cv; return cv;
}
// procedural dithered fill for a cover shape (building/rock/bush/ice)
function hexShade(hex, amt){
  const n=parseInt(hex.replace('#',''),16);
  let r=(n>>16)+amt, g2=((n>>8)&255)+amt, b=(n&255)+amt;
  r=clamp(r,0,255); g2=clamp(g2,0,255); b=clamp(b,0,255);
  return '#'+((1<<24)+(r<<16)+(g2<<8)+b).toString(16).slice(1);
}
function coverPattern(baseColor, seedStr){
  const key='cov_'+baseColor;
  if(PXCACHE[key]) return PXCACHE[key];
  const altColor = hexShade(baseColor, 26), altColor2 = hexShade(baseColor,-22);
  const T=16, cv=document.createElement('canvas'); cv.width=T; cv.height=T;
  const g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
  g.fillStyle=baseColor; g.fillRect(0,0,T,T);
  const rnd=seededRng((seedStr||baseColor).length*53+7);
  const px=4;
  for(let y=0;y<T;y+=px) for(let x=0;x<T;x+=px){
    const r=rnd();
    if(r<0.22){ g.fillStyle=altColor; g.fillRect(x,y,px,px); }
    else if(r>0.85){ g.fillStyle=altColor2; g.fillRect(x,y,px,px); }
  }
  const pat=ctxGlobalPatternHost.createPattern(cv,'repeat');
  PXCACHE[key]=pat; return pat;
}
let ctxGlobalPatternHost=null; // assigned once main ctx exists (see resizeCanvas)
