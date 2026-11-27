(function(){
function load(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return[]}}
function weakest(){
  var me=localStorage.getItem('qbsense_user')||'guest';
  var gs=load('qbsense_game_results').filter(function(r){return (r.email||'guest')===me});
  var pr=load('qbsense_progression_results').filter(function(r){return (r.email||'guest')===me});
  var bl=load('qbsense_blitz_results').filter(function(r){return (r.email||'guest')===me});
  var rz=load('qbsense_redzone_results').filter(function(r){return (r.email||'guest')===me});
  var tm=load('qbsense_twominute_results').filter(function(r){return (r.email||'guest')===me});
  var cats=[];
  if(gs.length){var g=gs[gs.length-1];var acc=Number(g.accuracy)||0;cats.push({k:'accuracy',v:1-acc/100,tip:'Find the first open receiver before the rush gets home.'});if(g.avgTime!=null){var t=Number(g.avgTime);cats.push({k:'decision',v:Math.max(0,t/2.0-1),tip:'Get the ball out faster — read progression, then throw.'})}if(g.forced){var reps=g.att||g.total;var fr=reps?g.forced/reps:0;cats.push({k:'forced',v:fr,tip:'Do not force into coverage. Take the checkdown or throw it away.'})}if(g.pressureAtt){var pA=g.pressureAtt,pC=g.pressureComp||0;cats.push({k:'pressure',v:1-pC/pA,tip:'Under pressure, get to the quick outlet sooner.'})}}
  if(bl.length){var b=bl[bl.length-1];var ba=Number(b.accuracy)||0;cats.push({k:'blitz',v:1-ba/100,tip:'Identify the extra rusher before the snap.'})}
  if(tm.length){var t2=tm[tm.length-1];var ta=Number(t2.accuracy)||0;cats.push({k:'clock',v:1-ta/100,tip:'Manage the clock — use timeouts or spike when needed.'})}
  if(!cats.length)return {k:'accuracy',v:0.5,tip:'Start with Progression Reads to build your read progression.'};
  cats.sort(function(a,b){return b.v-a.v});
  return cats[0];
}
function plan(){
  var w=weakest();
  var drills=[];
  if(w.k==='accuracy'||w.k==='decision'){drills.push({n:'Progression Reads',u:'progression-sim.html',why:'Build faster read progression and find the first open receiver.'});drills.push({n:'Game Situations',u:'game-scenarios.html',why:'Practice full-drive reads against live coverage and pressure.'})}
  if(w.k==='forced'){drills.push({n:'Game Situations',u:'game-scenarios.html',why:'Practice taking the checkdown or throwing it away instead of forcing.'})}
  if(w.k==='pressure'){drills.push({n:'3D Pocket Pressure',u:'pocket-pressure-3d.html',why:'Move in the pocket and get the ball out under rush.'});drills.push({n:'Game Situations',u:'game-scenarios.html',why:'Handle extra rushers and find the quick outlet.'})}
  if(w.k==='blitz'){drills.push({n:'Blitz Recognition',u:'blitz-sim.html',why:'Identify the extra rusher before the snap.'})}
  if(w.k==='clock'){drills.push({n:'Two-Minute Drill',u:'twominute-sim.html',why:'Manage the clock and finish the drive under pressure.'})}
  if(drills.length<3){drills.push({n:'Red-Zone Decisions',u:'redzone-sim.html',why:'Make fast reads in tight spaces.'});if(drills.length<3)drills.push({n:'Game Situations',u:'game-scenarios.html',why:'Practice real football moments and decision-making.'})}
  return {focus:w,drills:drills.slice(0,5)};
}
function render(){
  var home=document.getElementById('home');
  if(!home)return;
  var old=document.getElementById('dailyPlan');
  if(old)old.remove();
  var p=plan();
  var card=document.createElement('div');
  card.className='card';card.id='dailyPlan';
  var h=document.createElement('h2');h.textContent='Today’s Training Plan';card.appendChild(h);
  var tip=document.createElement('p');tip.textContent='Focus: '+p.focus.tip;card.appendChild(tip);
  p.drills.forEach(function(d){
    var row=document.createElement('div');row.className='drill';
    var info=document.createElement('div');info.style.flex='1';
    var b=document.createElement('b');b.textContent=d.n;info.appendChild(b);
    var sm=document.createElement('small');sm.textContent=d.why;info.appendChild(sm);
    row.appendChild(info);
    var a=document.createElement('a');a.className='btn primary';a.href=d.u;a.style.padding='10px 14px';a.style.textDecoration='none';a.textContent='Start drill';row.appendChild(a);
    card.appendChild(row);
  });
  var stats=home.querySelector('.stats');
  if(stats)stats.after(card);else home.appendChild(card);
}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-page="home"]'))setTimeout(render,0)});
window.addEventListener('storage',render);
render();
})();