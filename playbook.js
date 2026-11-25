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

/* Playbook editor: distances use the drill's five pixels per yard. */
document.addEventListener('DOMContentLoaded',function(){
  var canvas=document.getElementById('playPreview');
  if(!canvas||typeof window.routeData!=='function')return;
  var $=function(id){return document.getElementById(id)},paths=[null,null,null,null,null],drag=-1;
  var panel=document.createElement('section');
  panel.innerHTML='<h3>Draw and measure routes</h3><p>Select a receiver. In Draw mode, tap to add points or drag a breakpoint. Turn Draw mode off to move players. Distances are in yards; right is positive, left is negative.</p><label>Receiver</label><select id="routeEditorPlayer"></select><label><input id="routeEditorDraw" type="checkbox" style="width:auto"> Draw mode</label> <label><input id="routeEditorSnap" type="checkbox" checked style="width:auto"> Snap to 1 yard</label><div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button type="button" class="btn ghost" id="routeEditorPreset">Edit preset</button><button type="button" class="btn ghost" id="routeEditorClear">Clear route</button><button type="button" class="btn ghost" id="routeEditorUndo">Remove last point</button><button type="button" class="btn ghost" id="routeEditorReset">Restore preset</button></div><label>Route label</label><input id="routeEditorName" maxlength="40" placeholder="Optional custom label"><label>Depth scale (%)</label><input id="routeEditorDepth" type="number" min="1" max="500" value="100"><label>Width scale (%)</label><input id="routeEditorWidth" type="number" min="1" max="500" value="100"><button type="button" class="btn ghost" id="routeEditorScale">Apply scale</button><div id="routeEditorPoints"></div><p id="routeEditorStatus" role="status"></p>';
  canvas.insertAdjacentElement('afterend',panel);
  var labels=['','','','',''];
  function selected(){return Number($('routeEditorPlayer').value)||0}
  function base(i){return window.routeData($('side'+i).value,$('route'+i).value,window.customPositions[i])}
  function points(i){return paths[i]===null?base(i).p:paths[i]}
  function edit(){var i=selected();if(paths[i]===null)paths[i]=points(i).map(function(p){return p.slice()});return paths[i]}
  function round(n){return Math.round(n*10)/10}
  function rows(){
    var n=Number($('receiverCount').value),old=selected();
    $('routeEditorPlayer').innerHTML='';
    for(var i=0;i<n;i++){var o=document.createElement('option');o.value=i;o.textContent=i===4?'RB 5':'WR '+(i+1);$('routeEditorPlayer').appendChild(o)}
    $('routeEditorPlayer').value=Math.min(old,n-1);refresh();
  }
  function refresh(){
    var i=selected(),r=base(i),p=points(i);
    $('routeEditorName').value=labels[i];
    $('routeEditorPoints').innerHTML='<p>Each point: horizontal yards from receiver; depth yards from line of scrimmage.</p>'+p.map(function(pt,k){return '<div style="display:grid;grid-template-columns:65px 1fr 1fr;gap:8px;margin:8px 0"><span>Point '+(k+1)+'</span><input aria-label="Point '+(k+1)+' horizontal yards" data-point="'+k+'" data-axis="0" type="number" step="0.1" value="'+round(pt[0]/5)+'"><input aria-label="Point '+(k+1)+' depth yards" data-point="'+k+'" data-axis="1" type="number" step="0.1" value="'+round((r.y-pt[1])/5)+'"></div>'}).join('');
    $('routeEditorStatus').textContent=paths[i]===null?'Preset route. Choose Edit preset or draw a custom path.':'Custom route: '+p.length+' points.';
    render();
  }
  function render(){
    var g=canvas.getContext('2d'),n=Number($('receiverCount').value);
    g.clearRect(0,0,640,360);g.fillStyle='#14532D';g.fillRect(0,0,640,360);
    g.lineWidth=1;
    for(var y=0;y<=350;y+=5){g.strokeStyle=y%25===0?'rgba(255,255,255,.35)':'rgba(255,255,255,.08)';g.beginPath();g.moveTo(0,y);g.lineTo(640,y);g.stroke()}
    if($('routeEditorSnap').checked){g.strokeStyle='rgba(255,255,255,.08)';for(var x=0;x<=640;x+=5){g.beginPath();g.moveTo(x,0);g.lineTo(x,360);g.stroke()}}
    g.fillStyle='#fff';g.font='11px sans-serif';
    for(var d=5;d<=60;d+=5)g.fillText(d+' yd',5,300-d*5-3);
    g.strokeStyle='#60A5FA';g.lineWidth=2;g.beginPath();g.moveTo(0,300);g.lineTo(640,300);g.stroke();g.fillText('LOS',5,315);
    for(var i=0;i<n;i++){
      var r=base(i),sy=300-r.y,p=points(i);
      g.strokeStyle=i===selected()?'#FFD700':'#fff';g.lineWidth=i===selected()?3:2;g.beginPath();g.moveTo(r.x,sy);p.forEach(function(pt){g.lineTo(r.x+pt[0],sy+pt[1])});g.stroke();
      g.fillStyle='#FFD700';g.beginPath();g.arc(r.x,sy,8,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.fillText(i===4?'RB 5':'WR '+(i+1),r.x-14,sy-12);
      if(i===selected())p.forEach(function(pt){g.fillStyle='#38BDF8';g.beginPath();g.arc(r.x+pt[0],sy+pt[1],5,0,Math.PI*2);g.fill()});
    }
    g.fillStyle='#F59E0B';g.beginPath();g.arc(320,315,10,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.fillText('QB',310,338);
  }
  window.drawPreview=render;
  $('routeEditorPlayer').addEventListener('change',refresh);
  $('routeEditorName').addEventListener('input',function(){labels[selected()]=this.value});
  $('routeEditorSnap').addEventListener('change',render);
  $('routeEditorPreset').onclick=function(){edit();refresh()};
  $('routeEditorClear').onclick=function(){paths[selected()]=[];refresh()};
  $('routeEditorUndo').onclick=function(){edit().pop();refresh()};
  $('routeEditorReset').onclick=function(){paths[selected()]=null;labels[selected()]='';refresh()};
  $('routeEditorScale').onclick=function(){
    var ds=Number($('routeEditorDepth').value)/100,ws=Number($('routeEditorWidth').value)/100;
    if(!Number.isFinite(ds)||!Number.isFinite(ws)||ds<=0||ws<=0||ds>5||ws>5){$('routeEditorStatus').textContent='Enter scales from 1 to 500 percent.';return}
    paths[selected()]=edit().map(function(pt){return [pt[0]*ws,pt[1]*ds]});
    $('routeEditorDepth').value=100;$('routeEditorWidth').value=100;refresh();
  };
  $('routeEditorPoints').addEventListener('change',function(e){
    var input=e.target,k=Number(input.dataset.point),axis=Number(input.dataset.axis),v=Number(input.value);
    if(!input.hasAttribute('data-point')||!Number.isFinite(v))return;
    var p=edit(),r=base(selected());p[k][axis]=axis===0?v*5:r.y-v*5;refresh();
  });
  function location(e){var rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*640/rect.width,y:(e.clientY-rect.top)*360/rect.height}}
  function store(k,pos){
    var r=base(selected()),sx=$('routeEditorSnap').checked?Math.round((pos.x-r.x)/5)*5:pos.x-r.x;
    var depth=300-pos.y;if($('routeEditorSnap').checked)depth=Math.round(depth/5)*5;
    edit()[k]=[sx,r.y-depth];
  }
  canvas.addEventListener('pointerdown',function(e){
    if(!$('routeEditorDraw').checked)return;
    e.preventDefault();e.stopImmediatePropagation();var pos=location(e),r=base(selected()),p=edit();drag=-1;
    p.forEach(function(pt,k){if(Math.hypot(r.x+pt[0]-pos.x,300-r.y+pt[1]-pos.y)<12)drag=k});
    if(drag<0){drag=p.length;store(drag,pos)}canvas.setPointerCapture(e.pointerId);refresh();
  },true);
  canvas.addEventListener('pointermove',function(e){if(drag<0)return;e.preventDefault();store(drag,location(e));refresh()},true);
  function finish(){drag=-1}
  canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
  ['mousedown','mousemove','mouseup','touchstart','touchmove','touchend'].forEach(function(type){canvas.addEventListener(type,function(e){if($('routeEditorDraw').checked){e.preventDefault();e.stopImmediatePropagation()}}, {capture:true,passive:false})});
  $('routeRows').addEventListener('change',function(e){if(e.target.id.indexOf('route')===0){paths[Number(e.target.id.slice(5))]=null}refresh()});
  $('receiverCount').addEventListener('change',rows);
  $('formation').addEventListener('change',function(){paths=[null,null,null,null,null];labels=['','','','',''];rows()});
  $('savePlay').addEventListener('click',function(e){
    e.preventDefault();e.stopImmediatePropagation();var name=$('playName').value.trim(),concept=$('playConcept').value.trim();
    if(!name||!concept){window.setConvert('Enter a play name and concept.',false);return}
    var routes=[],n=Number($('receiverCount').value);
    for(var i=0;i<n;i++){var r=base(i);if(!points(i).length){window.setConvert('Add at least one route point for receiver '+(i+1)+'.',false);return}r.p=points(i).map(function(pt){return pt.slice()});r.y=-r.y;if(labels[i].trim())r.n=labels[i].trim();routes.push(r)}
    try{var team=getTeamPlaybook()||{name:'Team Playbook',plays:[]};team.plays.push({name:name,concept:concept,r:routes});saveTeamPlaybook(team);setTeamPlaybookActive(true);window.setConvert('Saved '+name+' with exact route distances.',true);window.update()}catch(error){window.setConvert('Could not save the play. Browser storage may be full or blocked.',false)}
  },true);
  rows();
});
