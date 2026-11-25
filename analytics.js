(function () {
  'use strict';
  if (window.qbSenseAnalyticsLoaded) return;
  window.qbSenseAnalyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var id = 'G-5CQ3TV52V4';
  window.gtag('js', new Date());
  window.gtag('config', id, {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false});
  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(tag);
  function event(name, params) {
    window.gtag('event', name, Object.assign({send_to: id}, params));
  }
  event('page_view', {page_location: location.origin + location.pathname, page_title: document.title, page_referrer: document.referrer ? new URL(document.referrer).origin : ''});
  document.addEventListener('click', function (e) {
    if (!(e.target instanceof Element)) return;
    var tab = e.target.closest('[data-page], [data-goto]');
    if (tab) {
      var name = tab.dataset.page || tab.dataset.goto;
      if (/^(home|drills|live|coach|players|playbook|results|progress|pricing)$/.test(name)) event('tab_view', {tab_name: name});
    }
    var link = e.target.closest('a[href]');
    if (link) {
      var url = new URL(link.href, location.href);
      var drill = url.pathname.split('/').pop();
      if (url.origin === location.origin && /^(blitz-sim|pocket-pressure-3d|redzone-sim|twominute-sim|twominute-fix|game-scenarios|progression-sim)\.html$/.test(drill)) event('drill_open', {drill_name: drill.replace('.html', '')});
    }
    var checkout = e.target.closest('#checkoutButton');
    if (checkout && !checkout.disabled) {
      var select = document.getElementById('checkoutPlan');
      var plan = select ? select.value : '';
      if (/^(starter|pro|team)$/.test(plan)) event('checkout_click', {plan_name: plan, checkout_environment: 'test', transport_type: 'beacon'});
    }
  }, true);
})();
/* Load the local replay adapter from this existing deferred page bootstrap. */
(function(){
if(!/(?:twominute-sim|game-scenarios)\.html$/.test(location.pathname))return;
var start=document.getElementById('start'),disabled=start?start.disabled:false;
if(start)start.disabled=true;
var script=document.createElement('script');script.src='saved-route-replay.js';
script.onload=function(){if(start)start.disabled=disabled};
script.onerror=function(){var note=document.createElement('p');note.setAttribute('role','alert');note.textContent='Saved-route replay could not load. Reload before starting the drill.';var setup=document.getElementById('setup');if(setup)setup.appendChild(note)};
document.head.appendChild(script);
})();
