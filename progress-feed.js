(function(){
var KEYS=[['qbsense_readthrow_results','Read & Throw'],['qbsense_progression_results','Progression Reads'],['qbsense_blitz_results','Blitz Recognition'],['qbsense_redzone_results','Red-Zone Decisions'],['qbsense_twominute_results','Two-Minute Drill'],['qbsense_game_results','Game Situations']];
function load(){
  var me=localStorage.getItem('qbsense_user')||'guest',all=[];
  KEYS.forEach(function(k){
    try{
      JSON.parse(localStorage.getItem(k[0])||'[]').forEach(function(r){
        if((r.email||'guest')===me){
          all.push({drill:k[1],date:r.date,level:r.level||1,acc:Number(r.accuracy)||0,time:r.avgTime!=null?Number(r.avgTime):null,pr:r.pressureResponse!=null?Number(r.pressureResponse):(r.pressureAtt?Number(r.pressureComp)/Number(r.pressureAtt)*100:null),concept:r.concept||'',cov:r.coverage||'',result:r.result||'',tot:Number(r.total)||0,pa:Number(r.passAtt)||0,pc:Number(r.passComp)||0,py:Number(r.passYds)||0,pt:Number(r.passTd)||0,pi:Number(r.passInt)||0,forced:Number(r.forced)||0,pAtt:Number(r.pressureAtt)||0,pComp:Number(r.pressureComp)||0});
        }
      });
    }catch(e){}
  });
  all.sort(function(a,b){return new Date(a.date)-new Date(b.date)});
  return all;
}
function avg(a){return a.length?a.reduce(function(x,y){return x+y},0)/a.length:0}
function rate(a,c,y,t,i){
  if(!a)return 0;
  function k(v){return Math.max(0,Math.min(2.375,v))}
  return (k((c/a-0.3)*5)+k((y/a-3)*0.25)+k(t/a*20)+k(2.375-i/a*25))/6*100;
}
function mk(tag,txt,attrs){
  var e=document.createElement(tag);
  if(txt!=null)e.textContent=txt;
  if(attrs)for(var k in attrs)e.setAttribute(k,attrs[k]);
  return e;
}
function coachFocus(list){
  var gs=list.filter(function(a){return a.drill==='Game Situations'}).slice(-10);
  if(!gs.length)return '';
  var acc=avg(gs.map(function(a){return a.acc}));
  var ts=gs.filter(function(a){return a.time!=null}).map(function(a){return a.time});
  var t=ts.length?avg(ts):0;
  var f=gs.reduce(function(s,a){return s+a.forced},0),tot=gs.reduce(function(s,a){return s+a.tot},0);
  var fr=tot?f/tot:0;
  var pA=gs.reduce(function(s,a){return s+a.pAtt},0),pC=gs.reduce(function(s,a){return s+a.pComp},0);
  var pr=pA?pC/pA:1;
  var worst='accuracy',w=1-acc/100;
  var dt=t?t/2.0:0;if(dt-1>w){worst='decision time';w=dt-1}
  if(fr>w){worst='forced throws';w=fr}
  if(pA&&(1-pr)>w){worst='pressure response';w=1-pr}
  var tips={accuracy:'Find the first open receiver before the rush gets home.',decision:'Get the ball out faster — read progression, then throw.',forced:'Do not force into coverage. Take the checkdown or throw it away.',pressure:'Under pressure, get to the quick outlet sooner.'};
  return tips[worst];
}
function homeRender(){
  var cards=document.querySelectorAll('#home .stat-card');
  if(!cards.length)return;
  var all=load(),recent=all.slice(-10);
  var prs=recent.filter(function(a){return a.pr!=null}).map(function(a){return a.pr});
  var prA=avg(prs);
  var ts=recent.filter(function(a){return a.time!=null}).map(function(a){return a.time});
  var tA=avg(ts);
  var weekAgo=Date.now()-7*864e5;
  var reps=all.filter(function(a){return new Date(a.date).getTime()>=weekAgo}).reduce(function(s,a){return s+a.tot},0);
  var ps=all.filter(function(a){return a.pa>0}).slice(-10),rt=null;
  if(ps.length){
    var A=0,C=0,Y=0,T=0,I=0;
    ps.forEach(function(a){A+=a.pa;C+=a.pc;Y+=a.py;T+=a.pt;I+=a.pi});
    rt=rate(A,C,Y,T,I);
  }
  cards.forEach(function(c){
    var lb=c.querySelector('.label'),v=c.querySelector('.stat'),b=c.querySelector('.bar span');
    if(!lb||!v)return;
    var name=lb.textContent.trim(),txt='--',w=0;
    if(name==='QB Rating'){
      c.title='NFL passer rating (0 to 158.3) from your passing stats: completions, yards, touchdowns and interceptions per attempt.';
      if(rt!==null){txt=rt.toFixed(1);w=Math.round(rt/158.3*100)}
    }
    else if(name==='Decision Time'){if(ts.length){txt=tA.toFixed(1)+'s';w=Math.max(5,Math.min(100,Math.round(100-(tA-1)*25)))}}
    else if(name==='Pressure Response'){if(prs.length){txt=Math.round(prA)+'%';w=Math.round(prA)}}
    else if(name==='Reps This Week'){txt=String(reps);w=Math.min(100,Math.round(reps/70*100))}
    else return;
    v.textContent=txt;
    if(b)b.style.width=w+'%';
  });
}
function chart(list){
  var NS='http://www.w3.org/2000/svg',W=600,H=170,pad=26;
  var svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('style','width:100%;height:auto;display:block');
  var pts=[];
  list.forEach(function(a,i){
    var x=pad+i*(W-2*pad)/Math.max(1,list.length-1);
    var y=H-pad-(a.acc/100)*(H-2*pad);
    pts.push([x,y]);
  });
  [0,50,100].forEach(function(v){
    var y=H-pad-(v/100)*(H-2*pad);
    var ln=document.createElementNS(NS,'line');
    ln.setAttribute('x1',pad);ln.setAttribute('x2',W-pad);ln.setAttribute('y1',y);ln.setAttribute('y2',y);ln.setAttribute('stroke','#E2E8F0');
    svg.appendChild(ln);
    var tx=document.createElementNS(NS,'text');
    tx.setAttribute('x',2);tx.setAttribute('y',y+4);tx.setAttribute('font-size','10');tx.setAttribute('fill','#5B6B7C');tx.textContent=v+'%';
    svg.appendChild(tx);
  });
  var pl=document.createElementNS(NS,'polyline');
  pl.setAttribute('points',pts.map(function(p){return p[0]+','+p[1]}).join(' '));
  pl.setAttribute('fill','none');
  pl.setAttribute('stroke','#14532D');pl.setAttribute('stroke-width','3');
  svg.appendChild(pl);
  pts.forEach(function(p){
    var c=document.createElementNS(NS,'circle');
    c.setAttribute('cx',p[0]);c.setAttribute('cy',p[1]);c.setAttribute('r',4);c.setAttribute('fill','#14532D');
    svg.appendChild(c);
  });
  return svg;
}
function render(){
  homeRender();
  var sec=document.getElementById('progress');
  if(!sec)return;
  var old=document.getElementById('progressFeed');
  if(old)old.remove();
  var all=load();
  if(!all.length)return;
  var n=all.length,first=all.slice(0,Math.min(5,n)),last=all.slice(-Math.min(5,n));
  var overall=Math.round(avg(all.map(function(a){return a.acc})));
  var diff=Math.round(avg(last.map(function(a){return a.acc}))-avg(first.map(function(a){return a.acc})));
  var cards=sec.querySelectorAll('.card');
  var p=cards[0]&&cards[0].querySelector('p');
  if(p){
    var t=n+' session'+(n===1?'':'s')+' saved. Average accuracy '+overall+'%.';
    if(n>=2)t+=' Your latest '+last.length+' sessions are '+(diff>=0?'up ':'down ')+Math.abs(diff)+' points compared with your first '+first.length+'.';
    p.textContent=t;
  }
  var weekAgo=Date.now()-7*864e5;
  var wk=all.filter(function(a){return new Date(a.date).getTime()>=weekAgo}).length;
  var prs=all.filter(function(a){return a.pr!=null}).map(function(a){return a.pr});
  var prAvg=Math.round(avg(prs));
  if(cards[1]){
    var labs=cards[1].querySelectorAll('.label'),bars=cards[1].querySelectorAll('.bar span');
    var vals=[['Sessions this week: '+wk,Math.min(100,wk*10)],['Pressure response: '+(prs.length?prAvg+'%':'no data yet'),prAvg],['Average accuracy: '+overall+'%',overall]];
    for(var i=0;i<3;i++){
      if(labs[i])labs[i].textContent=vals[i][0];
      if(bars[i])bars[i].style.width=vals[i][1]+'%';
    }
  }
  var card=mk('div',null,{'class':'card',id:'progressFeed'});
  card.appendChild(mk('h2','Drill history'));
  var perDrill={};
  all.forEach(function(a){(perDrill[a.drill]=perDrill[a.drill]||[]).push(a)});
  var parts=Object.keys(perDrill).map(function(d){
    var l=perDrill[d];
    return d+': '+l.length+' session'+(l.length===1?'':'s')+', average '+Math.round(avg(l.map(function(a){return a.acc})))+'%, best '+Math.max.apply(null,l.map(function(a){return a.acc}))+'%';
  });
  card.appendChild(mk('p',parts.join('. ')+'.'));
  var cf=coachFocus(all);
  if(cf){card.appendChild(mk('div','Coaching focus',{'class':'label','style':'margin-top:10px'}));card.appendChild(mk('p',cf));}
  card.appendChild(mk('div','Accuracy over your last '+Math.min(30,n)+' sessions',{'class':'label'}));
  card.appendChild(chart(all.slice(-30)));
  card.appendChild(mk('div','Recent sessions',{'class':'label','style':'margin-top:14px'}));
  var tbl=mk('table',null,{'style':'width:100%;border-collapse:collapse;font-size:13px;margin-top:6px'});
  var hr=mk('tr');
  ['Date','Drill','Details','Accuracy','Avg time'].forEach(function(h){hr.appendChild(mk('th',h,{'style':'text-align:left;padding:6px;border-bottom:1px solid #E2E8F0;color:#5B6B7C'}))});
  tbl.appendChild(hr);
  all.slice(-10).reverse().forEach(function(a){
    var tr=mk('tr');
    var det='Level '+a.level+(a.concept?' | '+a.concept:'')+(a.cov?' | '+a.cov:'')+(a.result?' | '+a.result:'')+(a.forced?' | '+a.forced+' forced':'')+(a.pAtt?' | '+a.pComp+'/'+a.pAtt+' under pressure':'');
    [new Date(a.date).toLocaleDateString(),a.drill,det,a.acc+'%',a.time!=null?a.time.toFixed(1)+'s':'-'].forEach(function(v){tr.appendChild(mk('td',v,{'style':'padding:6px;border-bottom:1px solid #F1F5F9'}))});
    tbl.appendChild(tr);
  });
  card.appendChild(tbl);
  sec.appendChild(card);
}
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('[data-page],[data-goto]'))setTimeout(render,0);
});
window.addEventListener('storage',render);
render();
})();