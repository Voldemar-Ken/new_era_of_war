/* Звук: генерація через WebAudio, без файлів */
"use strict";

/* ---------- ЗВУК (проста генерація через WebAudio, без файлів) ---------- */
let actx=null;
function beep(freq,dur,type,vol){
  if(!document.getElementById('optSfx').checked) return;
  try{
    if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(), g=actx.createGain();
    o.type=type||'square'; o.frequency.value=freq;
    g.gain.value=(vol||0.05);
    o.connect(g); g.connect(actx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime+dur);
    o.stop(actx.currentTime+dur);
  }catch(e){}
}
const SND = {
  shot:()=>beep(220,0.08,'square',0.04),
  sniperShot:()=>beep(120,0.25,'sawtooth',0.06),
  explosion:()=>beep(60,0.35,'triangle',0.09),
  hit:()=>beep(500,0.05,'square',0.03),
  heal:()=>beep(880,0.12,'sine',0.03),
  capture:()=>beep(660,0.4,'sine',0.05),
  down:()=>beep(90,0.4,'sawtooth',0.06),
  scope:()=>beep(520,0.07,'sine',0.03)
};
