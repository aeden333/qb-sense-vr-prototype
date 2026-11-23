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

var isGameSituations=!!document.getElementById('scenario');
var isTwoMinute=!!document.getElementById('def');
if(!isGameSituations&&!isTwoMinute)return;
var defenses=['Man','Cover 0','Cover 1','Cover 2','Cover 3','Cover 4','Cover 2 Man','Cover 3 Match','Cover 6','Cover 4 Palms','Fire Zone','Simulated Blitz'];
if(isTwoMinute){
var extraProbs={'Cover 2 Man':{Q:.35,M:.25,D:.3},'Cover 3 Match':{Q:.5,M:.3,D:.25},'Cover 6':{Q:.5,M:.3,D:.2},'Cover 4 Palms':{Q:.5,M:.3,D:.2},'Fire Zone':{Q:.4,M:.35,D:.3},'Simulated Blitz':{Q:.35,M:.3,D:.35}};
Object.keys(extraProbs).forEach(function(name){if(!window.PROB[name])window.PROB[name]=extraProbs[name]});
var extraNotes={'Cover 2 Man':'Cover 2 Man: two deep, man underneath. Crossing routes and quick throws beat it.','Cover 3 Match':'Cover 3 Match: three deep, match underneath. Work the middle and short.','Cover 6':'Cover 6: quarter-quarter-half. The half side is soft to the flat.','Cover 4 Palms':'Cover 4 Palms: quarters with palms. Corners and safeties match outside and slot routes.','Fire Zone':'Fire Zone: five rush, three deep, three under. Get rid of it fast.','Simulated Blitz':'Simulated blitz: some rushers drop. Read the real pressure, not the look.'};
Object.keys(extraNotes).forEach(function(name){if(!window.COVNOTE[name])window.COVNOTE[name]=extraNotes[name]});
var alignConfig={'Cover 2 Man':{cd:6,sf:'two',lb:28},'Cover 3 Match':{cd:10,sf:'single',lb:30},'Cover 6':{cd:12,sf:'half',lb:30},'Cover 4 Palms':{cd:10,sf:'two',lb:32},'Fire Zone':{cd:8,sf:'single',lb:20},'Simulated Blitz':{cd:8,sf:'two',lb:15}};
var originalAlign=window.align;
window.align=function(inclBlitz){
var cfg=alignConfig[window.st&&window.st.cvg];
if(!cfg||!window.st||!window.st.play)return originalAlign(inclBlitz);
var L=window.LOSY,cd=[],sf=[],lb=[];
window.st.play.r.forEach(function(route){cd.push({x:route.x,y:L-cfg.cd})});
var shells={'none':[],'single':[[320,L-130]],'two':[[160,L-130],[480,L-130]],'half':[[480,L-130]]};
(shells[cfg.sf]||[]).forEach(function(q){sf.push({x:q[0],y:q[1]})});
var total=inclBlitz?11:11-window.st.extra;
var lbCount=Math.max(0,total-cd.length-sf.length);
for(var k=0;k<lbCount;k++)lb.push({x:100+k*80,y:L-cfg.lb});
return{cd:cd,sf:sf,lb:lb};
};
}
var originalDefenses=(window.ALLCOV||[]).slice();
if(isTwoMinute)originalDefenses=defenses.slice();
if(!originalDefenses.length)return;
var coach=document.querySelector('.coach');
if(!coach)return;
var wrap=document.createElement('label');
wrap.className='qb-defense';
wrap.innerHTML='Defense <select id="defenseSelect"><option value="random">Random</option></select>';
var select=wrap.querySelector('select');
defenses.forEach(function(name){
if(originalDefenses.indexOf(name)>=0){
var option=document.createElement('option');
option.value=name;option.textContent=name;select.appendChild(option);
}
});
coach.insertBefore(wrap,coach.firstChild);
select.addEventListener('change',function(){
var value=select.value;
window.ALLCOV=value==='random'?originalDefenses.slice():[value];
});
window.ALLCOV=originalDefenses.slice();
})();
