/* Онлайн: список друзів */
"use strict";

function loadFriends(){
  try{ const raw = localStorage.getItem(LS_FRIENDS); if(raw) return JSON.parse(raw); }catch(e){}
  return [{name:'Shadow_Wolf',online:true},{name:'Nika',online:false},{name:'Rex_UA',online:true}];
}
function saveFriends(){ try{ localStorage.setItem(LS_FRIENDS, JSON.stringify(FRIENDS)); }catch(e){} }
let FRIENDS = loadFriends();
function addFriend(){
  const inp = document.getElementById('friendNameInput');
  const name = (inp.value||'').trim();
  if(!name) return;
  FRIENDS.push({name, online: Math.random()<0.5});
  saveFriends();
  inp.value='';
  renderLobby();
}
