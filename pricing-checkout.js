(function(){
'use strict';
// The Stripe customer portal login link (Stripe dashboard: Settings > Billing > Customer portal).
// Players sign in there with their email to switch or cancel their package.
var PORTAL_LINK='https://billing.stripe.com/p/login/test_5kQbJ3ajUdYX78yf8g7EQ00';
function inject(){
var pricing=document.getElementById('pricing');
if(!pricing||document.getElementById('checkoutCard'))return;
var plans={starter:{name:'Rookie',price:20,link:'https://buy.stripe.com/test_fZu5kFgIi1cbcsS5xG7EQ03'},pro:{name:'Varsity',price:30,link:'https://buy.stripe.com/test_eVq9AV3Vw1cbeB01hq7EQ04'},team:{name:'All-Pro',price:75,link:'https://buy.stripe.com/test_8x214p8bM2gfakK1hq7EQ05'}};
var card=document.createElement('div');
card.id='checkoutCard';card.className='card';card.style.scrollMarginTop='120px';
card.innerHTML='<h2>Start your subscription</h2><p>Select your plan below or use a Choose button above. Hardware offers remain visible for reference, but cannot be purchased yet.</p><div class="field"><label for="checkoutPlan">Choose your plan</label><select id="checkoutPlan"><option value="">Select a plan</option><option value="starter">Rookie — $20/month</option><option value="pro">Varsity — $30/month</option><option value="team">All-Pro — $75/month</option></select></div><div id="checkoutDetails"></div><div class="field"><label for="checkoutBilling">Billing period</label><select id="checkoutBilling"><option value="monthly">Monthly — software only</option><option value="annual" disabled>Annual software pricing — not configured</option></select></div><div class="field"><label for="checkoutHeadset">VR headset rental — Coming soon</label><select id="checkoutHeadset" disabled><option>Coming soon — unavailable for purchase</option></select></div><div class="field"><label for="checkoutVest">Haptic vest — Coming soon</label><select id="checkoutVest" disabled><option>Coming soon — unavailable for purchase</option></select></div><div id="checkoutTotal" class="price-total" aria-live="polite"></div><p id="checkoutStatus" role="status"></p><button type="button" class="btn primary" id="checkoutButton" disabled>Continue to secure checkout</button>';
pricing.appendChild(card);
var plan=card.querySelector('#checkoutPlan'),details=card.querySelector('#checkoutDetails'),total=card.querySelector('#checkoutTotal'),button=card.querySelector('#checkoutButton'),status=card.querySelector('#checkoutStatus');
var sources={};
pricing.querySelectorAll('.price-card').forEach(function(source){
var tier=source.querySelector('.price-tier');
var name=tier?tier.textContent.trim().toLowerCase():'';
var key=name==='rookie'?'starter':name==='varsity'?'pro':name==='all-pro'?'team':null;
if(!key)return;
sources[key]=source;
var choose=source.querySelector('button');
if(choose)choose.addEventListener('click',function(event){event.preventDefault();plan.value=key;update();card.scrollIntoView({behavior:'smooth',block:'start'});plan.focus({preventScroll:true});});
});
function update(){
details.replaceChildren();
var selected=plans[plan.value];
if(!selected){total.textContent='Select a plan to see your price.';status.textContent='Choose a software plan to continue to Stripe test checkout.';button.disabled=true;return;}
var source=sources[plan.value];
if(source){
var heading=document.createElement('h3');heading.textContent=selected.name+' — existing plan details';details.appendChild(heading);
var features=source.querySelector('.price-features');if(features)details.appendChild(features.cloneNode(true));
var offers=source.querySelector('.price-total');
if(offers){var label=document.createElement('p');label.textContent='Pricing information from your plan card (reference only; hardware is coming soon):';details.appendChild(label);details.appendChild(offers.cloneNode(true));}
}
total.textContent=selected.name+' — $'+selected.price+'/month, software only. No headset or vest included.';
button.disabled=!selected.link;
status.textContent=selected.link?'Test mode: you will see the Stripe test checkout. No real payment is taken.':'Checkout is not connected yet. A Stripe Payment Link is required before payments can be accepted.';
}
plan.addEventListener('change',update);
// The checkout carries the player's account id, so the webhook (api/stripe-webhook.js) can put the
// package on the right account. A player who already has a package changes or cancels it in the
// Stripe customer portal instead of starting a second subscription.
button.addEventListener('click',function(){
var selected=plans[plan.value];if(!selected||!selected.link)return;
var account=window.qbAccount;
if(!account||!account.uid){status.textContent='Sign in before choosing a package.';return;}
if(account.plan&&account.plan!=='none'){
status.textContent='You already have a package. To change or cancel it, use Manage subscription.';
if(PORTAL_LINK)window.location.assign(PORTAL_LINK);
return;
}
try{
var url=new URL(selected.link);
if(url.protocol!=='https:'||url.hostname!=='buy.stripe.com')throw new Error('bad link');
url.searchParams.set('client_reference_id',account.uid);
if(account.email)url.searchParams.set('prefilled_email',account.email);
window.location.assign(url.href);
}catch(error){status.textContent='The checkout link is invalid.';}
});
// After checkout, show the "Manage subscription" link to players who have a package.
function showManage(){
var account=window.qbAccount;
var manage=card.querySelector('#manageSubscription');
var paying=account&&account.plan&&account.plan!=='none';
if(!paying){if(manage)manage.remove();return;}
if(manage)return;
manage=document.createElement('p');manage.id='manageSubscription';
if(PORTAL_LINK){var a=document.createElement('a');a.href=PORTAL_LINK;a.textContent='Manage subscription (change or cancel your package)';a.rel='noopener';manage.appendChild(a);}
else manage.textContent='To change or cancel your package, contact support.';
card.insertBefore(manage,button);
}
window.addEventListener('qbplan',showManage);
showManage();
update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
})();