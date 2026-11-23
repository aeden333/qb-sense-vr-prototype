(function(){
window.renderRepReview=function(containerId,reps){
  var c=document.getElementById(containerId);
  if(!c||!Array.isArray(reps)||!reps.length)return;
  var card=document.createElement('div');
  card.className='card';card.id='repReview';
  var h=document.createElement('h2');h.textContent='Rep-by-rep review';card.appendChild(h);
  reps.forEach(function(r,i){
    var row=document.createElement('div');row.className='rep-row';
    var line=document.createElement('div');
    line.innerHTML='<b>Snap '+(i+1)+'</b> — '+escapeHtml(r.concept||'—')+' | Coverage: '+escapeHtml(r.coverage||'—')+' | Correct read: '+escapeHtml(r.correctRead||'—')+' | QB choice: '+escapeHtml(r.qbChoice||'—')+' | Decision time: '+(r.decisionTime!=null?r.decisionTime+'s':'—')+' | Result: '+escapeHtml(r.result||'—');
    row.appendChild(line);
    card.appendChild(row);
  });
  c.appendChild(card);
};
function escapeHtml(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
window.getRepLog=function(drill){
  try{var all=JSON.parse(localStorage.getItem('qbsense_rep_log')||'[]');return all.filter(function(r){return r.drill===drill})}catch(e){return[]}
};
window.logRep=function(rep){
  try{var all=JSON.parse(localStorage.getItem('qbsense_rep_log')||'[]');all.push(rep);localStorage.setItem('qbsense_rep_log',JSON.stringify(all))}catch(e){}
};
})();