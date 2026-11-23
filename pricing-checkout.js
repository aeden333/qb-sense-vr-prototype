(function(){
function inject(){
var pricing=document.getElementById('pricing');if(!pricing||document.getElementById('checkoutCard'))return;
var card=document.createElement('div');card.id='checkoutCard';card.className='card';
card.innerHTML='<h2>Start your subscription</h2><p>Choose your software plan and billing period. VR headset rental and haptic vests are coming soon.</p><div class="field"><label for="checkoutPlan">Choose your plan</label><select id="checkoutPlan"><option value="">Select a plan</option><option value="starter">Starter — $19/month</option><option value="pro">QB Pro — $39/month</option><option value="team">Coach & Team — $99/month</option></select></div><div class="field"><label for="checkoutBilling">Billing period</label><select id="checkoutBilling"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></div><div class="field"><label for="checkoutHeadset">VR headset</label><select id="checkoutHeadset" disabled><option>Coming soon</option></select></div><div class="field"><label for="checkoutVest">Haptic vest</label><select id="checkoutVest" disabled><option>Coming soon</option></select></div><div id="checkoutTotal" class="price-total"><b>Select a plan to see your price.</b></div><button class="btn primary" id="checkoutButton" style="width:100%;margin-top:14px" disabled>Continue to secure checkout</button><small class="private-note">Secure payment powered by Stripe. VR headset rental and haptic vests are not available for purchase yet.</small>';
pricing.appendChild(card);
var plan=document.getElementById('checkoutPlan'),billing=document.getElementById('checkoutBilling'),total=document.getElementById('checkoutTotal'),button=document.getElementById('checkoutButton');
var prices={starter:{monthly:19,annual:49},pro:{monthly:39,annual:117},team:{monthly:99,annual:null}};
function update(){
var p=plan.value,b=billing.value;
if(!p){total.innerHTML='<b>Select a plan to see your price.</b>';button.disabled=true;return}
var amount=prices[p][b];
if(amount===null){total.innerHTML='<b>Coach & Team annual pricing is available by contacting sales.</b>';button.disabled=true;return}
var label=b==='monthly'?'per month':'per month, billed annually';
total.innerHTML='<b>$'+amount+' '+label+'</b><br>VR headset rental and haptic vest: coming soon';
button.disabled=false;
}
plan.onchange=update;billing.onchange=update;
button.onclick=function(){
var p=plan.value,b=billing.value;if(!p)return;
var links={starter:{monthly:'YOUR_STRIPE_STARTER_MONTHLY_LINK',annual:'YOUR_STRIPE_STARTER_ANNUAL_LINK'},pro:{monthly:'YOUR_STRIPE_QB_PRO_MONTHLY_LINK',annual:'YOUR_STRIPE_QB_PRO_ANNUAL_LINK'},team:{monthly:'YOUR_STRIPE_COACH_TEAM_MONTHLY_LINK',annual:null}};
var url=links[p]&&links[p][b];
if(url){window.location.href=url}else{alert('Annual Coach & Team pricing is available by contacting sales.')}
};
update();
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',inject)}else{inject()}
})();