(function(){
if(document.querySelector('.qb-back'))return;
var css='.qb-back{position:sticky;top:10px;z-index:50;display:flex;width:fit-content;align-items:center;gap:10px;margin:0 0 14px;padding:6px 18px 6px 6px;background:#fff;color:#0A1628;border:1px solid #E2E8F0;border-radius:999px;box-shadow:0 2px 8px rgba(10,22,40,.12);font:800 13px/1 system-ui,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;transition:background .15s,color .15s,border-color .15s,transform .15s}'+
'.qb-back:hover{background:#14532D;color:#fff;border-color:#14532D;transform:translateX(-2px)}'+
'.qb-back:focus-visible{outline:3px solid #F59E0B;outline-offset:2px}'+
'.qb-back-ic{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#14532D;color:#fff;transition:background .15s,color .15s}'+
'.qb-back:hover .qb-back-ic{background:#fff;color:#14532D}'+
'.qb-defense{display:inline-flex;align-items:center;gap:8px;margin-right:12px;font-size:13px;font-weight:700;color:#5B6B7C}'+
'.qb-defense select{width:auto;min-width:170px;padding:8px;border:1px solid #E2E8F0;border-radius:6px;font-size:14px;background:#fff;color:#111827}';
var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
document.querySelectorAll('header a[href*="index.html"]').forEach(function(x){x.style.display='none'});
var a=document.createElement('a');
a.className='qb-back';
a.href='index.html#drills';
a.setAttribute('aria-label','Back to the drill menu');
a.innerHTML='<span class="qb-back-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span><span>Back to drills</span>';
var m=document.querySelector('main');
if(m)m.insertBefore(a,m.firstChild);else document.body.insertBefore(a,document.body.firstChild);
})();
// Two-Minute and Game Situations own their defense controls in offensive-line.js.
// Do not reinstall the obsolete align() override or a competing selector here.
(function(){
if(!/redzone-sim\.html$/.test(location.pathname)||typeof startRep!=='function'||typeof cfg==='undefined')return;
var looks={
'Man':{cb:1,s:2,man:true},'Cover 0':{cb:1,s:0,man:true},'Cover 1':{cb:2,s:1,man:true},
'Cover 2':{cb:2,s:2},'Cover 3':{cb:8,s:1},'Cover 4':{cb:7,s:2},
'Cover 2 Man':{cb:1,s:2,man:true},'Cover 3 Match':{cb:7,s:1},'Cover 6':{cb:7,s:2},
'Cover 4 Palms':{cb:6,s:2},'Fire Zone':{cb:8,s:1},'Simulated Blitz':{cb:7,s:2}
};
ALLCOV=Object.keys(looks);
var extraProbs={'Cover 2 Man':{Q:.35,X:.25,V:.3},'Cover 3 Match':{Q:.5,X:.3,V:.25},'Cover 6':{Q:.5,X:.3,V:.2},'Cover 4 Palms':{Q:.5,X:.3,V:.2},'Fire Zone':{Q:.4,X:.35,V:.3},'Simulated Blitz':{Q:.35,X:.3,V:.35}};
Object.keys(extraProbs).forEach(function(c){if(!PROB[c])PROB[c]=extraProbs[c]});
Object.assign(COVNOTE,{
'Man':'Man: two-high man-under is the default in this teaching package.',
'Cover 2 Man':'Cover 2 Man: two safeties over man coverage; red-zone spacing compresses the help.',
'Cover 3 Match':'Cover 3 Match: one-high formation-aware pre-snap spacing; full matching is not simulated.',
'Cover 6':'Cover 6: quarters toward receiver strength, deep half opposite, with compressed red-zone depths.',
'Cover 4 Palms':'Cover 4 Palms: two-high read-2 pre-snap spacing; full matching is not simulated.',
'Fire Zone':'Fire Zone: a three-deep pressure look. This drill retains its simplified single-rusher animation.',
'Simulated Blitz':'Simulated Blitz: walked-up pressure threats. Rusher/dropper exchanges are not simulated.'
});
var coverageSelect=document.getElementById('cov');
ALLCOV.forEach(function(name){
if(!Array.from(coverageSelect.options).some(function(o){return o.value===name})){
var option=document.createElement('option');option.value=name;option.textContent=name;coverageSelect.appendChild(option);
}
});
function redAlignment(){
var look=looks[st.cvg]||looks['Cover 3'],out=[],L=st.los,c=st.cvg,cx=QB.x,sx=W/(160/3);
var routes=cfg.sx.map(function(x,i){return{x:x,i:i,back:cfg.sy[i]>20}});
var wide=routes.filter(function(r){return !r.back});
var left=wide.filter(function(r){return r.x<cx}).sort(function(a,b){return a.x-b.x});
var right=wide.filter(function(r){return r.x>=cx}).sort(function(a,b){return b.x-a.x});
var strong=right.length>=left.length?1:-1;
function side(n){return n<0?left:right}
function bunch(n){var a=side(n);return a.length>1&&Math.abs(a[0].x-a[a.length-1].x)<7*sx}
function apex(n){var a=side(n),r=a[1]||a[0];return r?(cx+n*6*sx+r.x)/2:cx+n*6*sx}
function put(x,d,role){
var maxDepth=st.d+(GL-14)/PX;
if(role==='S')d=Math.min(d,st.d<=10?Math.max(6,st.d*.65+3):11);
if(role==='CB'&&st.d<=10)d=Math.min(d,4);
d=Math.min(d,maxDepth);
var p;
for(var t=0;t<100;t++){
var shift=t?Math.ceil(t/2)*24*(t%2?1:-1):0;
p={x:Math.max(18,Math.min(W-18,x+shift)),y:L-d*PX,role:role};
if(!out.some(function(q){return Math.hypot(q.x-p.x,q.y-p.y)<23}))break;
if(t>0&&t%20===0)d=Math.min(maxDepth,d+1);
}
out.push(p);
}
[cx-150,cx-50,cx+50,cx+150].forEach(function(x){put(x,1,'DL')});
if(look.man){
routes.forEach(function(r){var n=r.x<cx?-1:1,outer=side(n)[0]&&side(n)[0].i===r.i;
var d=r.back?4:outer?look.cb:4;
if(!r.back&&bunch(n))d=outer?5:7;
put(r.x-n*.75*sx,d,outer?'CB':'MAN');
});
}else{
[-1,1].forEach(function(n){var r=side(n)[0],cloud=c==='Cover 2'||(c==='Cover 6'&&n!==strong),d=c==='Cover 6'?(n===strong?7:2):look.cb;
if(bunch(n))d=Math.max(d,7);
put((r?r.x:cx+n*10*sx)+(cloud?n:-n)*sx,d,'CB');
});
}
if(look.s===1)put(cx+strong*(Math.max(left.length,right.length)>=3?2*sx:0),12,'S');
if(look.s===2)[-1,1].forEach(function(n){var a=side(n),r=a[1]||a[0],x=r?r.x:cx+n*10*sx;
x=Math.max(8*sx,Math.min(W-8*sx,x));
if(n!==strong&&Math.max(left.length,right.length)>=3&&(c==='Cover 4'||c==='Cover 4 Palms'))x=cx+n*4*sx;
put(x,c==='Cover 6'?(n===strong?12:14):(c==='Cover 4'||c==='Cover 4 Palms'?12:14),'S');
});
var remaining=11-out.length;
for(var k=0;k<remaining;k++){
var x=remaining===4?[apex(-1),cx-2*sx,cx+2*sx,apex(1)][k]:remaining===3?[apex(-1),cx+strong*sx,apex(1)][k]:remaining===2?[apex(-1),apex(1)][k]:cx;
var mug=c==='Simulated Blitz'&&k<2,fire=c==='Fire Zone'&&k===0;
if(mug)x=cx+(k?1:-1)*2.5*sx;
if(fire)x=cx+strong*1.5*sx;
put(x,mug||fire?2:4.5,mug||fire?'THREAT':'LB');
}
return out;
}
var originalStart=startRep,originalDraw=draw;
startRep=function(){
originalStart();
st.on=false;st.done=false;st.fz=0;st.redPre=true;
$('ta').disabled=true;$('sc').disabled=true;$('go').disabled=false;$('go').textContent='Snap';
$('sit').textContent=$('sit').textContent.split(' | ')[0]+' | '+cfg.name+' | Read the defense.';
$('msg').textContent='Pre-snap: read the safeties, leverage and pressure threats. Press Snap when ready.';
$('pressureTime').textContent=(st.press/1000).toFixed(1)+'s';$('clk').style.width='100%';
};
$('go').addEventListener('click',function(e){
if(!st.redPre)return;
e.preventDefault();e.stopImmediatePropagation();
st.redPre=false;st.t0=performance.now();st.fz=0;st.on=true;st.done=false;
$('ta').disabled=false;$('sc').disabled=false;$('go').disabled=true;
$('msg').textContent=cfg.name+'. Read 1 → 2 → 3. First open receiver, or scramble or throw away if nobody is open.';
},true);
draw=function(){
originalDraw();
if(!st.redPre||$('game').classList.contains('hidden'))return;
g.save();g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=2;g.setLineDash([6,6]);
for(var i=0;i<cfg.sx.length;i++){var path=pts(i);g.beginPath();g.moveTo(path[0][0],path[0][1]);for(var k=1;k<path.length;k++)g.lineTo(path[k][0],path[k][1]);g.stroke()}
g.setLineDash([]);
redAlignment().forEach(function(p){g.fillStyle=p.role==='DL'?'#7F1D1D':'#DC2626';g.beginPath();g.arc(p.x,p.y,11,0,Math.PI*2);g.fill()});
g.restore();
};
var coach=document.querySelector('#setup .coach');
if(coach){var note=document.createElement('small');note.textContent='Pre-snap alignments use the red-zone field scale, receiver strength, slot/back positioning and compressed safety depths. Press Snap to start the read timer. The three-receiver drill and post-snap probability, spy and single-rusher models remain simplified; full match rules and pressure exchanges are not simulated.';coach.parentNode.insertBefore(note,coach.nextSibling)}
})();
/* Match the dashboard tabs on the standalone Playbook page only. */
(function(){
if(!/playbook\.html$/.test(location.pathname)||document.getElementById('playbookNav'))return;
var main=document.querySelector('main');if(!main)return;
var style=document.createElement('style');
style.textContent='.qb-tabs-wrap{max-width:100%;overflow-x:auto;padding:4px 2px 8px;margin:0 0 16px;-webkit-overflow-scrolling:touch}.qb-tabs{display:flex;gap:8px;width:max-content}.qb-tabs a{display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box;border:1px solid #E2E8F0;background:#fff;color:#0A1628;padding:10px 16px;border-radius:6px;font:800 12px system-ui,Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;text-decoration:none;white-space:nowrap}.qb-tabs a:hover{border-color:#14532D;color:#14532D}.qb-tabs a[aria-current="page"]{background:#14532D;color:#fff;border-color:#14532D}.qb-tabs a:focus-visible{outline:3px solid #F59E0B;outline-offset:2px}';
document.head.appendChild(style);
var wrap=document.createElement('div');wrap.className='qb-tabs-wrap';
var nav=document.createElement('nav');nav.id='playbookNav';nav.className='qb-tabs';nav.setAttribute('aria-label','Main navigation');
[['home','Home'],['drills','Drills'],['live','Live Training'],['coach','Coach Mode'],['players','Players'],['playbook','Playbook'],['results','Results'],['progress','Progress'],['pricing','Pricing']].forEach(function(tab){
var link=document.createElement('a');link.textContent=tab[1];link.dataset.page=tab[0];link.href=tab[0]==='playbook'?'playbook.html':'index.html#'+tab[0];
if(tab[0]==='playbook'){link.setAttribute('aria-current','page');link.addEventListener('click',function(e){e.preventDefault()})}
nav.appendChild(link);
});
wrap.appendChild(nav);main.insertBefore(wrap,main.firstChild);
})();
