/* Піксель-арт: спрайти класів, мертвий боєць, прапор */
"use strict";

/* =====================================================================
   ПІКСЕЛЬ-АРТ: генерація спрайтів на офскрін-канвасі (чіткі пікселі
   без розмиття завдяки imageSmoothingEnabled=false), один раз кожен,
   потім лише масштабуються при відмальовці.
   ===================================================================== */
const PXCACHE = {};
function buildPixelCanvas(rows, palette, pxSize){
  const h=rows.length, w=rows[0].length;
  const cv=document.createElement('canvas'); cv.width=w*pxSize; cv.height=h*pxSize;
  const g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
  // Спочатку розв'язуємо колір кожного пікселя (чи прозорий) у звичайну сітку,
  // щоб другим проходом додати автоматичне "скошування" (світло зверху-зліва,
  // тінь знизу-справа) — це надає глибини навіть простим одноколірним фігурам,
  // без ручного перемальовування кожного спрайту в кілька відтінків.
  const resolved = [];
  for(let y=0;y<h;y++){
    resolved.push([]);
    for(let x=0;x<w;x++){
      const ch=rows[y][x];
      resolved[y].push(ch==='.' ? null : (palette[ch]||null));
    }
  }
  const at = (x,y) => (y>=0 && y<h && x>=0 && x<w) ? resolved[y][x] : null;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const col = resolved[y][x]; if(!col) continue;
    let shaded = col;
    const litSide = (at(x-1,y)===null || at(x,y-1)===null);
    const darkSide = (at(x+1,y)===null || at(x,y+1)===null);
    if(litSide) shaded = hexShade(col, 26);
    else if(darkSide) shaded = hexShade(col, -24);
    g.fillStyle=shaded; g.fillRect(x*pxSize,y*pxSize,pxSize,pxSize);
  }
  return cv;
}
// Індивідуальний піксель-силует для кожного класу (14x14 база + власна зброя/деталі
// збоку чи зверху, на полотні 20x16). Спільні літери: D=темний кант, H=шолом,
// a=обличчя, B=торс(колір команди), A=руки, L=ноги, C=акцент класу (колір C з CLASSES).
// Додаткові по класах: W=зброя(гунметал), w/o=яскравий акцент(=колір класу),
// R=сумка медика(білий), c=хрест медика(червоний).
const SNIPER_ROWS = [
  '....................',
  '....................',
  '....................',
  '......DHHHHD........',
  '.....DHHHHHHD.......',
  '.....DHaaaaHD.......',
  '.....DDHHHHDD.......',
  '....CBBBBBBBBC....w.',
  '...ABBBBBBBBBBAWWWWW',
  '...ABBBBBBBBBBAW....',
  '....CBBBBBBBBC......',
  '....BB......BB......',
  '....BB......BB......',
  '....LL......LL......',
  '...DLL......LLD.....',
  '....................',
];
// W=barrel(gunmetal #2b2f26), w=scope(class accent)

const ASSAULT_ROWS = [
  '....................',
  '....................',
  '....................',
  '......DHHHHD........',
  '.....DHHHHHHD.......',
  '.....DHaaaaHD.......',
  '.....DDHHHHDD.......',
  '....CBBBBBBBBC..WWW.',
  '...ABBBBBBBBBBAWWWWW',
  '...ABBBBBBBBBBA.WWW.',
  '....CBBBBBBBBC......',
  '....BB......BB......',
  '....BB......BB......',
  '....LL......LL......',
  '...DLL......LLD.....',
  '....................',
];
// W=gun(gunmetal)

const RANGER_ROWS = [
  '....................',
  '....................',
  '....................',
  '......DHHHHD........',
  '.....DHHHHHHD.......',
  '.....DHaaaaHD.......',
  '.....DDHHHHDD.......',
  '....CBBBBBBBBC......',
  '...ABBBBBBBBBBAWWWWw',
  '...ABBBBBBBBBBAW....',
  '....CBBBBBBBBC......',
  '....BB......BB......',
  '....BB......BB......',
  '....LL......LL......',
  '...DLL......LLD.....',
  '....................',
];
// W=barrel(gunmetal), w=bayonet tip(class accent, bright)

const GRENADIER_ROWS = [
  '....................',
  '....................',
  '....................',
  '......DHHHHD........',
  '.....DHHHHHHD.......',
  '.....DHaaaaHD.......',
  '.....DDHHHHDD.......',
  '....CBBBBBBBBC..WoW.',
  '...ABBBBBBBBBBAWWWWW',
  '...ABBBBBBBBBBA.WWW.',
  '....CBBBBBBBBC......',
  '....BB......BB......',
  '....BB......BB......',
  '....LL......LL......',
  '...DLL......LLD.....',
  '....................',
];
// W=tube(gunmetal), o=round highlight(class accent)

const MEDIC_ROWS = [
  '....................',
  '....................',
  '....................',
  '......DHHHHD........',
  '.....DHHHHHHD.......',
  '.....DHaaaaHD.......',
  '.....DDHHHHDD.......',
  '....CBBBBBBBBC......',
  '...ABBBBBBBBBBA.....',
  '...ABBBBBBBBBBA.RRR.',
  '....CBBBBBBBBC..RcR.',
  '....BB......BB......',
  '....BB......BB......',
  '....LL......LL......',
  '...DLL......LLD.....',
  '....................',
];
// R=bag(#e8e8e8 white), c=cross(#ef4444 red)

const FPV_ROWS = [
  '.........w..........',
  '.........w..........',
  '....................',
  '......DHHHHD........',
  '.....DHHHHHHD.......',
  '.....DHaaaaHD.......',
  '.....DDHHHHDD.......',
  '....CBBBBBBBBC......',
  '...ABoBBBBBBBBA.....',
  '...ABBBBBBBBBBA.....',
  '....CBBBBBBBBC......',
  '....BB......BB......',
  '....BB......BB......',
  '....LL......LL......',
  '...DLL......LLD.....',
  '....................',
];
// w=antenna(class accent), o=chest device(class accent)

const MORTARMAN_ROWS = [
  '..........W.........',
  '.........WWW........',
  '..........W.........',
  '......DHHHHD........',
  '.....DHHHHHHD.......',
  '.....DHaaaaHD.......',
  '.....DDHHHHDD.......',
  '....CBBBBBBBBC......',
  '...ABBBBBBBBBBA.....',
  '...ABBBBBBBBBBA.....',
  '....CBBBBBBBBC......',
  '....BB......BB......',
  '....BB......BB......',
  '....LL......LL......',
  '...DLL......LLD.....',
  '....................',
];
// W=tube(gunmetal)
const CLASS_SPRITE_ROWS = {
  sniper:SNIPER_ROWS, assault:ASSAULT_ROWS, ranger:RANGER_ROWS, grenadier:GRENADIER_ROWS,
  medic:MEDIC_ROWS, fpv:FPV_ROWS, mortarman:MORTARMAN_ROWS
};
function classPalette(teamColor, accent){
  return {D:'#101410',H:'#1c1f1a',a:'#e0b892',B:teamColor,A:'#262a22',C:accent,L:'#20231d',
          W:'#2b2f26', w:accent, o:accent, R:'#e8e8e8', c:'#ef4444'};
}
function soldierSprite(clsKey, teamColor, accent, pxSize){
  const key='sold_'+clsKey+'_'+teamColor+'_'+accent+'_'+pxSize;
  if(PXCACHE[key]) return PXCACHE[key];
  const rows = CLASS_SPRITE_ROWS[clsKey] || SNIPER_ROWS;
  const cv=buildPixelCanvas(rows, classPalette(teamColor,accent), pxSize);
  PXCACHE[key]=cv; return cv;
}
function getUnitSprite(e){
  const cls=CLASSES[e.cls];
  const teamColor = e.isPlayer? '#a3e635' : (e.team==='ally' ? '#3b6fb0' : '#a23a3a');
  const px = Math.max(2, Math.round(e.radius*2/14*1.35));
  return soldierSprite(e.cls, teamColor, cls.color, px);
}
// downed marker (small pixel skull-ish X)
const DOWNED_ROWS=['.X...X.','..X.X..','...X...','..X.X..','.X...X.'];
function downedSprite(pxSize){
  const key='down_'+pxSize; if(PXCACHE[key]) return PXCACHE[key];
  const cv=buildPixelCanvas(DOWNED_ROWS,{X:'#e5e7eb'},pxSize); PXCACHE[key]=cv; return cv;
}
// small pixel flag used on bases/capture point
const FLAG_ROWS=['X....','XFFF.','XFFF.','X....','X....','X....'];
function flagSprite(color,pxSize){
  const key='flag_'+color+'_'+pxSize; if(PXCACHE[key]) return PXCACHE[key];
  const cv=buildPixelCanvas(FLAG_ROWS,{X:'#3a3a30',F:color},pxSize); PXCACHE[key]=cv; return cv;
}
