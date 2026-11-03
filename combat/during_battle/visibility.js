/* Під час бою: видимість і маскування */
"use strict";

const SCOPE_TRAVERSE = 90*Math.PI/180; // снайпер може вести (рухати мишею) лінію прицілу в межах ±90° (180° загалом) від напрямку, зафіксованого на момент прицілювання
const SCOPE_WIDTH_HALF = 5*RSCALE; // ширина самої смуги огляду в прицілі — 10px завширшки (±5px від центральної лінії)
const BASE_VIEW_R = 155*RSCALE; // гарантований базовий огляд навколо КОЖНОГО бійця (незалежно від маскування/прицілу)
function canSee(a,b){
  const d = dist(a,b) / (a.team==='enemy' ? DIFFICULTY.detectMult : 1);
  if(!hasLineOfSight(a,b)) return false;
  // базовий огляд: у межах 155px завжди бачить ворога, хай яке його маскування —
  // це гарантує, що ближній бій ніколи не "ламається" через розрахунки маскування/прицілу
  if(d<=BASE_VIEW_R) return true;
  if(a && a.cls==='sniper' && a.scoped && a.weaponKey==='sniper_rifle'){
    // у прицілі снайпер бачить лише вузьку смугу 10px завширшки вздовж поточного напрямку
    // (курсор лише веде цю смугу в межах ±90° від зафіксованого напрямку), і лише на
    // дальності самої гвинтівки — 100-300px зі специфікації (масштабовано під карту)
    const dx=b.x-a.x, dy=b.y-a.y;
    const along = dx*Math.cos(a.angle)+dy*Math.sin(a.angle);
    const perp = Math.abs(-dx*Math.sin(a.angle)+dy*Math.cos(a.angle));
    const r = wRange(WEAPONS.sniper_rifle);
    return along>=r.minR && along<=r.maxR && perp<=SCOPE_WIDTH_HALF;
  }
  // рейнджер "Пристосований": від'ємний вплив дальності карти (rangeMod<1) на нього не діє,
  // коли САМЕ ВІН виглядає ворогів - карта не може погіршити його огляд, лише покращити
  const rangeMod = MAPS[RUN.mapKey].rangeMod;
  const effRangeMod = (a && a.cls==='ranger') ? Math.max(1.0, rangeMod) : rangeMod;
  const base = 780*effRangeMod;
  const eff = base - effectiveStealth(b)*4.2;
  return d <= Math.max(BASE_VIEW_R, eff);
}
