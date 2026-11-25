(function(){
var canvas=document.getElementById('c');
if(!canvas||typeof window.draw!=='function')return;
var ctx=canvas.getContext('2d');
function drawOL(){
if(typeof phase==='undefined'||typeof st==='undefined'||typeof LOSY==='undefined'||typeof QBX==='undefined'||typeof QBY==='undefined')return;
if(phase!=='pre'&&phase!=='read')return;
var now=phase==='read'?Math.max(0,Date.now()-st.t0):0;
var duration=Number.isFinite(st.press)&&st.press>0?st.press:3150;
var progress=phase==='read'?Math.max(0,Math.min(1,now/duration)):0;
// Splits are edge-to-edge feet; a 2-foot stance width is a display assumption.
var pxPerFoot=(SR-SL)/160,stanceFeet=2;
var guardOffset=(stanceFeet+2)*pxPerFoot;
var tackleOffset=guardOffset+(stanceFeet+3)*pxPerFoot;
var offsets=[-tackleOffset,-guardOffset,0,guardOffset,tackleOffset];
var labels=['LT','LG','C','RG','RT'],radius=stanceFeet*pxPerFoot/2;
var startY=LOSY+radius+2,endY=QBY-34;
ctx.save();ctx.setLineDash([]);ctx.globalAlpha=1;
ctx.strokeStyle='rgba(37,99,235,.45)';ctx.lineWidth=2;
ctx.beginPath();ctx.arc(QBX,QBY-10,tackleOffset+12,Math.PI*1.12,Math.PI*1.88);ctx.stroke();
for(var i=0;i<5;i++){
var sign=i<2?-1:i>2?1:0;
var stagger=i===2?0:(i===0||i===4?.65:.35)*PX;
var x=QBX+offsets[i]+sign*progress*(i===0||i===4?1.5:.5)*pxPerFoot;
var y=startY+stagger+(endY-startY-stagger)*progress;
ctx.fillStyle='#2563EB';ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
ctx.lineWidth=3;ctx.strokeStyle='#0A1628';ctx.strokeText(labels[i],x,y+radius+3);
ctx.fillStyle='#fff';ctx.fillText(labels[i],x,y+radius+3);
}
ctx.restore();
}
var originalDraw=window.draw;
window.draw=function(){var result=originalDraw.apply(this,arguments);drawOL();return result};
})();
(function(){
if(!/(?:twominute-sim|game-scenarios)\.html$/.test(location.pathname)||typeof nextPlay!=='function')return;
// Representative coaching defaults, not universal coverage tells.
var looks={
'Man':{cb:1,slot:4,s:[14,14],lb:5,man:true},
'Cover 0':{cb:1,slot:4,s:[],lb:4,man:true},
'Cover 1':{cb:2,slot:5,s:[14],lb:5,man:true},
'Cover 2':{cb:2,slot:5,s:[14,14],lb:5},
'Cover 3':{cb:8,slot:5,s:[14],lb:5},
'Cover 4':{cb:7,slot:5,s:[12,12],lb:5},
'Cover 2 Man':{cb:1,slot:4,s:[14,14],lb:5,man:true},
'Cover 3 Match':{cb:7,slot:5,s:[14],lb:5},
'Cover 6':{cb:7,slot:5,s:[12,14],lb:5,split:true},
'Cover 4 Palms':{cb:6,slot:5,s:[12,12],lb:5},
'Fire Zone':{cb:8,slot:5,s:[14],lb:5},
'Simulated Blitz':{cb:7,slot:5,s:[12,12],lb:5}
};
ALLCOV=Object.keys(looks);
if(/twominute-sim\.html$/.test(location.pathname))Object.assign(PROB,{
'Cover 2 Man':{Q:0.30,M:0.28,D:0.18},
'Cover 3 Match':{Q:0.48,M:0.32,D:0.18},
'Cover 6':{Q:0.50,M:0.35,D:0.20},
'Cover 4 Palms':{Q:0.40,M:0.35,D:0.18},
'Fire Zone':{Q:0.58,M:0.43,D:0.25},
'Simulated Blitz':{Q:0.45,M:0.36,D:0.22}
});
Object.assign(COVNOTE,{
'Man':'Man: this teaching package uses two-high man-under, the same family as Cover 2 Man.',
'Cover 2 Man':'Cover 2 Man: man underneath with two deep safeties. Read leverage and help.',
'Cover 3 Match':'Cover 3 Match: one-high structure with formation-aware spacing. Full post-snap matching is not simulated.',
'Cover 6':'Cover 6: quarters to receiver strength and a deep half opposite in this teaching package.',
'Cover 4 Palms':'Cover 4 Palms: two-high, read-2 spacing with a trips poach check. Full post-snap matching is not simulated.',
'Fire Zone':'Fire Zone: a five-rusher, three-deep pressure look. Post-snap coverage remains simplified.',
'Simulated Blitz':'Simulated Blitz: show extra pressure with a four-man rush count. Rusher/dropper exchanges are not simulated.'
});
var coach=document.querySelector('#setup .coach');
var select=document.getElementById('coverageChoice');
if(!select&&coach){
var label=document.createElement('label');label.textContent='Defense ';
select=document.createElement('select');select.id='coverageChoice';
['Random'].concat(ALLCOV).forEach(function(name){var o=document.createElement('option');o.value=name==='Random'?'rand':name;o.textContent=name;select.appendChild(o)});
label.appendChild(select);coach.insertBefore(label,coach.firstChild);
}
var originalNext=nextPlay,originalOpen=openP;
openP=function(i){
if(st._coveragePrepared!==st.play){
st._coveragePrepared=st.play;
if(select&&looks[select.value])st.cvg=select.value;
var look=looks[st.cvg],maxExtra=Math.max(0,7-st.play.r.length-look.s.length);
if(st.cvg==='Fire Zone')st.extra=Math.min(1,maxExtra);
else if(st.cvg==='Simulated Blitz')st.extra=0;
else st.extra=Math.min(st.extra,maxExtra);
}
if(st.play.r[i].c==='BLOCK')return 0;
return originalOpen(i);
};
nextPlay=function(){
st._coveragePrepared=null;originalNext();
var r=st.play.r;
if(Array.isArray(r)){
if(r.length>5)r=r.slice(0,5);
while(r.length<5){
var x=90;
if(r.some(function(q){return Math.abs(q.x-90)<60})){x=550;if(r.some(function(q){return Math.abs(q.x-550)<60}))x=300}
r.push({n:'Checkdown',x:x,y:0,p:[[0,-25]],c:'Q',oob:false});
}
st.play.r=r;
}
};
function legacyAlign(){
var look=looks[st.cvg]||looks['Cover 3'],sf=[],lb=[];
look.s.forEach(function(d,i){sf.push({x:look.s.length===1?W/2:(i?W*.75:W*.25),y:LOSY-d*PX})});
var count=Math.max(0,7-st.extra-st.play.r.length-sf.length);
for(var i=0;i<count;i++)lb.push({x:W*(i+1)/(count+1),y:LOSY-look.lb*PX});
return{cd:[],sf:[],lb:[]};
}
align=function(inclBlitz){
// Keep the existing post-snap renderer contract; this engine models pre-snap checks.
if(!inclBlitz)return legacyAlign(false);
var c=st.cvg,look=looks[c]||looks['Cover 3'],cd=[],sf=[],lb=[],all=[];
var center=QBX,scaleX=(SR-SL)/(160/3),box=6*scaleX;
var routes=st.play.r.map(function(r,i){return{x:r.x,y:r.y||0,i:i,back:(r.y||0)>20}});
var wide=routes.filter(function(r){return !r.back});
var left=wide.filter(function(r){return r.x<center}).sort(function(a,b){return a.x-b.x});
var right=wide.filter(function(r){return r.x>=center}).sort(function(a,b){return b.x-a.x});
var strong=right.length>=left.length?1:-1;
var distance=Number.isFinite(G.ball)?Math.max(0,G.ball):75;
var longSituation=G.toGo>=12&&G.clock<=30;
function depth(d,role){
if(role==='S'){
if(distance<=10)d=Math.min(d,Math.max(6,distance*.65+3));
else if(distance<=20)d=Math.min(d,11);
else if(longSituation)d=Math.min(20,d+3);
}else if(role==='CB'&&distance<=10)d=Math.min(d,4);
else if(role==='CB'&&longSituation&&d>=6)d+=2;
return Math.max(.75,Math.min(d,distance+7));
}
function add(group,id,x,d,role,assignment){
var originalX=x,originalD=depth(d,role),p;
for(var t=0;t<100;t++){
var step=t?Math.ceil(t/2)*24*(t%2?1:-1):0;
p={id:id,x:Math.max(SL+14,Math.min(SR-14,originalX+step)),y:LOSY-originalD*PX,role:role,assignment:assignment};
if(!all.some(function(q){return Math.hypot(p.x-q.x,p.y-q.y)<23}))break;
if(t>0&&t%20===0)originalD=Math.min(distance+7,originalD+1);
}
group.push(p);all.push(p);return p;
}
function side(n){return n<0?left:right}
function outside(n){return side(n)[0]}
function slot(n){return side(n)[1]}
function bunch(n){var a=side(n);return a.length>1&&Math.abs(a[0].x-a[a.length-1].x)<7*scaleX}
function apex(n){var r=slot(n)||outside(n);return r?(center+n*box+r.x)/2:center+n*box}
function safetyX(n){var r=slot(n)||outside(n);return Math.max(SL+8*scaleX,Math.min(SR-8*scaleX,r?r.x:center+n*10*scaleX))}
// Consistent four-down front; technique widths follow the existing offensive line.
var ppf=(SR-SL)/160,lt=QBX-9*ppf,lg=QBX-4*ppf,rg=QBX+4*ppf,rt=QBX+9*ppf;
[lt-2.5*ppf,(lg+QBX)/2,(QBX+rg)/2,rt+2.5*ppf].forEach(function(x,i){add(lb,'DL'+i,x,1,'DL','rush')});
if(look.man){
var outerIds=[outside(-1),outside(1)].filter(Boolean).map(function(r){return r.i});
routes.forEach(function(r){
var outer=outerIds.indexOf(r.i)>=0,n=r.x<center?-1:1;
var d=r.back?5:outer?look.cb:look.slot;
if(!r.back&&bunch(n))d=outer?5:7+(side(n).findIndex(function(q){return q.i===r.i})%2);
// Inside leverage is the default man technique in this teaching package.
var leverage=-n;
add(cd,'M'+r.i,r.x+leverage*scaleX*.75,d,outer?'CB':'MAN','receiver '+r.i);
});
}else{
[-1,1].forEach(function(n){
var r=outside(n),d=look.cb;
if(c==='Cover 6')d=n===strong?7:2;
if(bunch(n))d=Math.max(d,7);
var cloud=c==='Cover 2'||(c==='Cover 6'&&n!==strong);
add(cd,n<0?'CBL':'CBR',(r?r.x:center+n*10*scaleX)+(cloud?n:-n)*scaleX,d,'CB',cloud?'flat / reroute':'outside deep / match');
});
}
if(look.s.length===1){
add(sf,'FS',center+strong*(Math.max(left.length,right.length)>=3?2*scaleX:0),look.s[0],'S','middle third / post');
}else if(look.s.length===2){
[-1,1].forEach(function(n,i){
var d=look.s[i],x=safetyX(n),assignment='deep half';
if(c==='Cover 4'||c==='Cover 4 Palms')assignment='read #2 / quarters';
if(c==='Cover 6'){d=n===strong?12:14;assignment=n===strong?'quarters / read #2':'deep half'}
if(Math.max(left.length,right.length)>=3&&n!==strong&&(c==='Cover 4'||c==='Cover 4 Palms')){x=center+n*4*scaleX;assignment='trips poach check / read #3'}
add(sf,n<0?'SL':'SR',x,d,'S',assignment);
});
}
var extras=Math.max(0,Math.min(st.extra,7-cd.length-sf.length));
var count=7-cd.length-sf.length-extras;
var positions=count===4?[apex(-1),center-2*scaleX,center+2*scaleX,apex(1)]:count===3?[apex(-1),center+strong*scaleX,apex(1)]:count===2?[center-3*scaleX,center+3*scaleX]:[center];
for(var k=0;k<count;k++){
var x=positions[k]===undefined?center:positions[k];
if(count===2&&slot(k?1:-1))x=apex(k?1:-1);
if(count===3&&k===1&&Math.max(left.length,right.length)>=3)x=center+strong*4*scaleX;
var mug=c==='Simulated Blitz'&&k<2;
if(mug)x=center+(k?1:-1)*2.5*scaleX;
add(lb,'U'+k,x,mug?2:look.lb,'LB',mug?'show pressure; simplified post-snap renderer':'hook / apex / back release');
}
for(var b=0;b<extras;b++)add(lb,'BL'+b,center+strong*(b?5:1.5)*scaleX,2,'BL','rush');
return{cd:cd,sf:sf,lb:lb};
};
if(coach){var note=document.createElement('small');note.textContent='Formation-aware pre-snap teaching package: depths in yards, strength checks, bunch spacing and red-zone adjustments. Man uses a two-high man-under default. Coverage cannot be identified with certainty from alignment. Post-snap movement, match/banjo switches and simulated-pressure exchanges remain simplified, not fully simulated.';coach.parentNode.insertBefore(note,coach.nextSibling)}
})();
(function(){
if(typeof CONCEPTS==='undefined')return;
CONCEPTS.forEach(function(c){
(c.rb||[]).forEach(function(r){
if(r.n==='Angle')r.p=[[0,-90],[-50,-120]];
});
});
})();
