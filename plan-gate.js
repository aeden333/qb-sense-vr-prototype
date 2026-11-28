// Package access. Reads the signed-in player's package, which api/stripe-webhook.js saves on the
// account when they subscribe, and locks what the package does not include:
//   Rookie   (starter) - the 2D drills, playbook uploads, results and progress
//   Varsity  (pro)     - everything in Rookie plus the 3D drills (no VR)
//   All-Pro  (team)    - everything in Varsity plus VR (Live Training, Coach Mode) and Players
// Coach & Team is quote-only (quote-request.js); a quoted group is given the team package.
// Signed in with no package: results and progress, plus a free sample of the 2D drills.
// These locks stop normal use in the browser. Anything that costs money (AI playbook conversion) is
// also checked on the server, since a page's files can always be opened directly.
//
// Load it as a module after the page's other Firebase scripts (auth-guard.js, or the sign-in script
// on index.html), so it shares their Firebase app.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth, getIdTokenResult } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';

// The pause switch. false = packages are paused: nothing is locked, there are no badges or free-sample
// counts, and everyone can use every drill and feature. true = packages are on and locked as above.
// When turning packages back on, also set PAYMENTS_ON in pricing-checkout.js and PACKAGES_ON in
// api/convert-play.js, and reactivate the Stripe payment links.
const PACKAGES_ON = false;

const LEVEL = { none: 0, starter: 1, pro: 2, team: 3 };
// The account keeps the original codes (starter, pro, team); these are the names players see.
const NAMES = { none: 'No package', starter: 'Rookie', pro: 'Varsity', team: 'All-Pro' };
// What each drill page needs.
const PAGES = {
  'blitz-sim.html': 'starter',
  'redzone-sim.html': 'starter',
  'progression-sim.html': 'starter',
  'game-scenarios.html': 'starter',
  'twominute-sim.html': 'starter',
  'playbook.html': 'starter',
  'read-throw.html': 'pro',
  'pocket-pressure-3d.html': 'pro',
};
// The free sample: this many sessions of the 2D drills before a package is needed.
const SAMPLE_PAGES = new Set(['blitz-sim.html', 'redzone-sim.html', 'progression-sim.html', 'game-scenarios.html', 'twominute-sim.html']);
const FREE_SESSIONS = 3;
// What each part of the home page needs, and what to call it on the lock.
const SECTIONS = {
  live: ['team', 'Live Training (VR headset)'],
  coach: ['team', 'Coach Mode (VR headset)'],
  players: ['team', 'Players'],
  playbook: ['starter', 'Playbook uploads'],
};
const DRILL_NEEDS = { 'read-throw.html': 'pro', 'pocket-pressure-3d.html': 'pro' };

const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
const isHome = page === 'index.html' || page === '';

const app = getApps().length ? getApp() : initializeApp({
  apiKey: 'AIzaSyDuvuM5uTaAY7tV3nazl7hZdCgC3GdxeC0',
  authDomain: 'qb-sense.firebaseapp.com',
  projectId: 'qb-sense',
  appId: '1:304842558509:web:0732a12a9ad5cd9e60bca4',
});
const auth = getAuth(app);

// For checking the locks on this computer only: on localhost, localStorage "qbsense_test_plan"
// (none, starter, pro or team) stands in for the account's package.
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const testPlan = LOCAL ? localStorage.getItem('qbsense_test_plan') : null;

function css() {
  if (document.getElementById('qbPlanStyle')) return;
  const style = document.createElement('style');
  style.id = 'qbPlanStyle';
  style.textContent = `
.qb-lock{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:rgba(10,22,40,.92);font-family:system-ui,Arial,sans-serif}
.qb-lock-card{max-width:440px;background:#fff;color:#111827;border-radius:12px;padding:26px 24px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.qb-lock-card h2{margin:6px 0 8px;font-size:22px;text-transform:none}
.qb-lock-card p{margin:0 0 16px;color:#475569;line-height:1.45}
.qb-lock-card .qb-icon{font-size:34px}
.qb-lock-card a{display:inline-block;margin:4px;padding:11px 16px;border-radius:7px;font-weight:800;text-decoration:none;background:#14532D;color:#fff}
.qb-lock-card a.qb-ghost{background:#fff;color:#0A1628;border:1px solid #CBD5E1}
section.qb-locked>:not(.qb-lock-card){display:none!important}
section.qb-locked>.qb-lock-card{margin:24px auto}
.qb-plan-note{margin:0 0 14px;padding:12px 14px;border-radius:8px;background:#ECFDF5;border:1px solid #86EFAC;color:#14532D;font-weight:700}
.qb-plan-note.warn{background:#FEF3C7;border-color:#F59E0B;color:#78350F}
.qb-plan-banner{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147482000;max-width:92vw;padding:10px 16px;border-radius:999px;background:#0A1628;color:#fff;font:700 13px system-ui,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.qb-plan-banner a{color:#FACC15;margin-left:6px}
.qb-badge{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#0A1628;color:#FACC15;font-size:11px;font-weight:800;letter-spacing:.03em;vertical-align:middle}
.price-card .qb-current{display:inline-block;margin-bottom:8px;padding:3px 10px;border-radius:999px;background:#14532D;color:#fff;font-size:12px;font-weight:800}`;
  document.head.appendChild(style);
}

function lockCard(feature, need, plan, inSection) {
  const card = document.createElement('div');
  card.className = 'qb-lock-card';
  const icon = document.createElement('div');
  icon.className = 'qb-icon';
  icon.textContent = '🔒';
  const title = document.createElement('h2');
  title.textContent = `${feature} is part of ${NAMES[need]}`;
  const text = document.createElement('p');
  text.textContent = plan === 'none'
    ? `Choose the ${NAMES[need]} package or higher to unlock it.`
    : `Your package is ${NAMES[plan]}. Upgrade to ${NAMES[need]} to unlock it.`;
  const upgrade = document.createElement('a');
  upgrade.href = 'index.html#pricing';
  upgrade.textContent = 'See packages';
  if (inSection) upgrade.addEventListener('click', (event) => { event.preventDefault(); openPricing(); });
  card.append(icon, title, text, upgrade);
  if (!inSection) {
    const back = document.createElement('a');
    back.href = 'index.html#drills';
    back.className = 'qb-ghost';
    back.textContent = 'Back to drills';
    card.append(back);
  }
  return card;
}

function openPricing() {
  const button = document.querySelector('#mainNav [data-page="pricing"]');
  if (button) button.click();
  else location.href = 'index.html#pricing';
}

function lockPage(feature, need, plan) {
  css();
  if (document.querySelector('.qb-lock')) return;
  const cover = document.createElement('div');
  cover.className = 'qb-lock';
  cover.setAttribute('role', 'dialog');
  cover.setAttribute('aria-modal', 'true');
  cover.append(lockCard(feature, need, plan, false));
  document.body.append(cover);
  // Stop the drill underneath from taking keys.
  window.addEventListener('keydown', (event) => event.stopImmediatePropagation(), true);
}

function banner(text, link) {
  css();
  const old = document.querySelector('.qb-plan-banner');
  if (old) old.remove();
  const bar = document.createElement('div');
  bar.className = 'qb-plan-banner';
  bar.textContent = text;
  if (link) {
    const a = document.createElement('a');
    a.href = 'index.html#pricing';
    a.textContent = link;
    bar.append(a);
  }
  document.body.append(bar);
}

// Free-sample sessions used by this account on this device.
const sampleKey = (uid) => `qbsense_free_sessions_${uid || 'guest'}`;
const sampleUsed = (uid) => Number(localStorage.getItem(sampleKey(uid)) || 0);

function drillPageGate(plan, uid) {
  const need = PAGES[page];
  if (!need) return;
  if (LEVEL[plan] >= LEVEL[need]) {
    // Varsity and up get the 3D view of the Two-Minute Drill; Rookie gets the 2D diagram.
    if (page === 'twominute-sim.html') limitTwoMinute(plan);
    return;
  }
  if (plan === 'none' && SAMPLE_PAGES.has(page)) {
    // Each visit to a 2D drill uses one free session.
    const used = sampleUsed(uid);
    if (used < FREE_SESSIONS) {
      localStorage.setItem(sampleKey(uid), String(used + 1));
      banner(`Free sample: ${FREE_SESSIONS - used - 1} of ${FREE_SESSIONS} sessions left. `, 'Choose a package');
      if (page === 'twominute-sim.html') limitTwoMinute(plan);
      return;
    }
  }
  const feature = page === 'playbook.html' ? 'Playbook uploads' : need === 'pro' ? 'This 3D drill' : 'This drill';
  lockPage(feature, need, plan);
}

function limitTwoMinute(plan) {
  if (LEVEL[plan] >= LEVEL.pro) return;
  const select = document.getElementById('view3d');
  if (!select) return;
  const option = select.querySelector('option[value="3d"]');
  if (option) {
    option.disabled = true;
    option.textContent = '3D quarterback view (Varsity)';
  }
  if (select.value === '3d') {
    select.value = '2d';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function homeGate(plan, uid) {
  css();
  // Lock sections of the home page the package does not include.
  for (const [id, [need, feature]] of Object.entries(SECTIONS)) {
    const section = document.getElementById(id);
    if (!section) continue;
    const old = section.querySelector(':scope > .qb-lock-card');
    if (old) old.remove();
    section.classList.toggle('qb-locked', LEVEL[plan] < LEVEL[need]);
    if (LEVEL[plan] < LEVEL[need]) section.prepend(lockCard(feature, need, plan, true));
  }
  // Players is included with All-Pro; following others and coach tracking come next.
  const players = document.getElementById('players');
  if (players && LEVEL[plan] >= LEVEL.team && !document.getElementById('qbPlayersSoon')) {
    const note = document.createElement('div');
    note.id = 'qbPlayersSoon';
    note.className = 'qb-plan-note';
    note.textContent = 'Coming soon with your All-Pro package: follow other players, and let coaches track their players’ training and results.';
    players.prepend(note);
  }
  // Drill list: mark what is locked and show the free sample.
  document.querySelectorAll('#drills .drill a[href]').forEach((link) => {
    const file = link.getAttribute('href').split('#')[0].toLowerCase();
    const need = DRILL_NEEDS[file] || PAGES[file];
    const row = link.closest('.drill');
    const badge = row && row.querySelector('.qb-badge');
    if (badge) badge.remove();
    if (!need || LEVEL[plan] >= LEVEL[need]) return;
    if (plan === 'none' && SAMPLE_PAGES.has(file) && sampleUsed(uid) < FREE_SESSIONS) return;
    const label = document.createElement('span');
    label.className = 'qb-badge';
    label.textContent = `🔒 ${NAMES[need]}`;
    const name = row && row.querySelector('b');
    if (name) name.after(label);
  });
  const drills = document.getElementById('drills');
  const oldNote = document.getElementById('qbSampleNote');
  if (oldNote) oldNote.remove();
  if (drills && plan === 'none') {
    const left = Math.max(0, FREE_SESSIONS - sampleUsed(uid));
    const note = document.createElement('div');
    note.id = 'qbSampleNote';
    note.className = 'qb-plan-note warn';
    note.textContent = left
      ? `Free sample: ${left} of ${FREE_SESSIONS} sessions of the 2D drills left. Choose a package on the Pricing page to keep training.`
      : 'Your free sample is used up. Choose a package on the Pricing page to keep training.';
    drills.prepend(note);
  }
  // Pricing: show the current package.
  document.querySelectorAll('.price-card').forEach((card) => {
    const old = card.querySelector('.qb-current');
    if (old) old.remove();
    const tier = (card.querySelector('.price-tier') || {}).textContent || '';
    if (tier.trim().toLowerCase() === NAMES[plan].toLowerCase()) {
      const mark = document.createElement('div');
      mark.className = 'qb-current';
      mark.textContent = 'Your current package';
      card.prepend(mark);
    }
  });
}

function apply(plan, user) {
  window.qbAccount = user ? { uid: user.uid, email: user.email || '', plan } : { uid: null, email: '', plan };
  document.documentElement.dataset.plan = plan;
  if (isHome) homeGate(plan, user && user.uid);
  else drillPageGate(plan, user && user.uid);
  window.dispatchEvent(new CustomEvent('qbplan', { detail: window.qbAccount }));
}

async function readPlan(force) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return { plan: 'none', user: null };
  const token = await getIdTokenResult(user, force);
  const plan = LEVEL[token.claims.plan] ? token.claims.plan : 'none';
  return { plan, user };
}

async function start() {
  if (!PACKAGES_ON) {
    // Paused: lock nothing. The account is still reported, for the quote form and checkout.
    await auth.authStateReady();
    const user = auth.currentUser;
    window.qbAccount = { uid: user ? user.uid : null, email: user ? user.email || '' : '', plan: 'none', paused: true };
    document.documentElement.dataset.plan = 'paused';
    window.dispatchEvent(new CustomEvent('qbplan', { detail: window.qbAccount }));
    return;
  }
  if (testPlan && testPlan in LEVEL) {
    apply(testPlan, { uid: 'local-test', email: 'test@localhost' });
    return;
  }
  // Coming back from checkout: the payment is confirmed by Stripe a few seconds later, so check
  // the account again for up to about 30 seconds.
  const params = new URLSearchParams(location.search);
  const fromCheckout = params.get('checkout') === 'success';
  let { plan, user } = await readPlan(fromCheckout);
  apply(plan, user);
  if (fromCheckout && user) {
    banner('Confirming your payment…');
    for (let i = 0; i < 10 && plan === 'none'; i++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      ({ plan, user } = await readPlan(true));
    }
    apply(plan, user);
    banner(plan === 'none'
      ? 'Your payment is still being confirmed. Reload this page in a minute.'
      : `You're on ${NAMES[plan]}. Enjoy your training!`);
    history.replaceState(null, '', location.pathname + location.hash);
  }
}

window.qbPlanReady = start().catch((error) => {
  console.warn('Package check failed:', error.message);
  // If the package cannot be read, treat it as no package; a reload tries again.
  apply('none', auth.currentUser);
});
