/* Saved-play geometry adapter. Drive position and outcome logic stay drill-owned. */
(function(){
'use strict';
function path(r,los){return [[r.x,los+r.y]].concat(r.p.map(function(p){return [r.x+p[0],los+r.y+p[1]]}))}
function position(a,d){for(var k=1;k<a.length;k++){var n=Math.hypot(a[k][0]-a[k-1][0],a[k][1]-a[k-1][1]);if(n&&d<=n){var t=d/n;return {x:a[k-1][0]+(a[k][0]-a[k-1][0])*t,y:a[k-1][1]+(a[k][1]-a[k-1][1])*t}}d-=n}var q=a[a.length-1];return {x:q[0],y:q[1]}}
function clone(p){return JSON.parse(JSON.stringify(p))}
function snapshot(p){var q=clone(p);q._savedReplay=true;q.r.forEach(function(r,i){if(!r.id)r.id='saved-'+(r.playerIndex==null?i:r.playerIndex)});q._savedRoutes=clone(q.r);return q}
function install(){
if(!/(?:twominute-sim|game-scenarios)\.html$/.test(location.pathname)||typeof window.nextPlay!=='function'||typeof window.pts!=='function'||typeof window.rpos!=='function'||!window.st)return;
var canvas=document.getElementById('c'),ctx=canvas.getContext('2d'),camera={scale:1,x:0,y:0},oldTeam=window.getTeamPlaybook,oldNext=window.nextPlay,oldPts=window.pts,oldPos=window.rpos,oldDraw=window.draw,defaultQBX=window.QBX,defaultQBY=window.QBY;
window.getTeamPlaybook=function(){var team=oldTeam.apply(this,arguments);if(!team)return team;team.plays=team.plays.map(snapshot);return team};
function saved(){return window.st.play&&window.st.play._savedReplay===true}
window.nextPlay=function(){
window.QBX=defaultQBX;window.QBY=defaultQBY;var result=oldNext.apply(this,arguments);
if(saved()){var p=window.st.play;p.r=clone(p._savedRoutes);window.st.cov=window.st.cov.slice(0,p.r.length);var answer=window.st.cov.indexOf(false);window.st.ans=answer<0?p.r.length:answer;if(p.ballPlacement&&Number.isFinite(p.ballPlacement.x))window.QBX=p.ballPlacement.x;window.QBY=window.LOSY+35;fit()}
return result;
};
window.pts=function(i){return saved()?path(window.st.play.r[i],window.LOSY):oldPts.apply(this,arguments)};
window.rpos=function(i,p){if(!saved())return oldPos.apply(this,arguments);var r=window.st.play.r[i],seconds=window.phase==='read'?Math.max(0,(Date.now()-window.st.t0)/1000):0;var speed=Number.isFinite(r.speedYardsPerSecond)&&r.speedYardsPerSecond>0?r.speedYardsPerSecond:8;return position(path(r,window.LOSY),seconds*speed*window.PX)};
function fit(){var minX=0,maxX=640,minY=window.LOSY-160,maxY=window.QBY+70;window.st.play.r.forEach(function(r){path(r,window.LOSY).forEach(function(p){minX=Math.min(minX,p[0]-35);maxX=Math.max(maxX,p[0]+35);minY=Math.min(minY,p[1]-35);maxY=Math.max(maxY,p[1]+45)})});(window.st.play.blockers||[]).forEach(function(r){minX=Math.min(minX,r.x-40);maxX=Math.max(maxX,r.x+40);minY=Math.min(minY,window.LOSY+r.y-30);maxY=Math.max(maxY,window.LOSY+r.y+50)});camera.scale=Math.min(canvas.width/(maxX-minX),canvas.height/(maxY-minY));camera.x=(canvas.width-(maxX-minX)*camera.scale)/2-minX*camera.scale;camera.y=(canvas.height-(maxY-minY)*camera.scale)/2-minY*camera.scale}
function dot(x,y,r,color,label){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();if(label){ctx.fillStyle='#0A1628';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(label,x,y+4)}}
function line(x1,y1,x2,y2,color){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
window.draw=function(){
if(!saved())return oldDraw.apply(this,arguments);
ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#14532D';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.translate(camera.x,camera.y);ctx.scale(camera.scale,camera.scale);ctx.lineWidth=1;ctx.setLineDash([]);var L=window.LOSY,goal=L-window.G.ball*window.PX;
for(var y=goal;y<=goal+500;y+=25)line(window.SL,y,window.SR,y,'rgba(255,255,255,.25)');line(window.SL,goal-50,window.SL,goal+550,'#fff');line(window.SR,goal-50,window.SR,goal+550,'#fff');line(window.SL,goal,window.SR,goal,'#fff');line(window.SL,L,window.SR,L,'#60A5FA');line(window.SL,L-window.G.toGo*window.PX,window.SR,L-window.G.toGo*window.PX,'#FACC15');
if(window.phase==='pre'||window.phase==='read'){
var pre=window.phase==='pre',alignment=window.align(pre);alignment.cd.concat(alignment.sf,alignment.lb).forEach(function(d){dot(d.x,d.y,11,'#DC2626')});
window.st.play.r.forEach(function(r,i){var a=path(r,L);ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(a[0][0],a[0][1]);a.slice(1).forEach(function(p){ctx.lineTo(p[0],p[1])});ctx.stroke();ctx.setLineDash([]);var p=pre?{x:a[0][0],y:a[0][1]}:window.rpos(i,0);if(!pre){var progress=Math.min(1,(Date.now()-window.st.t0)/(window.st.dur*.75)),def=window.dpos(i,progress);dot(def.x,def.y,11,'#DC2626','D')}dot(p.x,p.y,15,'#fff',String(i+1));ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='11px sans-serif';ctx.fillText((r.playerLabel||r.id||'Receiver')+' — '+r.n,p.x,p.y+30)});
(window.st.play.blockers||[]).forEach(function(r){var y=L+r.y,dx=r.x<window.QBX?24:r.x>window.QBX?-24:0,ex=r.x+dx,ey=y-12,a=Math.atan2(-12,dx);ctx.lineWidth=2;line(r.x,y,ex,ey,'#FB923C');line(ex,ey,ex-7*Math.cos(a-.5),ey-7*Math.sin(a-.5),'#FB923C');line(ex,ey,ex-7*Math.cos(a+.5),ey-7*Math.sin(a+.5),'#FB923C');dot(r.x,y,8,'#FB923C');ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText((r.playerLabel||'Player')+' Block',r.x,y+28)});
['LT','LG','C','RG','RT'].forEach(function(label,i){var x=window.QBX+(i-2)*21;ctx.fillStyle='#2563EB';ctx.fillRect(x-8,L-3,16,18);ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(label,x,L+10)});
if(!pre){var elapsed=Date.now()-window.st.t0,q=Math.min(1,elapsed/window.st.press);[170,270,370,470].forEach(function(x){dot(x+(window.QBX-x)*q,L-8+(window.QBY-L+8)*q,12,'#7F1D1D','R')});var q2=Math.min(1,elapsed/(window.st.press*.85));for(var b=0;b<window.st.extra;b++){var x=window.st.bx[b];dot(x+(window.QBX-x)*q2,L-26+(window.QBY-L+26)*q2,12,'#EA580C','B')}}
dot(window.QBX,window.QBY,10,'#F59E0B','QB');
}else if(window.phase==='yac'&&window.st.y){var Y=window.st.y;Y.defs.forEach(function(d){dot(d.x,d.y,11,'#DC2626')});dot(Y.x,Y.y,15,'#fff','WR')}
ctx.restore();ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#fff';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(window.st.play.name+' | Saved paths; 8 yd/s default; drive yard line retained.',10,canvas.height-8);ctx.restore();
};
canvas.addEventListener('click',function(e){if(!saved()||window.phase!=='read')return;e.preventDefault();e.stopImmediatePropagation();var rect=canvas.getBoundingClientRect(),x=((e.clientX-rect.left)*canvas.width/rect.width-camera.x)/camera.scale,y=((e.clientY-rect.top)*canvas.height/rect.height-camera.y)/camera.scale,best=-1,distance=60;window.st.play.r.forEach(function(r,i){var p=window.rpos(i,0),d=Math.hypot(p.x-x,p.y-y);if(d<distance){distance=d;best=i}});if(best>=0)window.throwTo(best)},true);
if(saved())fit();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
