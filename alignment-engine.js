(function(){
if(!/game-scenarios\.html$/.test(location.pathname))return;
var W=640,H=440,LOSY=250,PX=5,QBX=320,QBY=312,SL=6,SR=634,FOOT=(SR-SL)/160;
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
var OL=[{id:'LT',dx:-9*FOOT},{id:'LG',dx:-4*FOOT},{id:'C',dx:0},{id:'RG',dx:4*FOOT},{id:'RT',dx:9*FOOT}];
var FORMS=[
{name:'2x2',wr3:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:190,y:0},{id:'Z',role:'WR',x:550,y:0}],wr4:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:190,y:0},{id:'Y',role:'SLOT',x:450,y:0},{id:'Z',role:'WR',x:550,y:0}],rb:{x:390,y:80}},
{name:'Trips Right',wr3:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:410,y:0},{id:'Y',role:'SLOT',x:450,y:0}],wr4:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:410,y:0},{id:'Y',role:'SLOT',x:450,y:0},{id:'Z',role:'WR',x:550,y:0}],rb:{x:390,y:80}},
{name:'Trips Left',wr3:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:130,y:0},{id:'Y',role:'SLOT',x:190,y:0}],wr4:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:130,y:0},{id:'Y',role:'SLOT',x:190,y:0},{id:'Z',role:'WR',x:550,y:0}],rb:{x:250,y:80}},
{name:'Bunch Right',wr3:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:400,y:0},{id:'Y',role:'SLOT',x:430,y:0}],wr4:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:400,y:0},{id:'Y',role:'SLOT',x:430,y:0},{id:'Z',role:'WR',x:550,y:0}],rb:{x:390,y:80}},
{name:'Bunch Left',wr3:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:180,y:0},{id:'Y',role:'SLOT',x:210,y:0}],wr4:[{id:'X',role:'WR',x:90,y:0},{id:'H',role:'SLOT',x:180,y:0},{id:'Y',role:'SLOT',x:210,y:0},{id:'Z',role:'WR',x:550,y:0}],rb:{x:250,y:80}},
{name:'Empty',wr3:[{id:'X',role:'WR',x:70,y:0},{id:'H',role:'SLOT',x:170,y:0},{id:'TE',role:'TE',x:372,y:0}],wr4:[{id:'X',role:'WR',x:70,y:0},{id:'H',role:'SLOT',x:170,y:0},{id:'TE',role:'TE',x:372,y:0},{id:'Y',role:'SLOT',x:470,y:0}],rb:null}
];
var COV={
'Man':{deep:2,man:true,cbDepth:1,slotDepth:4,safetyDepth:14,lbDepth:4},
'Cover 0':{deep:0,man:true,cbDepth:1,slotDepth:4,lbDepth:3},
'Cover 1':{deep:1,man:true,cbDepth:2,slotDepth:5,safetyDepth:14,lbDepth:4},
'Cover 2':{deep:2,cbDepth:7,slotDepth:5,safetyDepth:14,lbDepth:4,cloud:true},
'Cover 3':{deep:1,cbDepth:8,slotDepth:5,safetyDepth:14,lbDepth:4},
'Cover 4':{deep:2,cbDepth:7,slotDepth:5,safetyDepth:12,lbDepth:4},
'Cover 2 Man':{deep:2,man:true,cbDepth:1,slotDepth:4,safetyDepth:14,lbDepth:4},
'Cover 3 Match':{deep:1,cbDepth:7,slotDepth:5,safetyDepth:14,lbDepth:4},
'Cover 6':{deep:1,cbDepth:7,slotDepth:5,safetyDepth:12,lbDepth:4,split:true},
'Cover 4 Palms':{deep:2,cbDepth:6,slotDepth:5,safetyDepth:12,lbDepth:4},
'Fire Zone':{deep:1,cbDepth:8,slotDepth:5,safetyDepth:14,lbDepth:4,fire:true},
'Simulated Blitz':{deep:2,cbDepth:7,slotDepth:5,safetyDepth:12,lbDepth:4,sim:true}
};
function buildOffense(form,concept,use5,rbIdx,side){
var dir=side==='Left'?-1:1;
var players=[{id:'QB',role:'QB',x:QBX,y:QBY,eligible:false}];
OL.forEach(function(o){players.push({id:o.id,role:'OL',x:QBX+o.dx,y:LOSY,eligible:false})});
var elig=use5?form.wr4:form.wr3;
var routes=use5?concept.wr4:concept.wr3;
elig.forEach(function(p,i){var rt=routes[i]||{n:'Checkdown',p:[[0,-25]],c:'Q'};players.push({id:p.id,role:p.role,x:p.x,y:p.y,eligible:true,route:rt})});
if(form.rb){var r=concept.rb[rbIdx];players.push({id:'RB',role:'RB',x:side==='Left'?250:390,y:80,eligible:true,route:{n:r.n,p:r.p.map(function(pt){return[pt[0]*dir,pt[1]]}),c:r.c,oob:r.oob}})}
return players;
}
function offenseFromRoutes(routes){
var players=[{id:'QB',role:'QB',x:QBX,y:QBY,eligible:false}];
OL.forEach(function(o){players.push({id:o.id,role:'OL',x:QBX+o.dx,y:LOSY,eligible:false})});
routes.forEach(function(r,i){var role=r.y>20?'RB':(i<2?'WR':'SLOT');players.push({id:'P'+i,role:role,x:r.x,y:r.y,eligible:true,route:r})});
return players;
}
function buildDefense(){
var c=st.cvg,cfg=COV[c]||COV['Cover 3'];
var d=[];
var ol=st.offense.filter(function(o){return o.role==='OL'});
var lt=ol[0],lg=ol[1],ct=ol[2],rg=ol[3],rt=ol[4];
var elig=st.play.r;
var idx={};elig.forEach(function(r,i){idx[r.id]=i});
function add(id,x,y,role,assignment,man,zone,motion,offX,offY){d.push({id:id,x:x,y:y,role:role,assignment:assignment,man:man==null?null:man,zone:zone||{x:x,y:y-20},motion:motion||'zone',offX:offX||0,offY:offY||0,start:{x:x,y:y}})}
add('DE1',lt.x-2.5*FOOT,LOSY-PX,'DL','C-gap / contain',null,null,'rush');
add('DT1',(lg.x+ct.x)/2,LOSY-PX,'DL','A-gap',null,null,'rush');
add('DT2',(ct.x+rg.x)/2,LOSY-PX,'DL','A-gap',null,null,'rush');
add('DE2',rt.x+2.5*FOOT,LOSY-PX,'DL','C-gap / contain',null,null,'rush');
var leftElig=elig.filter(function(r){return r.x<QBX});
var rightElig=elig.filter(function(r){return r.x>=QBX});
var xP=leftElig[0]||rightElig[0];
var zP=rightElig[rightElig.length-1]||leftElig[leftElig.length-1]||xP;
var covered=[xP.id,zP.id];
var queue=elig.filter(function(r){return covered.indexOf(r.id)<0}).map(function(r){return r.id});
var lbD=cfg.lbDepth||4;
var willX=lg.x-2*FOOT,samX=rg.x+2*FOOT,mikeX=ct.x;
var willY=LOSY-lbD*PX,samY=LOSY-(cfg.fire?2:lbD)*PX,mikeY=LOSY-lbD*PX;
var willMan=null,samMan=null,mikeMan=null;
var willZone={x:willX,y:LOSY-(lbD+3)*PX},samZone={x:samX,y:LOSY-(lbD+3)*PX},mikeZone={x:mikeX,y:LOSY-(lbD+2)*PX};
var willAssign='flat / apex left',samAssign='flat / apex right',mikeAssign='hook / middle';
if(cfg.man){
willAssign='man / hook';samAssign='man / hook';mikeAssign='man / hook';
if(cfg.deep===2){willMan=queue[0]!=null?idx[queue[0]]:null;samMan=queue[1]!=null?idx[queue[1]]:null;mikeMan=queue[2]!=null?idx[queue[2]]:null}
else if(cfg.deep===1){samMan=queue[0]!=null?idx[queue[0]]:null;willMan=queue[1]!=null?idx[queue[1]]:null;mikeMan=queue[2]!=null?idx[queue[2]]:null}
else{willMan=queue[0]!=null?idx[queue[0]]:null;samMan=queue[1]!=null?idx[queue[1]]:null;mikeMan=queue[2]!=null?idx[queue[2]]:null}
}
if(cfg.fire){willAssign='hook / weak';samAssign='rush';mikeAssign='hook / middle'}
if(cfg.sim){willAssign='show pressure / drop';samAssign='show pressure / drop';mikeAssign='hook / middle'}
add('WILL',willX,willY,'LB',willAssign,willMan,willZone,willMan!=null?'man':'zone');
add('MIKE',mikeX,mikeY,'LB',mikeAssign,mikeMan,mikeZone,mikeMan!=null?'man':'zone');
add('SAM',samX,samY,'LB',samAssign,samMan,samZone,cfg.fire?'rush':(samMan!=null?'man':'zone'));
var cbDepth=cfg.cbDepth,slotDepth=cfg.slotDepth;
var manX=cfg.man?idx[xP.id]:null,manZ=cfg.man?idx[zP.id]:null;
var cb1Assign=cfg.man?'man '+(xP.id||'X'):(cfg.cloud?'cloud / flat':'outside deep / match');
var cb2Assign=cfg.man?'man '+(zP.id||'Z'):(cfg.cloud?'cloud / flat':'outside deep / match');
add('CB1',xP.x+(xP.x<QBX?-1:1)*FOOT,LOSY-cbDepth*PX,'CB',cb1Assign,manX,{x:xP.x,y:LOSY-(cbDepth+6)*PX},manX!=null?'man':'zone',(xP.x<QBX?-1:1)*10,-8);
add('CB2',zP.x+(zP.x<QBX?-1:1)*FOOT,LOSY-cbDepth*PX,'CB',cb2Assign,manZ,{x:zP.x,y:LOSY-(cbDepth+6)*PX},manZ!=null?'man':'zone',(zP.x<QBX?-1:1)*10,-8);
var sDepth=cfg.safetyDepth;
if(cfg.deep===2){
add('SL',clamp(QBX-12*FOOT,SL+20,SR-20),LOSY-sDepth*PX,'S',cfg.man?('man '+(queue[0]||'slot')):'deep half',cfg.man?(queue[0]!=null?idx[queue[0]]:null):null,{x:QBX-12*FOOT,y:LOSY-(sDepth+2)*PX},cfg.man?'man':'zone');
add('SR',clamp(QBX+12*FOOT,SL+20,SR-20),LOSY-sDepth*PX,'S',cfg.man?('man '+(queue[1]||'slot')):'deep half',cfg.man?(queue[1]!=null?idx[queue[1]]:null):null,{x:QBX+12*FOOT,y:LOSY-(sDepth+2)*PX},cfg.man?'man':'zone');
}else if(cfg.deep===1){
add('FS',QBX,LOSY-sDepth*PX,'S','middle third / post',null,{x:QBX,y:LOSY-(sDepth+2)*PX},'zone');
var strongSide=rightElig.length>=leftElig.length?1:-1;
var ssX=queue[0]!=null?elig[idx[queue[0]]].x:QBX+strongSide*8*FOOT;
add('SS',clamp(ssX,SL+20,SR-20),LOSY-slotDepth*PX,'S',cfg.man?('man '+(queue[0]||'slot')):'nickel / apex',cfg.man?(queue[0]!=null?idx[queue[0]]:null):null,{x:ssX,y:LOSY-(slotDepth+3)*PX},cfg.man?'man':'zone');
}else{
var hP=elig[idx[queue[0]]]||null,yP=elig[idx[queue[1]]]||null;
add('SL',hP?hP.x:QBX-10*FOOT,LOSY-slotDepth*PX,'S','man '+(hP?hP.id:'slot'),hP?idx[hP.id]:null,{x:hP?hP.x:QBX-10*FOOT,y:LOSY-(slotDepth+3)*PX},'man');
add('SR',yP?yP.x:QBX+10*FOOT,LOSY-slotDepth*PX,'S','man '+(yP?yP.id:'slot'),yP?idx[yP.id]:null,{x:yP?yP.x:QBX+10*FOOT,y:LOSY-(slotDepth+3)*PX},'man');
}
return d;
}
var origNext=nextPlay;
window.nextPlay=function(){
var source=document.getElementById('playbookSource').value,team=getTeamPlaybook();
if(source==='saved'&&team&&Array.isArray(team.plays)&&team.plays.length){origNext();st.offense=offenseFromRoutes(st.play.r);st.defense=buildDefense();return}
var concept=CONCEPTS[rnd(0,CONCEPTS.length-1)];
var use5=concept.wr4&&Math.random()<.5;
var formPool=FORMS.filter(function(f){return use5?f.wr4.length===4:f.wr3.length===3});
var form=formPool[rnd(0,formPool.length-1)];
var side=Math.random()<.5?'Left':'Right',dir=side==='Left'?-1:1;
var rbIdx=rnd(0,concept.rb.length-1);
var off=buildOffense(form,concept,use5,rbIdx,side);
st.offense=off;
st.play={name:concept.name+' — '+form.name+' — RB '+(form.rb?side:'none'),r:off.filter(function(p){return p.eligible}).map(function(p){return{n:p.route.n,x:p.x,y:p.y,p:p.route.p,c:p.route.c,oob:p.route.oob,id:p.id,role:p.role}})};
st.pv=true;
st.cvg=ALLCOV[rnd(0,ALLCOV.length-1)];
var level=G.level,r=Math.random();
if(r<.35-.025*(level-1))st.extra=0;else if(r<.70-.05*(level-1))st.extra=1;else if(r<.90-.06*(level-1))st.extra=2;else st.extra=3;
if(st.cvg==='Fire Zone')st.extra=Math.min(1,st.extra);
if(st.cvg==='Simulated Blitz')st.extra=0;
var none=Math.random()<.25,tries=0,has;
while(true){st.cov=[];for(var j=0;j<st.play.r.length;j++)st.cov.push(Math.random()>=openP(j));has=st.cov.indexOf(false)>=0;if(has!==none)break;if(++tries>200){if(none)st.cov=st.play.r.map(function(){return true});else st.cov[rnd(0,st.play.r.length-1)]=false;has=!none;break}}
st.ans=has?st.cov.indexOf(false):st.play.r.length;
st.dur=3000;var base=st.extra===0?3150:st.extra===1?2600:st.extra===2?2400:2200;st.press=Math.max(1500,base+(10-G.level)*150);st.bx=[230,320,410].sort(function(){return Math.random()-.5});
st.defense=buildDefense();
};
window.openP=function(i){
if(st._coveragePrepared!==st.play){
st._coveragePrepared=st.play;
var sel=document.getElementById('coverageChoice');
if(sel&&COV[sel.value])st.cvg=sel.value;
if(st.cvg==='Fire Zone')st.extra=Math.min(1,st.extra);
if(st.cvg==='Simulated Blitz')st.extra=0;
st.defense=buildDefense();
}
if(st.play.r[i].c==='BLOCK')return 0;
return clamp(PROB[st.cvg][st.play.r[i].c]+.04*st.extra-(G.level-1)*.02,0,1);
};
window.align=function(blitz){var d=buildDefense();st.defense=d;return{cd:[],sf:[],lb:[]}};
function drawCircle(x,y,r,fill,stroke,label,labelColor){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1.5;g.stroke()}if(label!=null){g.fillStyle=labelColor||'#fff';g.font='bold 9px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(label,x,y)}}
function drawLineAndQB(){st.offense.filter(function(p){return p.role==='OL'||p.role==='QB'}).forEach(function(p){if(p.role==='OL')drawCircle(p.x,p.y,7,'#2563EB','#fff',p.id,'#fff');else drawCircle(p.x,p.y,10,'#F59E0B','#fff','QB','#0A1628')})}
function drawEligibles(p,scan){st.play.r.forEach(function(r,i){var pos=p>0?rpos(i,p):{x:r.x,y:r.y};drawCircle(pos.x,pos.y,10,scan===i?'#F59E0B':'#fff','#0A1628',String(i+1),'#0A1628')})}
function drawRoutes(){g.save();g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=2;g.setLineDash([6,6]);for(var i=0;i<st.play.r.length;i++){var a=pts(i);g.beginPath();g.moveTo(a[0][0],a[0][1]);for(var k=1;k<a.length;k++)g.lineTo(a[k][0],a[k][1]);g.stroke()}g.restore()}
function defPos(d,p,el){if(d.motion==='rush'){var t=clamp(el/st.press,0,1);return{x:lerp(d.start.x,QBX,t),y:lerp(d.start.y,QBY-10,t)}}if(d.motion==='man'&&d.man!=null){var r=rpos(d.man,p);var t=clamp(p/.3,0,1);return{x:lerp(d.start.x,r.x+d.offX,t),y:lerp(d.start.y,r.y+d.offY,t)}}var t2=clamp((p-.2)/.5,0,1);return{x:lerp(d.start.x,d.zone.x,t2),y:lerp(d.start.y,d.zone.y,t2)}}
function drawDefense(p,el){st.defense.forEach(function(d){var pos=defPos(d,p,el);drawCircle(pos.x,pos.y,8,'#DC2626','#fff',null,null)})}
window.draw=function(){
var GLy=LOSY-G.ball*PX;
g.clearRect(0,0,W,H);g.fillStyle='#1a5c2e';g.fillRect(0,0,W,H);
if(GLy>0){g.fillStyle='#14432a';g.fillRect(0,Math.max(0,GLy-60),W,Math.min(60,GLy))}
for(var n=0;n<=100;n+=5){var y=GLy+n*PX;if(y<0||y>H)continue;g.strokeStyle=n===0?'#fff':'rgba(255,255,255,.22)';g.lineWidth=n===0?4:1;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();if(n%10===0&&n>0&&n<100){g.fillStyle='rgba(255,255,255,.4)';g.font='bold 13px sans-serif';g.textAlign='left';g.fillText(String(n>50?100-n:n),14,y-3)}}
g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(SL,0);g.lineTo(SL,H);g.moveTo(SR,0);g.lineTo(SR,H);g.stroke();
if(G.toGo<G.ball){var fy=LOSY-G.toGo*PX;g.strokeStyle='#FACC15';g.lineWidth=3;g.beginPath();g.moveTo(0,fy);g.lineTo(W,fy);g.stroke()}
g.strokeStyle='#60A5FA';g.lineWidth=3;g.beginPath();g.moveTo(0,LOSY);g.lineTo(W,LOSY);g.stroke();
var el=0,p=0,scan=0;
if(phase==='pre'&&st.pv){drawLineAndQB();drawEligibles(0,-1);drawRoutes();drawDefense(0,0);g.fillStyle='#fff';g.font='bold 13px sans-serif';g.textAlign='left';g.fillText('Play call: '+st.play.name+' | Read the defense. Coverage is not labeled.',10,H-12)}
if(phase==='read'){el=Date.now()-st.t0;p=clamp(el/(st.dur*.75),0,1);scan=Math.min(st.play.r.length-1,Math.floor((el/(st.dur*.5))*st.play.r.length));drawRoutes();drawLineAndQB();drawEligibles(p,scan);drawDefense(p,el);g.fillStyle='#fff';g.font='bold 13px sans-serif';g.textAlign='left';g.fillText(st.play.name,10,H-12)}
if(phase==='yac'&&st.y){var Y=st.y;Y.defs.forEach(function(d){drawCircle(d.x,d.y,8,'#DC2626','#fff',null,null)});drawCircle(Y.x,Y.y,10,'#fff','#0A1628','WR','#0A1628')}
if(phase!=='yac'){drawCircle(QBX,QBY,10,'#F59E0B','#fff','QB','#0A1628')}
};
})();
