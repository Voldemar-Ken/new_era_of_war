/* Під час бою: глобальний стан бою */
"use strict";

let RUN = {active:false};
let canvas, ctx, mini, mctx;
let camX=0, camY=0, CW=900, CH=560, currentZoom=1;
let keys={}, mouse={x:0,y:0,down:false};
let logLines = [];
