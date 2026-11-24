(function(){
function load(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}}
function me(){return localStorage.getItem('qbsense_user')||'guest'}
function allResults(){var m=me(),out=[];[['qbsense_progression_results','Progression Reads'],['qbsense_blitz_results','Blitz Recognition'],['qbsense_game_results','Game Situations']].forEach(function(k){load(k[0]).forEach(function(r){if((r.email||'guest')===m){r.drill=k[1];out.push(r)}})});out.sort(function(a,b){return new Date(b.date)-new Date(a.date)});return out}
function dayKey(d){var x=new Date(d);return x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate()}
function compute(){
var rs=allResults(),today=new Date(),weekStart=new Date(today);
weekStart.setDate(today.getDate()-((today.getDay()+6)%7));weekStart.setHours(0,0,0,0);
var weekReps=0,streak=0,ratings=[],days={};
rs.forEach(function(r){
var reps=Number(r.plays||r.att||r.total||0),d=new Date(r.date);
if(d>=weekStart)weekReps+=reps;days[dayKey(r.date)]=true;
var acc=Number(r.accuracy)||0,pa=Number(r.pressureAtt||0),pc=Number(r.pressureComp||0),f=Number(r.forced||0),tot=Number(r.total||r.att||r.plays||0);
var pr=pa?pc/pa:1,fr=tot?f/tot:0;
var rating=Math.round(Math.max(0,Math.min(100,acc*.6+pr*100*.2+(1-fr)*100*.2)));
ratings.push({date:r.date,rating:rating,acc:acc,drill:r.drill});
});
var d=new Date(today);d.setHours(0,0,0,0);if(!days[dayKey(d)])d.setDate(d.getDate()-1);
while(days[dayKey(d)]){streak++;d.setDate(d.getDate()-1)}
var totalReps=rs.reduce(function(a,r){return a+Number(r.plays||r.att||r.total||0)},0);
return{weekReps:weekReps,streak:streak,ratings:ratings.slice(0,10).reverse(),totalReps:totalReps,sessions:rs.length,latestAccuracy:ratings.length?ratings[0].acc:0,hasResults:rs.length>0};
}
function spark(vals){if(!vals.length)return '';var w=120,h=30,min=Math.min.apply(null,vals),max=Math.max.apply(null,vals),rng=(max-min)||1;var pts=vals.map(function(v,i){var x=i/(vals.length-1||1)*w,y=h-((v-min)/rng)*(h-4)-2;return x+','+y}).join(' ');return '<svg width="'+w+'" height="'+h+'"><polyline points="'+pts+'" fill="none" stroke="#14532D" stroke-width="2"/></svg>'}
function badgeList(c){return[
{name:'100 Reps',icon:'100',goal:100,value:c.totalReps,unit:'reps',rule:'Complete 100 recorded reps.'},
{name:'500 Reps',icon:'500',goal:500,value:c.totalReps,unit:'reps',rule:'Complete 500 recorded reps.'},
{name:'3-Day Streak',icon:'3D',goal:3,value:c.streak,unit:'consecutive days',rule:'Maintain a current 3-day training streak.'},
{name:'7-Day Streak',icon:'7D',goal:7,value:c.streak,unit:'consecutive days',rule:'Maintain a current 7-day training streak.'},
{name:'80%+ Accuracy',icon:'80%',goal:80,value:c.latestAccuracy,unit:'%',rule:'Score at least 80% accuracy in your latest recorded session.'},
{name:'10 Sessions',icon:'10',goal:10,value:c.sessions,unit:'sessions',rule:'Complete 10 recorded sessions.'}
] }
function render(){
var sec=document.getElementById('results');if(!sec)return;var c=compute();
var card=document.getElementById('metricsCard');if(!card){card=document.createElement('div');card.id='metricsCard';card.className='card';sec.insertBefore(card,sec.firstChild)}
var goal=50,pct=Math.min(100,Math.round(c.weekReps/goal*100)),trend=spark(c.ratings.map(function(r){return r.rating}));
var badges=badgeList(c),unlocked=badges.filter(function(b){return b.value>=b.goal}).length;
card.innerHTML='<h2>Streaks &amp; Milestones</h2><div class="stats"><span>This week <b>'+c.weekReps+'/'+goal+' reps</b></span><span>Streak <b>'+c.streak+' days</b></span><span>Total reps <b>'+c.totalReps+'</b></span></div><div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;margin:8px 0"><span style="display:block;height:100%;width:'+pct+'%;background:#14532D"></span></div><div id="qbBadgeCollection" style="margin-top:26px"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px"><div><h3 style="margin:0;font-size:19px;line-height:1.3">Badge Collection</h3><p style="margin:3px 0 0;color:#5B6B7C;font-size:13px">Earn badges as you build reps, consistency, and accuracy.</p></div><span style="flex:none;padding:6px 11px;border-radius:999px;background:#F0FDF4;color:#14532D;font-size:12px;font-weight:800;white-space:nowrap">'+unlocked+' / '+badges.length+' unlocked</span></div><div id="qbBadgeGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px"></div><p style="font-size:12px;color:#64748B;line-height:1.5;margin:14px 0 0">Based on this account’s Progression Reads, Blitz Recognition, and Game Situations history saved in this browser. Streak badges reflect your current streak; the accuracy badge reflects your latest session. Records without a rep count do not increase rep milestones.</p></div><div class="stats" style="margin-top:10px"><span>QB Rating trend</span></div>'+(trend||'<small>Complete a few drills to see your trend.</small>');
var grid=card.querySelector('#qbBadgeGrid');
badges.forEach(function(b){
var earned=b.value>=b.goal,percent=Math.max(0,Math.min(100,Math.round(b.value/b.goal*100)));
var tile=document.createElement('article');
tile.style.cssText='position:relative;border:1px solid '+(earned?'#86EFAC':'#E2E8F0')+';border-radius:14px;padding:16px;background:'+(earned?'#F7FEF8':'#FFFFFF')+';color:#0A1628;box-shadow:0 1px 2px rgba(15,23,42,.04)';
var top=document.createElement('div');top.style.cssText='display:flex;align-items:flex-start;justify-content:space-between;gap:10px';
var icon=document.createElement('div');icon.textContent=b.icon;icon.setAttribute('aria-hidden','true');
icon.style.cssText='display:grid;place-items:center;min-width:44px;height:44px;border-radius:12px;font-size:12px;font-weight:900;letter-spacing:-.02em;background:'+(earned?'#FDE68A':'#F1F5F9')+';color:'+(earned?'#78350F':'#475569');top.appendChild(icon);
var status=document.createElement('span');status.textContent=earned?'Earned':'Locked';status.style.cssText='flex:none;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:800;background:'+(earned?'#DCFCE7':'#F1F5F9')+';color:'+(earned?'#14532D':'#64748B');top.appendChild(status);
tile.appendChild(top);
var h=document.createElement('h4');h.textContent=b.name;h.style.cssText='margin:12px 0 4px;font-size:15px;line-height:1.3';tile.appendChild(h);
var rule=document.createElement('p');rule.textContent=b.rule;rule.style.cssText='margin:0;font-size:12.5px;line-height:1.45;color:#5B6B7C';tile.appendChild(rule);
var progress=document.createElement('progress');progress.max=b.goal;progress.value=Math.min(b.goal,Math.max(0,b.value));progress.setAttribute('aria-label',b.name+' progress');progress.style.cssText='display:block;width:100%;height:7px;margin:12px 0 6px;accent-color:#14532D';tile.appendChild(progress);
var text=document.createElement('p');text.style.cssText='margin:0;font-size:12px;font-weight:600;color:#334155';
text.textContent=b.unit==='%'?(c.hasResults?b.value+'% latest accuracy · 80% goal':'No session yet · 80% goal'):b.value+' / '+b.goal+' '+b.unit;tile.appendChild(text);
if(!earned){var left=document.createElement('p');left.style.cssText='margin:4px 0 0;font-size:12px;color:#64748B';left.textContent=b.unit==='%'?'Finish your next recorded session at 80% or higher.':(b.goal-b.value)+' more '+b.unit+' to unlock.';tile.appendChild(left)}
grid.appendChild(tile);
});
}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-page="results"],[data-goto="results"]'))setTimeout(render,0)});
window.addEventListener('storage',render);
window.addEventListener('pageshow',render);
render();
})();
