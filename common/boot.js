/* Запуск: початкова побудова екранів (завантажується останнім з основних файлів) */
"use strict";

/* =====================================================================
   NEW ERA OF WAR — браузерна тактична гра (Canvas, без зовнішніх файлів)
   ===================================================================== */

buildModeGrid();

buildDifficultyGrid();

buildMapGrid(); buildSizeGrid(); buildClassGrid(); buildDetails();

/* ---------- ІНІЦІАЛІЗАЦІЯ ---------- */
document.getElementById('optSfx').checked=true;
