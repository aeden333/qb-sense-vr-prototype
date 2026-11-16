(function(){
if(document.querySelector('.qb-back'))return;
var css='.qb-back{position:sticky;top:10px;z-index:50;display:flex;width:fit-content;align-items:center;gap:10px;margin:0 0 14px;padding:6px 18px 6px 6px;background:#fff;color:#0A1628;border:1px solid #E2E8F0;border-radius:999px;box-shadow:0 2px 8px rgba(10,22,40,.12);font:800 13px/1 system-ui,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;transition:background .15s,color .15s,border-color .15s,transform .15s}'+
'.qb-back:hover{background:#14532D;color:#fff;border-color:#14532D;transform:translateX(-2px)}'+
'.qb-back:focus-visible{outline:3px solid #F59E0B;outline-offset:2px}'+
'.qb-back-ic{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#14532D;color:#fff;transition:background .15s,color .15s}'+
'.qb-back:hover .qb-back-ic{background:#fff;color:#14532D}';
var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
document.querySelectorAll('header a[href*="index.html"]').forEach(function(x){x.style.display='none'});
var a=document.createElement('a');
a.className='qb-back';
a.href='index.html#drills';
a.setAttribute('aria-label','Back to the drill menu');
a.innerHTML='<span class="qb-back-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></span><span>Back to drills</span>';
var m=document.querySelector('main');
if(m)m.insertBefore(a,m.firstChild);else document.body.insertBefore(a,document.body.firstChild);
})();
