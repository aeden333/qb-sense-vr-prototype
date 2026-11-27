(function(){
function load(){try{return JSON.parse(localStorage.getItem('qbsense_clips')||'[]')}catch(e){return[]}}
function save(a){localStorage.setItem('qbsense_clips',JSON.stringify(a))}
function me(){return localStorage.getItem('qbsense_user')||'guest'}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
// Only http(s) links open; anything else (such as javascript:) is refused.
function safeUrl(u){try{var x=new URL(u,location.href);return x.protocol==='https:'||x.protocol==='http:'?x.href:''}catch(e){return ''}}
function sameClip(a,b){return (a.email||'guest')===(b.email||'guest')&&a.date===b.date&&a.url===b.url}
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
clips.forEach(function(c,i){var link=safeUrl(c.url);html+='<div class="playbook-item"><div><b>'+esc(c.drill||'Clip')+'</b>'+(c.coverage?' — '+esc(c.coverage):'')+(c.concept?' — '+esc(c.concept):'')+'<br><small>'+esc(c.result||'')+(c.note?' — '+esc(c.note):'')+'</small></div><div>'+(link?'<a class="btn ghost" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Open</a> ':'')+'<button class="btn ghost" data-del="'+i+'">Delete</button></div></div>'});
html+='</div>';
card.innerHTML=html;
var add=document.getElementById('addClip');
if(add)add.onclick=function(){
var url=safeUrl(document.getElementById('clipUrl').value.trim());if(!url)return;
var rec={email:me(),date:new Date().toISOString(),url:url,drill:document.getElementById('clipDrill').value,coverage:document.getElementById('clipCoverage').value,concept:document.getElementById('clipConcept').value,result:document.getElementById('clipResult').value,note:document.getElementById('clipNote').value};
var all=load();all.unshift(rec);save(all);render();
};
// data-del is the clip's place in this player's list, not in the stored list, so delete by identity.
card.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){var clip=clips[Number(b.getAttribute('data-del'))];if(!clip)return;var all=load(),at=-1;for(var k=0;k<all.length;k++){if(sameClip(all[k],clip)){at=k;break}}if(at>=0){all.splice(at,1);save(all)}render()}});
}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-page="results"]'))setTimeout(render,0)});
window.addEventListener('storage',render);
render();
})();
