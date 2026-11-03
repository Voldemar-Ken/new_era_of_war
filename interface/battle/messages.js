/* Інтерфейс бою: журнал і підказки */
"use strict";

function pushLog(t){
  logLines.push(t);
  if(logLines.length>6) logLines.shift();
  const el=document.getElementById('logfeed');
  el.innerHTML = logLines.map(l=>`<div>› ${l}</div>`).join('');
}
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg; el.style.opacity=1;
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>{el.style.opacity=0;},2600);
}
