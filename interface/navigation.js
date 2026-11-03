/* Інтерфейс: навігація між екранами */
"use strict";

/* ---------- НАВІГАЦІЯ МІЖ ЕКРАНАМИ ---------- */
function goto_(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  if(name==='battle'){
    hudHidden=false;
    document.getElementById('hud').style.display='';
    document.getElementById('battleGrid').style.gridTemplateColumns='1fr 300px';
    document.getElementById('hudToggleBtn').textContent='☰';
    resizeCanvas();
  }
  if(RUN.active && name!=='battle'){ stopMatch(false); }
  if(name!=='class'){ stopClassTimer(); }
  if(name==='connecting'){
    setTimeout(()=>{ if(document.getElementById('screen-connecting').classList.contains('active')) goto_('lobby'); }, 1700);
  } else if(name==='lobby'){
    renderLobby();
  } else if(name==='stats'){
    renderStats();
  } else if(name==='searching'){
    runSearchingAnimation();
  } else if(name==='mapreveal'){
    runMapReveal();
  } else if(name==='class'){
    buildClassGrid();
  }
}
