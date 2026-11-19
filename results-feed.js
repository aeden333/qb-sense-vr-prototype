(function(){
function latest(){
  var me=localStorage.getItem('qbsense_user')||'guest',all=[];
  [['qbsense_progression_results','Progression Reads'],['qbsense_blitz_results','Blitz Recognition']].forEach(function(k){
    try{
      JSON.parse(localStorage.getItem(k[0])||'[]').forEach(function(r){
        if((r.email||'guest')===me){r.drill=k[1];all.push(r)}
      });
    }catch(e){}
  });
  all.sort(function(a,b){return new Date(b.date)-new Date(a.date)});
  return all[0];
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
      p.textContent=r.drill+': '+acc+'% accuracy at level '+(r.level||1)+(r.coverage?' against '+r.coverage:'')+'. '+(acc>=80?'Strong session. Try the next level.':'Keep working this level. Read the first option, then the second, then the third, and make the quick decision.');
    }
  }
  var map={
    'Correct Read':['Correct Reads',r.total?(r.correct+'/'+r.total):(r.accuracy+'%')],
    'Correct Reads':['Correct Reads',r.total?(r.correct+'/'+r.total):(r.accuracy+'%')],
    'Decision Time':['Decision Time',r.avgTime!=null?Number(r.avgTime).toFixed(1)+'s':'\u2014'],
    'Throw Accuracy':['Accuracy',(r.accuracy!=null?r.accuracy:0)+'%'],
    'Accuracy':['Accuracy',(r.accuracy!=null?r.accuracy:0)+'%'],
    'Pocket Movement':['Pressure Response',r.pressureResponse!=null?r.pressureResponse+'%':'\u2014'],
    'Pressure Response':['Pressure Response',r.pressureResponse!=null?r.pressureResponse+'%':'\u2014']
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