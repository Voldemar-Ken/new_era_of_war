/* Складність офлайн-режиму */
"use strict";

/* ---------- СКЛАДНІСТЬ (лише офлайн, впливає на ворожих ботів) ---------- */
const DIFFICULTIES = {
  soldier:{key:'soldier',label:'Солдат',sub:'Легкий',icon:'①',desc:"Вороги слабші, повільніше реагують і рідше влучають.",dmgMult:0.68,hpMult:0.82,detectMult:0.75,fireChance:0.65,reloadMult:1.35},
  sergeant:{key:'sergeant',label:'Сержант',sub:'Нормальний',icon:'②',desc:'Збалансований бій — стандартна поведінка ботів.',dmgMult:1.0,hpMult:1.0,detectMult:1.0,fireChance:0.9,reloadMult:1.0},
  general:{key:'general',label:'Генерал',sub:'Важкий',icon:'③',desc:"Вороги б'ють сильніше, бачать далі й стріляють майже без промахів.",dmgMult:1.35,hpMult:1.2,detectMult:1.3,fireChance:1.0,reloadMult:0.8}
};
let DIFFICULTY = DIFFICULTIES.sergeant;

/* Стан вибору гравця перед боєм */

/* ---------- ЗАПОВНЕННЯ ЕКРАНІВ ВИБОРУ ---------- */
const CHOICE = {map:null,size:null,cls:null};
let VIA_ONLINE = false;
/* Режими гри (10×10, 5×5, 1×1) */

/* ---------- РЕЖИМ ГРИ: розмір команди ---------- */
const MODES = {
  classic:{key:'classic',label:'10 на 10',icon:'⬢',desc:'Класичний склад — усі 7 класів, включно з мінометником і розвідником.',teamSize:10,classOrder:CLASS_ORDER,composition:TEAM_COMPOSITION},
  five:{key:'five',label:'5 на 5',icon:'⬟',desc:'Компактні команди. Мінометник і розвідник (FPV) недоступні — по одному від решти 5 класів.',teamSize:5,classOrder:['sniper','assault','ranger','grenadier','medic'],composition:['sniper','medic','grenadier','assault','ranger']},
  duel:{key:'duel',label:'1 на 1',icon:'⚔',desc:'Дуель один на один. Доступні всі 7 класів, суперника гра обирає випадково.',teamSize:1,classOrder:CLASS_ORDER,composition:null}
};
let GAME_MODE = MODES.classic;

/* Локальна статистика гравця (localStorage) */

/* ---------- ЛОКАЛЬНА СТАТИСТИКА / ДРУЗІ (немає сервера — все зберігається в цьому браузері) ---------- */
const LS_STATS = 'neow_stats_v1', LS_FRIENDS = 'neow_friends_v1';
function loadStats(){
  try{ const raw = localStorage.getItem(LS_STATS); if(raw) return JSON.parse(raw); }catch(e){}
  return {matches:0,wins:0,losses:0,mvp:0,curStreak:0,bestStreak:0,totalKills:0,bestKills:0,totalDamage:0,survived:0,byClass:{}};
}
function saveStats(){ try{ localStorage.setItem(LS_STATS, JSON.stringify(STATS)); }catch(e){} }
let STATS = loadStats();

function recordMatchStats(winnerTeam){
  const p = RUN.player; if(!p) return;
  const won = winnerTeam==='ally';
  STATS.matches++;
  if(won){ STATS.wins++; STATS.curStreak++; STATS.bestStreak=Math.max(STATS.bestStreak,STATS.curStreak); }
  else if(winnerTeam==='enemy'){ STATS.losses++; STATS.curStreak=0; }
  else { STATS.curStreak=0; }
  const kills = p.kills||0;
  STATS.totalKills += kills;
  STATS.bestKills = Math.max(STATS.bestKills, kills);
  STATS.totalDamage += Math.round(p.damageDealt||0);
  if(!p.dead) STATS.survived++;
  const cls = RUN.playerCls;
  if(!STATS.byClass[cls]) STATS.byClass[cls]={played:0,wins:0,kills:0};
  STATS.byClass[cls].played++;
  if(won) STATS.byClass[cls].wins++;
  STATS.byClass[cls].kills += kills;
  const allyKillsMax = Math.max(0,...RUN.entities.filter(e=>e.team==='ally').map(e=>e.kills||0));
  if(kills>0 && kills>=allyKillsMax) STATS.mvp++;
  saveStats();
}
function favoriteClass(){
  let best=null,bestN=-1;
  Object.keys(STATS.byClass).forEach(k=>{ if(STATS.byClass[k].played>bestN){ bestN=STATS.byClass[k].played; best=k; } });
  return best;
}
