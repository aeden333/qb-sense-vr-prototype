/* QB Sense VR — shared playbook engine.
   Default plays remain available until a team imports and activates a playbook.
   Team plays are used first; default plays are the fallback. */

var DEFAULT_PLAYS = [
  {name:'Four Verticals',r:[
    {n:'Seam',x:70,y:0,p:[[0,-150]],c:'D'},
    {n:'Seam',x:170,y:0,p:[[0,-150]],c:'D'},
    {n:'Seam',x:470,y:0,p:[[0,-150]],c:'D'},
    {n:'Seam',x:570,y:0,p:[[0,-150]],c:'D'}
  ]},
  {name:'Mesh',r:[
    {n:'Drag',x:70,y:0,p:[[0,-25],[450,-30]],c:'Q'},
    {n:'Drag',x:570,y:0,p:[[0,-25],[-450,-30]],c:'Q'},
    {n:'Corner',x:470,y:0,p:[[0,-170],[60,-250]],c:'D'},
    {n:'Sit',x:250,y:0,p:[[0,-100],[0,-90]],c:'M'}
  ]},
  {name:'Levels',r:[
    {n:'Dig',x:440,y:0,p:[[0,-120],[-110,-120]],c:'M'},
    {n:'Shallow In',x:370,y:0,p:[[0,-55],[-100,-55]],c:'Q'},
    {n:'Go',x:570,y:0,p:[[0,-250]],c:'D'},
    {n:'Out',x:70,y:0,p:[[0,-80],[-50,-80]],c:'Q',oob:true}
  ]},
  {name:'Five Verticals',r:[
    {n:'Seam',x:70,y:0,p:[[0,-150]],c:'D'},
    {n:'Seam',x:170,y:0,p:[[0,-150]],c:'D'},
    {n:'Go',x:570,y:0,p:[[0,-250]],c:'D'},
    {n:'Go',x:470,y:0,p:[[0,-250]],c:'D'},
    {n:'Post',x:250,y:0,p:[[0,-170],[-110,-250]],c:'D'}
  ]},
  {name:'Flood',r:[
    {n:'Clear',x:570,y:0,p:[[0,-250]],c:'D'},
    {n:'Sail',x:470,y:0,p:[[0,-120],[50,-140]],c:'M'},
    {n:'Flat',x:390,y:0,p:[[40,-30],[90,-40]],c:'Q'},
    {n:'Slant',x:70,y:0,p:[[0,-25],[60,-80]],c:'Q'},
    {n:'Checkdown',x:250,y:30,p:[[-60,-30]],c:'Q'}
  ]}
];

function getTeamPlaybook(){
  try{
    var raw=localStorage.getItem('qbsense_team_playbook');
    if(!raw)return null;
    var data=JSON.parse(raw);
    if(!data||!Array.isArray(data.plays)||!data.plays.length)return null;
    return data;
  }catch(e){return null}
}

function saveTeamPlaybook(data){
  localStorage.setItem('qbsense_team_playbook',JSON.stringify(data));
}

function clearTeamPlaybook(){
  localStorage.removeItem('qbsense_team_playbook');
}

function isTeamPlaybookActive(){
  return localStorage.getItem('qbsense_team_playbook_active')==='true';
}

function setTeamPlaybookActive(active){
  localStorage.setItem('qbsense_team_playbook_active',active?'true':'false');
}

function getPlay(concept){
  var team=getTeamPlaybook();
  if(team&&isTeamPlaybookActive()){
    var match=team.plays.filter(function(p){
      return !concept||String(p.concept||p.name||'').toLowerCase().indexOf(String(concept).toLowerCase())>=0;
    });
    if(match.length)return match[Math.floor(Math.random()*match.length)];
  }
  var pool=DEFAULT_PLAYS;
  if(concept){
    var fallback=pool.filter(function(p){
      return String(p.name).toLowerCase().indexOf(String(concept).toLowerCase())>=0;
    });
    if(fallback.length)pool=fallback;
  }
  return pool[Math.floor(Math.random()*pool.length)];
}

/* Install after the Game Situations inline engine has defined nextPlay. */
document.addEventListener('DOMContentLoaded',function(){
  if(!document.getElementById('playbookSource')||typeof window.nextPlay!=='function'||!window.st)return;
  var originalNextPlay=window.nextPlay;
  window.nextPlay=function(){
    var result=originalNextPlay.apply(this,arguments);
    var source=document.getElementById('playbookSource');
    if(source.value!=='auto')return result;
    var play=window.st.play;
    if(!play||!Array.isArray(play.r))return result;
    play.r.forEach(function(route){
      if(!Array.isArray(route.p))return;
      var name=String(route.n).toLowerCase();
      if(name==='out'){
        var depth=-10*window.PX-route.y;
        route.p=route.p.map(function(point){return [point[0],depth]});
        return;
      }
      if(name!=='slant')return;
      var inward=route.x<320?1:-1;
      route.p=route.p.map(function(point){
        return [Math.abs(point[0])*inward,point[1]];
      });
    });
    return result;
  };
});
