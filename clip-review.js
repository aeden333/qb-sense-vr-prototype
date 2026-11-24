(function(){
function load(){try{return JSON.parse(localStorage.getItem('qbsense_clips')||'[]')}catch(e){return[]}}
function save(a){localStorage.setItem('qbsense_clips',JSON.stringify(a))}
function me(){return localStorage.getItem('qbsense_user')||'guest'}
function target(){
var sec=document.getElementById('results');if(!sec)return null;
var main=document.getElementById('resultsMain')||sec;
var stats=main.querySelector('.stats');
if(stats&&stats.nextSibling)return{parent:main,before:stats.nextSibling};
var trend=document.getElementById('qbRatingTrend');
if(trend)return{parent:main,before:trend};
return{parent:main,before:null};
}
function render(){
var place=target();if(!place)return;
var card=document.getElementById('clipCard');
if(!card){card=document.createElement('div');card.id='clipCard';card.className='card';place.parent.insertBefore(card,place.before)}
var clips=load().filter(function(c){return (c.email||'guest')===me()});
var html='<h2>Clip Review</h2>';
html+='<div class="field"><label>Video link (YouTube, Hudl, Google Drive)</label><input id="clipUrl" placeholder="https://..."></div>';
html+='<div class="field"><label>Drill</label><input id="clipDrill" placeholder="Example: Game Situations"></div>';
html+='<div class="field"><label>Coverage</label><input id="clipCoverage" placeholder="Example: Cover 2 Man"></div>';
html+='<div class="field"><label>Concept</label><input id="clipConcept" placeholder="Example: Mesh"></div>';
html+='<div class="field"><label>Result tag</label><select id="clipResult"><option>Good rep</option><option>Needs work</option><option>Great read</option><option>Forced throw</option></select></div>';
html+='<div class="field"><label>Note</label><input id="clipNote" placeholder="What did you learn?"></div>';
html+='<button class="btn primary" id="addClip">Add clip</button>';
html+='<div style="margin-top:14px">';
if(!clips.length){html+='<small>No clips yet. Add your first video link above.</small>'}
clips.forEach(function(c,i){html+='<div class="playbook-item"><div><b>'+(c.drill||'Clip')+'</b>'+(c.coverage?' — '+c.coverage:'')+(c.concept?' — '+c.concept:'')+'<br><small>'+(c.result||'')+(c.note?' — '+c.note:'')+'</small></div><div><a class="btn ghost" href="'+c.url+'" target="_blank">Open</a> <button class="btn ghost" data-del="'+i+'">Delete</button></div></div>'});
html+='</div>';
card.innerHTML=html;
var add=document.getElementById('addClip');
if(add)add.onclick=function(){
var url=document.getElementById('clipUrl').value.trim();if(!url)return;
var rec={email:me(),date:new Date().toISOString(),url:url,drill:document.getElementById('clipDrill').value,coverage:document.getElementById('clipCoverage').value,concept:document.getElementById('clipConcept').value,result:document.getElementById('clipResult').value,note:document.getElementById('clipNote').value};
var all=load();all.unshift(rec);save(all);render();
};
card.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){var all=load();all.splice(Number(b.getAttribute('data-del')),1);save(all);render()}});
}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-page="results"]'))setTimeout(render,0)});
window.addEventListener('storage',render);
render();
})();
