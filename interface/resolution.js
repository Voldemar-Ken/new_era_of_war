/* Налаштування роздільної здатності екрана */

/* NEW ERA OF WAR — розширення екрана для всієї програми (меню, лобі, налаштування, бій) */
(function(){
"use strict";
const PRESETS=[[800,600],[1024,768],[1280,720],[1366,768],[1600,900],[1920,1080],[2560,1440],[3840,2160]];
const KEY='neow_resolution_v1',DESIGN_H=720;    // висота макета не залежить від вибору — інтерфейс і поле зору пропорційні
let cur=null;
try{const v=localStorage.getItem(KEY);if(v&&v!=='auto'){const a=v.split('x').map(Number);if(PRESETS.some(p=>p[0]===a[0]&&p[1]===a[1]))cur={w:a[0],h:a[1]};}}catch(e){}
const sel=document.getElementById('optRes'),inf=document.getElementById('optResInfo'),root=document.documentElement;
sel.innerHTML='<option value="auto">Авто (за вікном)</option>'+PRESETS.map(p=>'<option value="'+p[0]+'x'+p[1]+'">'+p[0]+' × '+p[1]+'</option>').join('');
sel.value=cur?cur.w+'x'+cur.h:'auto';
function layout(){
  if(!cur){document.body.classList.remove('res-fixed');root.style.removeProperty('--lw');root.style.removeProperty('--f');inf.textContent='Програма займає все вікно браузера (поточна поведінка).';return;}
  const lw=DESIGN_H*cur.w/cur.h,f=Math.min(innerWidth/lw,innerHeight/DESIGN_H);
  document.body.classList.add('res-fixed');
  root.style.setProperty('--lw',lw+'px');root.style.setProperty('--f',f);
  inf.textContent='Уся програма показується в екрані '+cur.w+' × '+cur.h+' (пропорції '+(Math.round(cur.w/cur.h*100)/100)+':1) і вписується у вікно зі смугами по краях.';
}
layout();
window.addEventListener('resize',layout);
sel.onchange=function(){
  const v=sel.value;cur=v==='auto'?null:{w:+v.split('x')[0],h:+v.split('x')[1]};
  try{localStorage.setItem(KEY,v);}catch(e){}
  layout();
  if(RUN&&RUN.active&&document.getElementById('screen-battle').classList.contains('active'))resizeCanvas();
};
// бій: внутрішній розмір картинки = розмір поля у «макетних» пікселях × k (k = H/720), поле зору від вибору не залежить
const _rc=window.resizeCanvas;
window.resizeCanvas=function(){
  _rc();
  const canvas=document.getElementById('gameCanvas'),wrap=document.getElementById('gameCanvasWrap');
  const k=cur?cur.h/DESIGN_H:1;
  if(k!==1){
    canvas.width=Math.round(wrap.clientWidth*k);canvas.height=Math.round(wrap.clientHeight*k);
    ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    CW=wrap.clientWidth;CH=wrap.clientHeight;
  }
  window.__resK=k;
  canvas.style.imageRendering=(cur&&k<(parseFloat(getComputedStyle(root).getPropertyValue('--f'))||1))?'pixelated':'auto';   // при збільшенні малої картинки — чіткі пікселі
  canvas.onmousemove=function(e){
    const b=canvas.getBoundingClientRect();
    mouse.x=(e.clientX-b.left)*CW/b.width;mouse.y=(e.clientY-b.top)*CH/b.height;
  };
};
const _render=window.render;
window.render=function(){
  const k=window.__resK;
  if(k&&k!==1&&ctx)ctx.setTransform(k,0,0,k,0,0);
  _render();
  if(k&&k!==1&&ctx)ctx.setTransform(1,0,0,1,0,0);
};
})();
