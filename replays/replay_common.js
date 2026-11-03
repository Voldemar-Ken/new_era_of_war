/* Повтори: спільні константи, хелпери, налаштування збереження */

window.__NEOW_RP=window.__NEOW_RP||{};
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d)=>{v=+v;return isFinite(v)?v:(d||0);};
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));
const MAGIC='NEOWRPL1', STRIDE=15, FRAME_DT=0.1, MAX_REPLAYS=25, MAX_JSON=60e6, MAX_RAW=250e6;
const TWO_PI=Math.PI*2;
const DSTATES=['idle','launching','piloting'];
const LEADERS=[null,'ally','enemy','contested'];
const LS_SAVE='neow_save_replays_v1';
const pad2=n=>String(n).padStart(2,'0');
const fmtTime=s=>{s=Math.max(0,Math.floor(s));return pad2(Math.floor(s/60))+':'+pad2(s%60);};
const fmtDate=ts=>{const d=new Date(ts);return pad2(d.getDate())+'.'+pad2(d.getMonth()+1)+'.'+d.getFullYear()+' '+pad2(d.getHours())+':'+pad2(d.getMinutes());};
const fmtSize=b=>b>=1048576?(b/1048576).toFixed(1)+' МБ':Math.max(1,Math.round(b/1024))+' КБ';
const q=(v,s)=>{v=Math.round(v*s);return v>32767?32767:(v<-32768?-32768:v);};

/* ---------- налаштування: чи зберігати повтори ---------- */
try{ if(localStorage.getItem(LS_SAVE)==='0') $('optSaveReplays').checked=false; }catch(e){}
$('optSaveReplays').addEventListener('change',()=>{ try{localStorage.setItem(LS_SAVE,$('optSaveReplays').checked?'1':'0');}catch(e){} });
const saveEnabled=()=>$('optSaveReplays').checked;
Object.assign(window.__NEOW_RP,{$, esc, num, clampN, MAGIC, STRIDE, FRAME_DT, MAX_REPLAYS, MAX_JSON, MAX_RAW, TWO_PI, DSTATES, LEADERS, LS_SAVE, pad2, fmtTime, fmtDate, fmtSize, q, saveEnabled});
})();
