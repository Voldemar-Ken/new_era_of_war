/* Інтерфейс: екран «Деталі гри» */
"use strict";

function buildDetails(){
  const el=document.getElementById('detailsBody');
  el.innerHTML=`
  <section class="panel" style="padding:22px;">
    <h2 class="heading" style="color:var(--primary);margin-top:0;">Умови перемоги</h2>
    <p class="muted">Захопіть центральну точку та утримуйте її 100 секунд поспіль (без опору ворога), простійте на ворожій базі понад 20 секунд, або знищіть весь боєздатний склад противника. Якщо час бою вийде — перемагає команда, яка утримує точку, або з більшою кількістю бійців.</p>
  </section>
  <section class="panel" style="padding:22px;">
    <h2 class="heading" style="color:var(--primary);margin-top:0;">Карти та модифікатори</h2>
    <div class="grid2">${Object.values(MAPS).map(m=>`<div style="border:1px solid rgba(255,255,255,.1);padding:12px;"><b>${m.icon} ${m.name}</b><p class="muted" style="margin:6px 0 0;">${m.desc}</p></div>`).join('')}</div>
  </section>
  <section class="panel" style="padding:22px;">
    <h2 class="heading" style="color:var(--primary);margin-top:0;">Персонажі</h2>
    <p class="muted" style="margin-bottom:16px;">7 спеціалістів, команда з 10 бійців: до 1 снайпера, до 1 розвідника, до 1 медика, до 1 мінометника, до 2 гранатометчиків, до 2 штурмовиків та 3-5 рейнджерів.<br>Броня діє напряму: <b style="color:var(--text);">1 броня = −1 до урону</b> від кожного влучання (мінімум 1 урон завжди проходить).</p>
    <div style="display:grid;gap:14px;">${CLASS_ORDER.map(ck=>classDetailCard(ck)).join('')}</div>
  </section>
  <section class="panel" style="padding:22px;">
    <h2 class="heading" style="color:var(--primary);margin-top:0;">Керування</h2>
    <p class="muted">WASD — рух, миша — приціл, ЛКМ/Пробіл — вогонь, R — перезарядка, Колесо миші/1-4 — зброя, E — здібність, Q — спорядження.<br>
    <b style="color:var(--text);">Снайпер:</b> Пробіл замість вогню вмикає оптичний приціл від першої особи — нерухомо, бачить лише вузьку смугу 100-300px завдовжки і 10px завширшки вздовж лінії прицілу; курсор веде цю лінію в межах ±90° від зафіксованого напрямку, все поза смугою — чорне.<br>
    <b style="color:var(--text);">Мінометник:</b> клік по мінікарті скеровує снаряд по дузі через будь-які укриття; влучання має розкид ~10px від вказаної точки. Поки міномет у руках, мінометник нерухомий — щоб іти, потрібно перемкнути зброю.</p>
  </section>`;
}
/* Картка персонажа для довідника: характеристики, вміння, і нижче — кожен вид
   зброї з власними характеристиками (урон, дальність, боєзапас, перезарядка). */
function weaponStatLine(wk){
  const w = WEAPONS[wk];
  const parts = [];
  if(w.melee){
    parts.push('Урон '+w.dmg);
    parts.push('Дальність 0-'+Math.round(w.maxR/RSCALE)+'px');
    parts.push('Темп '+w.shotCd.toFixed(2)+'с/удар');
    parts.push('Боєзапас: необмежено');
  } else {
    parts.push(w.dmgMax!=null ? ('Урон '+w.dmgMin+'-'+w.dmgMax+' (за дальністю)') : ('Урон '+w.dmg));
    parts.push('Дальність '+Math.round(w.minR/RSCALE)+'-'+Math.round(w.maxR/RSCALE)+'px');
    if(w.pellets) parts.push(w.pellets+' шроти, розкид ±'+w.spreadDeg+'°');
    parts.push('Магазин '+w.mag+'/'+w.maxAmmo);
    parts.push('Темп '+w.shotCd.toFixed(2)+'с/постріл');
    parts.push('Перезарядка '+(w.reload||0).toFixed(1)+'с');
    if(w.splash) parts.push('Сплеш-радіус '+Math.round(w.splash/RSCALE)+'px');
  }
  return `<div style="border:1px solid rgba(255,255,255,.08);border-left:2px solid ${WEAPONS[wk].color||'#888'};padding:8px 10px;">
    <b style="font-size:.82rem;">${w.name}</b>
    <div class="muted" style="font-size:.68rem;margin-top:3px;line-height:1.6;">${parts.join(' · ')}</div>
  </div>`;
}
function classDetailCard(ck){
  const c = CLASSES[ck];
  const ab = ABILITIES[c.ability];
  const it = c.item ? ITEMS[c.item] : null;
  return `<div style="border:1px solid rgba(214,168,79,.25);padding:16px;border-radius:8px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;">
      <div><span style="font-size:1.5rem;color:${c.color};">${c.icon}</span> <b class="heading" style="font-size:1rem;">${c.name}</b></div>
      <span class="muted" style="font-size:.7rem;">${c.role}</span>
    </div>
    <div class="statrow" style="margin-top:10px;">
      <span>HP <b>${c.hp}</b></span><span>ШВИДКІСТЬ <b>${c.speed}px/с</b></span><span>БРОНЯ <b>${c.armor}</b></span><span>МАСКУВАННЯ <b>${c.stealth}</b></span>
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:rgba(163,230,53,.06);border-left:2px solid var(--primary);">
      <b style="font-size:.78rem;color:var(--primary);">Вміння: ${ab.name}</b>
      <div class="muted" style="font-size:.72rem;margin-top:2px;">${ab.desc}${ab.passive?' (пасивне)':(' · перезарядка '+ab.cd+'с')}</div>
    </div>
    ${it?`<div style="margin-top:8px;padding:8px 10px;background:rgba(255,255,255,.03);border-left:2px solid var(--gold,#d6a84f);">
      <b style="font-size:.78rem;">Спорядження: ${it.name}</b>
      <div class="muted" style="font-size:.72rem;margin-top:2px;">${it.desc} · перезарядка ${it.cd}с</div>
    </div>`:''}
    <div class="muted" style="font-size:.68rem;margin-top:12px;margin-bottom:6px;letter-spacing:.05em;">ЗБРОЯ (${c.weapons.length}, перемикання колесом миші/1-${c.weapons.length})</div>
    <div style="display:grid;gap:6px;">${c.weapons.map(wk=>weaponStatLine(wk)).join('')}</div>
  </div>`;
}
