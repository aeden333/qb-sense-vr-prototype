(function(){
var canvas=document.getElementById('c');
if(!canvas)return;
var ctx=canvas.getContext('2d');
function drawOL(){
try{
if(typeof phase==='undefined'||typeof st==='undefined'||typeof LOSY==='undefined'||typeof QBX==='undefined'||typeof QBY==='undefined')return;
if(phase!=='pre'&&phase!=='read')return;
var now=phase==='read'?Date.now()-st.t0:0;
var progress=phase==='read'?Math.max(0,Math.min(1,now/st.press)):0;
var startY=LOSY-6;
var endY=QBY-34;
var offsets=[-120,-60,0,60,120];
var labels=['LT','LG','C','RG','RT'];
var blitzSide=phase==='read'&&st.extra>0?(st.bx&&st.bx[0]<QBX?-1:1):0;
ctx.save();
ctx.strokeStyle='rgba(37,99,235,.45)';
ctx.lineWidth=3;
ctx.beginPath();
ctx.arc(QBX,QBY-10,100,Math.PI*1.12,Math.PI*1.88);
ctx.stroke();
for(var i=0;i<5;i++){
var x=QBX+offsets[i];
var y=startY+(endY-startY)*progress;
var beaten=(blitzSide===1&&i>=3)||(blitzSide===-1&&i<=1);
if(beaten){x+=blitzSide*progress*24;y+=progress*8}
ctx.fillStyle=(phase==='read'&&progress>0.82)?'#B91C1C':'#2563EB';
ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';
ctx.fillText(labels[i],x,y+4);
}
ctx.restore();
}catch(e){}
}
function loop(){drawOL();requestAnimationFrame(loop)}
loop();
})();
(function(){
if(!/twominute-sim\.html$/.test(location.pathname)||typeof nextPlay!=='function')return;
// Depths are representative pre-snap yards, converted with the field's PX scale.
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
Object.assign(PROB,{
'Cover 2 Man':{Q:0.30,M:0.28,D:0.18},
'Cover 3 Match':{Q:0.48,M:0.32,D:0.18},
'Cover 6':{Q:0.50,M:0.35,D:0.20},
'Cover 4 Palms':{Q:0.40,M:0.35,D:0.18},
'Fire Zone':{Q:0.58,M:0.43,D:0.25},
'Simulated Blitz':{Q:0.45,M:0.36,D:0.22}
});
Object.assign(COVNOTE,{
'Cover 2 Man':'Cover 2 Man: underneath man coverage with two deep safeties. Work leverage and crossing routes.',
'Cover 3 Match':'Cover 3 Match: a three-deep structure with route-matching rules. Read the defenders after the snap.',
'Cover 6':'Cover 6: quarters to the left and a deep half to the right in this training look. Attack the appropriate side.',
'Cover 4 Palms':'Cover 4 Palms: a two-high match structure. Corners can react to quick outside releases by the slot.',
'Fire Zone':'Fire Zone: five rushers with a three-deep, three-under structure. Find the vacated underneath space.',
'Simulated Blitz':'Simulated Blitz: show extra pressure but rush four. The alignment alone does not identify the rushers.'
});
var coach=document.querySelector('#setup .coach');
var select=document.getElementById('coverageChoice');
if(!select&&coach){
var label=document.createElement('label');label.textContent='Defense ';
select=document.createElement('select');select.id='coverageChoice';
['Random'].concat(ALLCOV).forEach(function(name){var o=document.createElement('option');o.value=name==='Random'?'rand':name;o.textContent=name;select.appendChild(o)});
label.appendChild(select);coach.insertBefore(label,coach.firstChild);
}
// Original nextPlay owns route choice and receiver-open sampling. Set the
// selected coverage before its openP calls so probabilities remain consistent.
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
return originalOpen(i);
};
nextPlay=function(){st._coveragePrepared=null;originalNext()};
align=function(inclBlitz){
var look=looks[st.cvg]||looks['Cover 3'],cd=[],sf=[],lb=[],L=LOSY;
var routes=st.play.r.map(function(r,i){return{x:r.x,i:i}}).sort(function(a,b){return a.x-b.x});
function pos(x,depth){return{x:Math.max(18,Math.min(W-18,x)),y:L-depth*PX}}
look.s.forEach(function(depth,i){sf.push(pos(look.s.length===1?W/2:(i?W*0.75:W*0.25),depth))});
if(!inclBlitz){
var remaining=Math.max(0,7-st.extra-st.play.r.length-sf.length);
for(var u=0;u<remaining;u++)lb.push(pos(W*(u+1)/(remaining+1),look.lb));
return{cd:cd,sf:sf,lb:lb};
}
var outside=[routes[0],routes[routes.length-1]];
var marks=look.man?routes:outside.filter(function(r,i,a){return r&&(i===0||r.i!==a[0].i)});
marks.forEach(function(r){
var isOutside=outside.some(function(o){return o&&o.i===r.i});
var depth=isOutside?look.cb:look.slot;
if(look.split&&r===outside[1])depth=2;
var shade=(r.x<W/2?1:-1)*5;
if(st.cvg==='Cover 2'||(look.split&&r===outside[1]))shade=-shade;
cd.push(pos(r.x+shade,depth));
});
var underneath=7-st.extra-cd.length-sf.length;
for(var k=0;k<underneath;k++)lb.push(pos(W*(k+1)/(underneath+1),look.lb));
// Include the four actual linemen in the eleven-player pre-snap defense.
[170,270,370,470].forEach(function(x){lb.push(pos(x,1))});
for(var b=0;b<st.extra;b++)lb.push(pos(st.bx[b],2));
if(st.cvg==='Simulated Blitz'){
// Walk two underneath defenders up without adding actual rushers.
for(var m=0;m<Math.min(2,underneath);m++)lb[m]=pos(m?390:250,2);
}
return{cd:cd,sf:sf,lb:lb};
};
// Keep the training description honest: these are shells, not a full match engine.
if(coach){var note=document.createElement('small');note.textContent='Defender depths use yards at the field scale. Alignments are representative coaching looks, not guaranteed coverage tells. Match coverages use a simplified probability model; post-snap route-matching rules are not simulated.';coach.parentNode.insertBefore(note,coach.nextSibling)}
})();
