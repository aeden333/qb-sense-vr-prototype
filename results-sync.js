// Keeps drill results on the signed-in player's account, so they follow the player across devices.
// Results are still stored in the browser first; this copies them both ways.
// Firestore rules allow a player to read and create (never change) users/{uid}/results/{id}.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import { getFirestore, collection, doc, getDocs, setDoc } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore-lite.js';

const KEYS = [
  'qbsense_progression_results',
  'qbsense_blitz_results',
  'qbsense_redzone_results',
  'qbsense_twominute_results',
  'qbsense_game_results',
  'qbsense_readthrow_results'
];

const app = getApps().length ? getApp() : initializeApp({
  apiKey: 'AIzaSyDuvuM5uTaAY7tV3nazl7hZdCgC3GdxeC0',
  authDomain: 'qb-sense.firebaseapp.com',
  projectId: 'qb-sense',
  storageBucket: 'qb-sense.firebasestorage.app',
  messagingSenderId: '304842558509',
  appId: '1:304842558509:web:0732a12a9ad5cd9e60bca4',
  measurementId: 'G-SM1FMT6EXH'
});
const auth = getAuth(app);
const database = getFirestore(app);

function load(key) {
  try {
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

// The same result gets the same id on every device.
const idFor = (key, record) => `${key}_${record.date}`.replace(/\//g, '-');

async function sync(user) {
  const results = collection(database, 'users', user.uid, 'results');
  const remote = new Map((await getDocs(results)).docs.map((item) => [item.id, item.data()]));

  // Upload this player's results that the account does not have yet.
  for (const key of KEYS) {
    for (const record of load(key)) {
      if (record.email !== user.email || !record.date) continue;
      const id = idFor(key, record);
      if (remote.has(id)) continue;
      await setDoc(doc(results, id), { key, data: JSON.stringify(record) });
    }
  }

  // Download results saved from other devices.
  let added = false;
  for (const key of KEYS) {
    const local = load(key);
    const known = new Set(local.filter((record) => record.email === user.email).map((record) => idFor(key, record)));
    let changed = false;
    for (const [id, item] of remote) {
      if (item.key !== key || known.has(id)) continue;
      try {
        local.push({ ...JSON.parse(item.data), email: user.email });
        changed = true;
      } catch (error) {
        // Skip a damaged entry rather than losing the others.
      }
    }
    if (!changed) continue;
    local.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(key, JSON.stringify(local));
    added = true;
  }
  // The Results and Progress scripts redraw on this event.
  if (added) window.dispatchEvent(new Event('storage'));
}

// One sync at a time; a failure leaves the results in the browser for the next try.
let running = Promise.resolve();
function queue() {
  running = running.then(async () => {
    const user = auth.currentUser;
    if (!user) return true;
    try {
      await sync(user);
      return true;
    } catch (error) {
      console.warn('Results not synced:', error.code || error.message);
      return false;
    }
  });
  return running;
}

window.qbSyncResults = queue;
onAuthStateChanged(auth, (user) => {
  if (user) queue();
});
