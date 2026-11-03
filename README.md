# NEW ERA OF WAR

Запуск: відкрийте `start.html` у браузері (або Live Server у VS Code). Інтернет потрібен лише для шрифтів.

## Структура

| Папка / файл | Що всередині |
|---|---|
| `characters/` | `classes.js`, `wepons.js` (зброя: дані, стрільба, ближній бій, міномет), `items.js` (предмети й міни), `abilities.js` (вміння й дрон), `entity.js`, `sprites/` |
| `game_logic.js` | складність, режими, стан вибору, статистика гравця |
| `combat/before_battle.js` | таймер вибору персонажа, старт матчу |
| `combat/during_battle/` + `update.js`, `demg.js` | цикл бою, гравець, боти, кулі, шкода, вибухи, видимість, точка захоплення |
| `combat/after_battle.js` | завершення бою, таблиця статистики, умови перемоги |
| `combat/map.js` | карти, рельєф, текстури, колізії |
| `online/` | режим онлайн, лобі, друзі, пошук гравців |
| `interface/` | `styles/`, `navigation.js`, `resolution.js`, `screens/` (`select.js`, ...), `battle/` |
| `replays/` | `recording/recorder.js` (запис), `replays_library.js` (файли, сховище, список), `replays_viewing.js` (перегляд), `recording/save_after_battle.js` |
| `common/` | константи, утиліти, звук, `boot.js` |

## Важливо

Файли — звичайні скрипти (не модулі), тому **порядок `<script>` у `start.html` важливий**.
Кожен новий файл додавайте в `start.html` у потрібний блок. Спільні функції й константи
доступні між файлами без імпортів, але файл не може виконувати код з ними на старті, поки вони не підключені вище.

Правила порядку:
- `common/boot.js` — після всіх файлів, що будують екрани;
- `combat/after_battle.js` — після `game_loop.js` і `demg.js` (обгортає `update` і `dealDamage`);
- блок «Доповнення» й «Повтори» — в кінці, у тому ж порядку.
