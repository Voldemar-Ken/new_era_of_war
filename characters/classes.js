/* Персонажі: класи (CLASSES), порядок і склад команди */
"use strict";

/* ---------- ДАНІ: КЛАСИ ---------- */
const CLASSES = {
  sniper:{name:'Снайпер',icon:'⌁',color:'#facc15',speed:6,hp:110,armor:2,stealth:70,weapons:['sniper_rifle','pistol','knife'],ability:'piercing_shot',item:'mine',role:'Точність · маскування'},
  assault:{name:'Штурмовик',icon:'▥',color:'#f97316',speed:2,hp:220,armor:10,stealth:20,weapons:['shotgun','heavy_mg','sawed_off','iron_knuckles'],ability:'heavy_armor',item:null,role:'Броня · прорив'},
  ranger:{name:'Рейнджер',icon:'✦',color:'#38bdf8',speed:7,hp:140,armor:5,stealth:50,weapons:['assault_rifle','pistol','bayonet'],ability:'map_adapted',item:'frag',role:'Мобільність · універсальність'},
  grenadier:{name:'Гранатометчик',icon:'✹',color:'#84cc16',speed:4,hp:160,armor:7,stealth:30,weapons:['grenade_launcher','pistol','knife'],ability:'splash_stun',item:'energy',role:'Площа · оглушення'},
  medic:{name:'Медик',icon:'＋',color:'#4ade80',speed:9,hp:100,armor:3,stealth:60,weapons:['pistol','knife'],ability:'heal_revive',item:'medkit',role:'Лікування · підтримка'},
  fpv:{name:'Розвідник (FPV)',icon:'◉',color:'#a78bfa',speed:6,hp:90,armor:1,stealth:10,weapons:['assault_rifle','knife'],ability:'drone',item:'frag',role:'Дрон · тактична інформація'},
  mortarman:{name:'Мінометник',icon:'◒',color:'#c084fc',speed:1,hp:60,armor:0,stealth:90,weapons:['mortar','assault_rifle','pistol','knife'],ability:'mortar_reveal',item:'mine',role:'Дальня підтримка · облога'}
};
const CLASS_ORDER = ['sniper','assault','ranger','grenadier','medic','fpv','mortarman'];
// Склад команди 10 бійців: 0-1 снайпер,0-1 fpv,0-1 медик,0-1 мінометник,0-2 гранатометчик,0-2 штурмовик,3-5 рейнджер
const TEAM_COMPOSITION = ['sniper','fpv','medic','mortarman','grenadier','assault','ranger','ranger','ranger','ranger'];
