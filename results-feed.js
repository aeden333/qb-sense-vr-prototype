(function(){
function latest(){
  var me=localStorage.getItem('qbsense_user')||'guest',all=[];
  [['qbsense_readthrow_results','Read & Throw'],['qbsense_progression_results','Progression Reads'],['qbsense_blitz_results','Blitz Recognition'],['qbsense_game_results','Game Situations']].forEach(function(k){
    try{
      JSON.parse(localStorage.getItem(k[0])||'[]').forEach(function(r){
        if((r.email||'guest')===me){r.drill=k[1];all.push(r)}
      });
    }catch(e){}
  });
  all.sort(function(a,b){return new Date(b.date)-new Date(a.date)});
  return all[0];
}
function coachFocus(r){
  if(!r)return '';
  var acc=Number(r.accuracy)||0,avg=r.avgTime!=null?Number(r.avgTime):0,f=r.forced||0,pa=r.pressureAtt||0,pc=r.pressureComp||0,pr=pa?pc/pa:1;
  var worst='accuracy',w=1-acc/100;
  var dt=avg/2.0;if(dt-1>w){worst='decision time';w=dt-1}
  var fr=r.total? f/r.total : 0;if(fr>w){worst='forced throws';w=fr}
  if(pa&&(1-pr)>w){worst='pressure response';w=1-pr}
  var tips={accuracy:'Find the first open receiver before the rush gets home.',decision:'Get the ball out faster — read progression, then throw.',forced:'Do not force into coverage. Take the checkdown or throw it away.',pressure:'Under pressure, get to the quick outlet sooner.'};
  return ' Coaching focus: '+tips[worst];
}
function render(){
  var sec=document.getElementById('results');
  if(!sec)return;
  var r=latest();
  if(!r)return;
  var card=sec.querySelector('.card');
  if(card){
    var h=card.querySelector('h2'),p=card.querySelector('p');
    if(h)h.textContent='Latest Session: '+r.drill;
    if(p){
      var acc=Number(r.accuracy)||0;
      p.textContent=r.drill+': '+acc+'% accuracy at level '+(r.level||1)+(r.coverage?' against '+r.coverage:'')+'. '+(acc>=80?'Strong session. Try the next level.':'Keep working this level. Read the first option, then the second, then the third, and make the quick decision.')+coachFocus(r);
    }
  }
  var map={
    'Correct Read':['Correct Reads',r.total?(r.correct+'/'+r.total):(r.accuracy+'%')],
    'Correct Reads':['Correct Reads',r.total?(r.correct+'/'+r.total):(r.accuracy+'%')],
    'Decision Time':['Decision Time',r.avgTime!=null?Number(r.avgTime).toFixed(1)+'s':'\u2014'],
    'Throw Accuracy':['Accuracy',(r.accuracy!=null?r.accuracy:0)+'%'],
    'Accuracy':['Accuracy',(r.accuracy!=null?r.accuracy:0)+'%'],
    'Pocket Movement':['Pressure Response',r.pressureAtt?Math.round(r.pressureComp/r.pressureAtt*100)+'%':'\u2014'],
    'Pressure Response':['Pressure Response',r.pressureAtt?Math.round(r.pressureComp/r.pressureAtt*100)+'%':'\u2014'],
    'Forced Throws':['Forced Throws',r.forced!=null?String(r.forced):'\u2014']
  };
  sec.querySelectorAll('.stat-card').forEach(function(c){
    var l=c.querySelector('.label'),v=c.querySelector('.stat');
    if(!l||!v)return;
    var m=map[l.textContent.trim()];
    if(m){l.textContent=m[0];v.textContent=m[1]}
  });
}
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('[data-page="results"]'))setTimeout(render,0);
});
document.addEventListener('click',function(e){
  var button=e.target.closest&&e.target.closest('#mainNav button[data-page="playbook"]');
  if(button){
    e.stopImmediatePropagation();
    e.preventDefault();
    window.location.href='playbook.html';
  }
},true);
window.addEventListener('storage',render);
render();
})();