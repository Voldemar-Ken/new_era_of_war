/* Онлайн: екран лобі */
"use strict";

function renderLobby(){
  renderOnlineModeToggle();
  const wr = STATS.matches? Math.round(STATS.wins/STATS.matches*100):0;
  document.getElementById('lobbyWinrate').textContent = wr+'% перемог · '+STATS.matches+' боїв';
  const favKey = favoriteClass();
  const card = document.getElementById('favClassCard');
  if(!favKey){
    card.innerHTML = `<div class="muted">Ще немає зіграних боїв — оберіть будь-кого у своєму першому матчі.</div>`;
  } else {
    const c = CLASSES[favKey], st = STATS.byClass[favKey];
    card.innerHTML = `<span style="font-size:3rem;color:${c.color};">${c.icon}</span>
      <div><h2 class="heading" style="margin:0;">${c.name}</h2>
      <p class="muted" style="margin:4px 0 0;">${st.played} боїв · ${st.played?Math.round(st.wins/st.played*100):0}% перемог · ${st.kills} ураження</p></div>`;
  }
  const list = document.getElementById('friendsList');
  list.innerHTML = FRIENDS.map(f=>`<div class="friend-row"><span class="friend-dot" style="background:${f.online?'#4ade80':'#6b7280'};"></span>${f.name}<span class="muted" style="margin-left:auto;font-size:.65rem;">${f.online?'у мережі':'офлайн'}</span></div>`).join('') || '<p class="muted">Список друзів порожній.</p>';
}
