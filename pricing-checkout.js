(function(){
'use strict';
function inject(){
var pricing=document.getElementById('pricing');
if(!pricing||document.getElementById('checkoutCard'))return;
var plans={starter:{name:'Starter',price:19,link:''},pro:{name:'QB Pro',price:39,link:''},team:{name:'Coach & Team',price:99,link:''}};
var card=document.createElement('div');
card.id='checkoutCard';card.className='card';card.style.scrollMarginTop='120px';
card.innerHTML='<h2>Start your subscription</h2><p>Select your plan below or use a Choose button above. Hardware offers remain visible for reference, but cannot be purchased yet.</p><div class="field"><label for="checkoutPlan">Choose your plan</label><select id="checkoutPlan"><option value="">Select a plan</option><option value="starter">Starter — $19/month</option><option value="pro">QB Pro — $39/month</option><option value="team">Coach &amp; Team — $99/month</option></select></div><div id="checkoutDetails"></div><div class="field"><label for="checkoutBilling">Billing period</label><select id="checkoutBilling"><option value="monthly">Monthly — software only</option><option value="annual" disabled>Annual software pricing — not configured</option></select></div><div class="field"><label for="checkoutHeadset">VR headset rental — Coming soon</label><select id="checkoutHeadset" disabled><option>Coming soon — unavailable for purchase</option></select></div><div class="field"><label for="checkoutVest">Haptic vest — Coming soon</label><select id="checkoutVest" disabled><option>Coming soon — unavailable for purchase</option></select></div><div id="checkoutTotal" class="price-total" aria-live="polite"></div><p id="checkoutStatus" role="status"></p><button type="button" class="btn primary" id="checkoutButton" disabled>Continue to secure checkout</button>';
pricing.appendChild(card);
var plan=card.querySelector('#checkoutPlan'),details=card.querySelector('#checkoutDetails'),total=card.querySelector('#checkoutTotal'),button=card.querySelector('#checkoutButton'),status=card.querySelector('#checkoutStatus');
var sources={};
pricing.querySelectorAll('.price-card').forEach(function(source){
var tier=source.querySelector('.price-tier');
var name=tier?tier.textContent.trim().toLowerCase():'';
var key=name==='starter'?'starter':name==='qb pro'?'pro':name==='coach & team'?'team':null;
if(!key)return;
sources[key]=source;
var choose=source.querySelector('button');
if(choose)choose.addEventListener('click',function(event){event.preventDefault();plan.value=key;update();card.scrollIntoView({behavior:'smooth',block:'start'});plan.focus({preventScroll:true});});
});
function update(){
details.replaceChildren();
var selected=plans[plan.value];
if(!selected){total.textContent='Select a plan to see your price.';status.textContent='Stripe checkout links have not been configured.';button.disabled=true;return;}
var source=sources[plan.value];
if(source){
var heading=document.createElement('h3');heading.textContent=selected.name+' — existing plan details';details.appendChild(heading);
var features=source.querySelector('.price-features');if(features)details.appendChild(features.cloneNode(true));
var offers=source.querySelector('.price-total');
if(offers){var label=document.createElement('p');label.textContent='Pricing information from your plan card (reference only; hardware is coming soon):';details.appendChild(label);details.appendChild(offers.cloneNode(true));}
}
total.textContent=selected.name+' — $'+selected.price+'/month, software only. No headset or vest included.';
button.disabled=!selected.link;
status.textContent=selected.link?'You will continue to Stripe to review and pay.':'Checkout is not connected yet. A Stripe Payment Link is required before payments can be accepted.';
}
plan.addEventListener('change',update);
button.addEventListener('click',function(){var selected=plans[plan.value];if(!selected||!selected.link)return;try{var url=new URL(selected.link);if(url.protocol==='https:'&&url.hostname==='buy.stripe.com')window.location.assign(url.href);}catch(error){status.textContent='The checkout link is invalid.';}});
update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();