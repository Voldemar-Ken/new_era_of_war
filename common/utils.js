/* Допоміжні функції (rand, dist, clamp, normAngle, seededRng) */
"use strict";

/* ---------- ДОПОМІЖНІ ФУНКЦІЇ ---------- */
function rand(a,b){return a+Math.random()*(b-a);}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function normAngle(a){ while(a>Math.PI)a-=Math.PI*2; while(a<-Math.PI)a+=Math.PI*2; return a; }
function seededRng(seed){ let s=seed%2147483647; if(s<=0)s+=2147483646;
  return function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
