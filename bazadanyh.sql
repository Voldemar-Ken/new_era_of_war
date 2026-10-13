BEGIN TRANSACTION;
CREATE TABLE abilities(
  key TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
  is_passive INTEGER NOT NULL DEFAULT 0, cooldown_sec REAL);
INSERT INTO "abilities" VALUES('piercing_shot','Наскрізний постріл','Якщо вбивчий постріл у прицілі завдає більше урону, ніж було в цілі HP — надлишок урону летить далі й вражає наступного на лінії пострілу.',1,NULL);
INSERT INTO "abilities" VALUES('heavy_armor','Важка броня','Мінімальний отриманий урон 0.5 (замість 1). Впритул (0-5px) урону не отримує взагалі.',1,NULL);
INSERT INTO "abilities" VALUES('map_adapted','Пристосований','Дебафи карти на нас не діють: не сповільнюється у болотах/воді, ігнорує від’ємні модифікатори карти (швидкість/броня/маскування/дальність огляду) - бонуси карти лишаються.',1,NULL);
INSERT INTO "abilities" VALUES('splash_stun','Приголомшення вибухом','Вибухи гранатомета оглушують ворогів.',1,NULL);
INSERT INTO "abilities" VALUES('heal_revive','Аура лікування / Порятунок','Лікує союзників поруч і рятує підбитих.',0,30.0);
INSERT INTO "abilities" VALUES('drone','Розвідувальний дрон','Нерухомість під час керування. Радіус виявлення 600 навколо дрона, керування в межах 50 від бійця.',0,20.0);
INSERT INTO "abilities" VALUES('mortar_reveal','Демаскування пострілом','Маскування падає після пострілу з міномета.',1,NULL);
CREATE TABLE class_weapons(
  class_key TEXT NOT NULL REFERENCES classes(key),
  weapon_key TEXT NOT NULL REFERENCES weapons(key),
  slot INTEGER NOT NULL,
  PRIMARY KEY(class_key, weapon_key));
INSERT INTO "class_weapons" VALUES('sniper','sniper_rifle',0);
INSERT INTO "class_weapons" VALUES('sniper','pistol',1);
INSERT INTO "class_weapons" VALUES('sniper','knife',2);
INSERT INTO "class_weapons" VALUES('assault','shotgun',0);
INSERT INTO "class_weapons" VALUES('assault','heavy_mg',1);
INSERT INTO "class_weapons" VALUES('assault','sawed_off',2);
INSERT INTO "class_weapons" VALUES('assault','iron_knuckles',3);
INSERT INTO "class_weapons" VALUES('ranger','assault_rifle',0);
INSERT INTO "class_weapons" VALUES('ranger','pistol',1);
INSERT INTO "class_weapons" VALUES('ranger','bayonet',2);
INSERT INTO "class_weapons" VALUES('grenadier','grenade_launcher',0);
INSERT INTO "class_weapons" VALUES('grenadier','pistol',1);
INSERT INTO "class_weapons" VALUES('grenadier','knife',2);
INSERT INTO "class_weapons" VALUES('medic','pistol',0);
INSERT INTO "class_weapons" VALUES('medic','knife',1);
INSERT INTO "class_weapons" VALUES('fpv','assault_rifle',0);
INSERT INTO "class_weapons" VALUES('fpv','knife',1);
INSERT INTO "class_weapons" VALUES('mortarman','mortar',0);
INSERT INTO "class_weapons" VALUES('mortarman','assault_rifle',1);
INSERT INTO "class_weapons" VALUES('mortarman','pistol',2);
INSERT INTO "class_weapons" VALUES('mortarman','knife',3);
CREATE TABLE classes(
  key TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, color TEXT,
  speed INTEGER NOT NULL, hp INTEGER NOT NULL, armor INTEGER NOT NULL, stealth INTEGER NOT NULL,
  ability_key TEXT NOT NULL REFERENCES abilities(key),
  item_key TEXT REFERENCES items(key),
  role TEXT, sort_order INTEGER NOT NULL);
INSERT INTO "classes" VALUES('sniper','Снайпер','⌁','#facc15',6,110,2,70,'piercing_shot','mine','Точність · маскування',0);
INSERT INTO "classes" VALUES('assault','Штурмовик','▥','#f97316',2,220,10,20,'heavy_armor',NULL,'Броня · прорив',1);
INSERT INTO "classes" VALUES('ranger','Рейнджер','✦','#38bdf8',7,140,5,50,'map_adapted','frag','Мобільність · універсальність',2);
INSERT INTO "classes" VALUES('grenadier','Гранатометчик','✹','#84cc16',4,160,7,30,'splash_stun','energy','Площа · оглушення',3);
INSERT INTO "classes" VALUES('medic','Медик','＋','#4ade80',9,100,3,60,'heal_revive','medkit','Лікування · підтримка',4);
INSERT INTO "classes" VALUES('fpv','Розвідник (FPV)','◉','#a78bfa',6,90,1,10,'drone','frag','Дрон · тактична інформація',5);
INSERT INTO "classes" VALUES('mortarman','Мінометник','◒','#c084fc',1,60,0,90,'mortar_reveal','mine','Дальня підтримка · облога',6);
CREATE TABLE friends(
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(player_id, friend_id), CHECK(player_id<>friend_id));
CREATE TABLE game_modes(
  key TEXT PRIMARY KEY, label TEXT NOT NULL, icon TEXT, description TEXT, team_size INTEGER NOT NULL);
INSERT INTO "game_modes" VALUES('classic','10 на 10','⬢','Класичний склад — усі 7 класів, включно з мінометником і розвідником.',10);
INSERT INTO "game_modes" VALUES('five','5 на 5','⬟','Компактні команди. Мінометник і розвідник (FPV) недоступні — по одному від решти 5 класів.',5);
INSERT INTO "game_modes" VALUES('duel','1 на 1','⚔','Дуель один на один. Доступні всі 7 класів, суперника гра обирає випадково.',1);
CREATE TABLE items(
  key TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, cooldown_sec REAL);
INSERT INTO "items" VALUES('mine','Міна','Ставить пастку. Вибухає під ворогом.',8.0);
INSERT INTO "items" VALUES('frag','Осколкова граната','75 урону у радіусі, кидок по курсору.',12.0);
INSERT INTO "items" VALUES('energy','Енергетик','+3 швидкості на 10с, +10 HP.',14.0);
INSERT INTO "items" VALUES('medkit','Аптечка','Відновлює 60 HP собі або союзнику поруч.',15.0);
CREATE TABLE map_sizes(
  size INTEGER PRIMARY KEY, time_sec INTEGER NOT NULL, label TEXT, description TEXT);
INSERT INTO "map_sizes" VALUES(1000,600,'1000 × 1000','Ближній бій · швидке зіткнення');
INSERT INTO "map_sizes" VALUES(2000,900,'2000 × 2000','Збалансований фронт · рекомендовано');
INSERT INTO "map_sizes" VALUES(3000,1200,'3000 × 3000','Велика операція · розвідка вирішує');
CREATE TABLE maps(
  key TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT,
  speed_mod INTEGER NOT NULL, stealth_mod INTEGER NOT NULL, armor_mod INTEGER NOT NULL,
  range_mod REAL NOT NULL, swamp INTEGER NOT NULL CHECK(swamp IN(0,1)),
  grad_from TEXT, grad_to TEXT, description TEXT);
INSERT INTO "maps" VALUES('snow','Сніги','❄',-3,2,0,1.0,0,'#26313a','#131a1f','Швидкість −3 · Маскування +2');
INSERT INTO "maps" VALUES('desert','Пустиня','☀',0,-1,0,1.5,0,'#5b4526','#1a140b','Маскування −1 · Дальність +50%');
INSERT INTO "maps" VALUES('city','Покинуте місто','▦',-1,0,3,1.0,1,'#3a3a35','#131311','Броня +3 · Швидкість −1');
INSERT INTO "maps" VALUES('field','Поле','⌁',0,-4,0,2.0,1,'#3a4a28','#131a10','Маскування −4 · Дальність +100%');
INSERT INTO "maps" VALUES('forest','Ліс','♣',-1,4,0,0.6,1,'#1e3315','#0a1408','Маскування +4 · Дальність −40%');
CREATE TABLE match_players(
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  class_key TEXT NOT NULL REFERENCES classes(key),
  team TEXT NOT NULL CHECK(team IN('ally','enemy')),
  kills INTEGER NOT NULL DEFAULT 0,
  damage_dealt INTEGER NOT NULL DEFAULT 0,
  survived INTEGER NOT NULL DEFAULT 0 CHECK(survived IN(0,1)),
  is_mvp INTEGER NOT NULL DEFAULT 0 CHECK(is_mvp IN(0,1)),
  PRIMARY KEY(match_id, player_id));
CREATE TABLE matches(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  played_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mode_key TEXT NOT NULL REFERENCES game_modes(key),
  map_key TEXT NOT NULL REFERENCES maps(key),
  map_size INTEGER NOT NULL REFERENCES map_sizes(size),
  winner TEXT CHECK(winner IN('ally','enemy','draw')),
  duration_sec REAL);
CREATE TABLE mode_classes(                      -- які класи доступні в режимі
  mode_key TEXT NOT NULL REFERENCES game_modes(key),
  class_key TEXT NOT NULL REFERENCES classes(key),
  PRIMARY KEY(mode_key, class_key));
INSERT INTO "mode_classes" VALUES('classic','sniper');
INSERT INTO "mode_classes" VALUES('classic','assault');
INSERT INTO "mode_classes" VALUES('classic','ranger');
INSERT INTO "mode_classes" VALUES('classic','grenadier');
INSERT INTO "mode_classes" VALUES('classic','medic');
INSERT INTO "mode_classes" VALUES('classic','fpv');
INSERT INTO "mode_classes" VALUES('classic','mortarman');
INSERT INTO "mode_classes" VALUES('five','sniper');
INSERT INTO "mode_classes" VALUES('five','assault');
INSERT INTO "mode_classes" VALUES('five','ranger');
INSERT INTO "mode_classes" VALUES('five','grenadier');
INSERT INTO "mode_classes" VALUES('five','medic');
INSERT INTO "mode_classes" VALUES('duel','sniper');
INSERT INTO "mode_classes" VALUES('duel','assault');
INSERT INTO "mode_classes" VALUES('duel','ranger');
INSERT INTO "mode_classes" VALUES('duel','grenadier');
INSERT INTO "mode_classes" VALUES('duel','medic');
INSERT INTO "mode_classes" VALUES('duel','fpv');
INSERT INTO "mode_classes" VALUES('duel','mortarman');
CREATE TABLE mode_composition(                  -- типовий склад команди
  mode_key TEXT NOT NULL REFERENCES game_modes(key),
  position INTEGER NOT NULL,
  class_key TEXT NOT NULL REFERENCES classes(key),
  PRIMARY KEY(mode_key, position));
INSERT INTO "mode_composition" VALUES('classic',0,'sniper');
INSERT INTO "mode_composition" VALUES('classic',1,'fpv');
INSERT INTO "mode_composition" VALUES('classic',2,'medic');
INSERT INTO "mode_composition" VALUES('classic',3,'mortarman');
INSERT INTO "mode_composition" VALUES('classic',4,'grenadier');
INSERT INTO "mode_composition" VALUES('classic',5,'assault');
INSERT INTO "mode_composition" VALUES('classic',6,'ranger');
INSERT INTO "mode_composition" VALUES('classic',7,'ranger');
INSERT INTO "mode_composition" VALUES('classic',8,'ranger');
INSERT INTO "mode_composition" VALUES('classic',9,'ranger');
INSERT INTO "mode_composition" VALUES('five',0,'sniper');
INSERT INTO "mode_composition" VALUES('five',1,'medic');
INSERT INTO "mode_composition" VALUES('five',2,'grenadier');
INSERT INTO "mode_composition" VALUES('five',3,'assault');
INSERT INTO "mode_composition" VALUES('five',4,'ranger');
CREATE TABLE players(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO "players" VALUES(1,'Shadow_Wolf','2026-10-08 09:24:42');
INSERT INTO "players" VALUES(2,'Nika','2026-10-08 09:24:42');
INSERT INTO "players" VALUES(3,'Rex_UA','2026-10-08 09:24:42');
CREATE TABLE weapons(
  key TEXT PRIMARY KEY, name TEXT NOT NULL,
  min_range REAL NOT NULL, max_range REAL NOT NULL,
  damage REAL, damage_min REAL, damage_max REAL,
  mag_size INTEGER, max_ammo INTEGER, shot_cooldown REAL, reload_sec REAL,
  bullet_speed REAL, pellets INTEGER, spread_deg REAL, splash_radius REAL,
  is_melee INTEGER NOT NULL DEFAULT 0, color TEXT);
INSERT INTO "weapons" VALUES('sniper_rifle','Снайперська гвинтівка',300.0,900.0,100.0,NULL,NULL,5,30,1.0,5.0,1400.0,NULL,NULL,NULL,0,'#facc15');
INSERT INTO "weapons" VALUES('pistol','Пістолет',0.0,90.0,24.0,NULL,NULL,7,35,0.28,2.0,1100.0,NULL,NULL,NULL,0,'#e5e7eb');
INSERT INTO "weapons" VALUES('shotgun','Дробовик',90.0,150.0,NULL,15.0,45.0,7,25,0.85,4.0,1100.0,5,16.0,NULL,0,'#f97316');
INSERT INTO "weapons" VALUES('heavy_mg','Важкий кулемет',135.0,300.0,22.0,NULL,NULL,50,300,0.1,5.0,1300.0,NULL,NULL,NULL,0,'#fb923c');
INSERT INTO "weapons" VALUES('assault_rifle','Автомат',180.0,450.0,26.0,NULL,NULL,35,150,0.13,3.0,1300.0,NULL,NULL,NULL,0,'#38bdf8');
INSERT INTO "weapons" VALUES('grenade_launcher','Гранатомет',150.0,600.0,70.0,NULL,NULL,6,30,1.3,6.0,820.0,NULL,NULL,45.0,0,'#84cc16');
INSERT INTO "weapons" VALUES('mortar','Міномет',300.0,1650.0,120.0,NULL,NULL,1,20,5.2,0.0,620.0,NULL,NULL,120.0,0,'#c084fc');
INSERT INTO "weapons" VALUES('sawed_off','Обріз',30.0,90.0,NULL,5.0,35.0,2,10,0.6,3.0,1000.0,4,24.0,NULL,0,'#eab308');
INSERT INTO "weapons" VALUES('knife','Ніж',0.0,45.0,20.0,NULL,NULL,NULL,NULL,0.5,NULL,NULL,NULL,NULL,NULL,1,'#cbd5e1');
INSERT INTO "weapons" VALUES('bayonet','Штик-ніж',15.0,60.0,25.0,NULL,NULL,NULL,NULL,0.5,NULL,NULL,NULL,NULL,NULL,1,'#cbd5e1');
INSERT INTO "weapons" VALUES('iron_knuckles','Рукавиці із залізними вставками',0.0,30.0,25.0,NULL,NULL,NULL,NULL,0.42,NULL,NULL,NULL,NULL,NULL,1,'#cbd5e1');
CREATE INDEX idx_mp_player ON match_players(player_id);
CREATE INDEX idx_matches_date ON matches(played_at);
CREATE VIEW v_player_stats AS
SELECT p.id AS player_id, p.nickname,
  COUNT(mp.match_id) AS matches,
  SUM(m.winner=mp.team) AS wins,
  SUM(m.winner IS NOT NULL AND m.winner<>'draw' AND m.winner<>mp.team) AS losses,
  SUM(mp.is_mvp) AS mvp,
  COALESCE(SUM(mp.kills),0) AS total_kills,
  COALESCE(MAX(mp.kills),0) AS best_kills,
  COALESCE(SUM(mp.damage_dealt),0) AS total_damage,
  COALESCE(SUM(mp.survived),0) AS survived
FROM players p
LEFT JOIN match_players mp ON mp.player_id=p.id
LEFT JOIN matches m ON m.id=mp.match_id
GROUP BY p.id;
CREATE VIEW v_player_class_stats AS
SELECT mp.player_id, mp.class_key, COUNT(*) AS played,
  SUM(m.winner=mp.team) AS wins, SUM(mp.kills) AS kills
FROM match_players mp JOIN matches m ON m.id=mp.match_id
GROUP BY mp.player_id, mp.class_key;
CREATE VIEW v_class_full AS
SELECT c.key, c.name, c.speed, c.hp, c.armor, c.stealth, c.role,
  a.name AS ability, i.name AS item,
  (SELECT group_concat(name, ', ') FROM (SELECT w.name AS name FROM class_weapons cw JOIN weapons w ON w.key=cw.weapon_key
    WHERE cw.class_key=c.key ORDER BY cw.slot)) AS weapons
FROM classes c JOIN abilities a ON a.key=c.ability_key LEFT JOIN items i ON i.key=c.item_key
ORDER BY c.sort_order;
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('players',3);
COMMIT;