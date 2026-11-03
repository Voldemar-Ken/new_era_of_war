/* Повтори / запис: збереження повтору після бою */

(function(){
"use strict";
const {$, fmtSize, saveEnabled, REC, encode, RDB, RPUI} = window.__NEOW_RP;
/* ---------- збереження після бою ---------- */
async function saveAfterBattle(winner,reason){
  const st=$('replayStatus'),bw=$('endReplayBtn'),bd=$('endReplayDl');
  bw.style.display=bd.style.display='none'; RPUI.last=null;
  if(!REC.on){ st.textContent=''; return; }
  if(!saveEnabled()){ REC.on=false; st.textContent='Збереження повторів вимкнено (Налаштування → «Зберігати повтори боїв»).'; return; }
  st.textContent='🎞 Збереження повтору…';
  try{
    const rep=REC.finish(winner,reason);
    const buf=await encode(rep);
    rep.meta.size=buf.byteLength;
    await RDB.save(rep.meta,buf);
    RPUI.last={id:rep.meta.id};
    st.textContent='🎞 Повтор збережено ('+fmtSize(buf.byteLength)+') — «Меню → Повтори»'+(RDB.memOnly?' · ⚠ лише до закриття вкладки, завантажте файл':'');
    bw.style.display=bd.style.display='';
  }catch(err){ console.error(err); st.textContent='⚠ Не вдалося зберегти повтор: '+(err&&err.message||err); }
}
const _showEnd=window.showEndScreen;
window.showEndScreen=function(winner,reason){
  _showEnd.apply(this,arguments);
  saveAfterBattle(winner,reason);
};
$('endReplayBtn').onclick=()=>{ if(RPUI.last) RPUI.watch(RPUI.last.id); };
$('endReplayDl').onclick=()=>{ if(RPUI.last) RPUI.download(RPUI.last.id); };
})();
