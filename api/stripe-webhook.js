// Stripe calls this after a checkout or any change to a subscription. It saves the player's package
// (starter, pro or team; "none" when the subscription ends or stops being paid) on their Firebase
// account as a custom claim. The pages and the AI conversion read it from there.
//
// Settings needed on the server (never put these in the code):
//   STRIPE_WEBHOOK_SECRET     - the webhook's signing secret, from the Stripe dashboard (whsec_...)
//   STRIPE_SECRET_KEY         - a Stripe secret or restricted key that can update subscriptions
//   FIREBASE_SERVICE_ACCOUNT  - the Firebase service account key file, pasted whole (JSON)
import crypto from 'node:crypto';

const PROJECT_ID = 'qb-sense';
// The monthly price of each package, in cents, as charged by the Stripe payment links: $20, $30, $75.
// The earlier test prices ($19, $39, $99) still map, for subscriptions started before the change.
const PLAN_BY_AMOUNT = { 2000: 'starter', 3000: 'pro', 7500: 'team', 1900: 'starter', 3900: 'pro', 9900: 'team' };
const PAYING = new Set(['active', 'trialing']);
// Stripe signs each call; calls older than this are refused, so a recorded call cannot be replayed.
const TOLERANCE_SECONDS = 300;

// Read the request exactly as sent: the signature is checked against the raw bytes.
export const config = { api: { bodyParser: false } };

async function rawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

function signedByStripe(raw, header, secret) {
  const parts = String(header || '').split(',').map((part) => part.split('='));
  const time = Number((parts.find(([key]) => key === 't') || [])[1]);
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!time || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - time) > TOLERANCE_SECONDS) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${time}.`).update(raw).digest();
  return signatures.some((value) => {
    const given = Buffer.from(value, 'hex');
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

// A short-lived Google access token for the Firebase service account.
async function googleToken() {
  const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/identitytoolkit',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), account.private_key).toString('base64url');
  const result = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  if (!result.ok) throw new Error(`Google token request failed (${result.status})`);
  return (await result.json()).access_token;
}

// The package currently saved on the account, if any.
async function savedPlan(uid, token) {
  const result = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ localId: [uid] }),
  });
  if (!result.ok) throw new Error(`Reading the account failed (${result.status})`);
  const user = ((await result.json()).users || [])[0];
  try {
    return user && user.customAttributes ? JSON.parse(user.customAttributes) : {};
  } catch (error) {
    return {};
  }
}

// Saves the package on the Firebase account. The player's pages pick it up on their next token refresh.
// A change to an old subscription (one the player already replaced) does not touch the current package.
async function savePlan(uid, plan, subscription, onlyIfCurrent = false) {
  const token = await googleToken();
  if (onlyIfCurrent) {
    const saved = await savedPlan(uid, token);
    if (saved.subscription && saved.subscription !== subscription) return;
  }
  const result = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify({ plan, subscription }) }),
  });
  if (!result.ok) throw new Error(`Saving the package failed (${result.status})`);
}

// Labels the subscription with the player's account, so later changes (upgrade, cancel, failed
// payment) can be matched back to that player.
async function labelSubscription(id, uid, plan) {
  const result = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'metadata[uid]': uid, 'metadata[plan]': plan }),
  });
  if (!result.ok) throw new Error(`Labelling the subscription failed (${result.status})`);
}

// Firebase account ids are letters and digits.
const validUid = (uid) => typeof uid === 'string' && /^[A-Za-z0-9]{1,128}$/.test(uid);

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT) {
    return response.status(500).json({ error: 'The webhook is not configured on the server.' });
  }

  const raw = await rawBody(request);
  if (!signedByStripe(raw, request.headers['stripe-signature'], secret)) {
    return response.status(400).json({ error: 'Signature check failed.' });
  }

  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch (error) {
    return response.status(400).json({ error: 'Not valid JSON.' });
  }

  try {
    const item = event.data && event.data.object;
    if (event.type === 'checkout.session.completed') {
      // The checkout link carries the player's account id as client_reference_id.
      const uid = item.client_reference_id;
      const plan = PLAN_BY_AMOUNT[item.amount_subtotal];
      if (item.mode === 'subscription' && item.subscription && validUid(uid) && plan) {
        await labelSubscription(item.subscription, uid, plan);
        await savePlan(uid, plan, item.subscription);
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const uid = item.metadata && item.metadata.uid;
      if (validUid(uid)) {
        const price = item.items && item.items.data && item.items.data[0] && item.items.data[0].price;
        const paying = event.type === 'customer.subscription.updated' && PAYING.has(item.status);
        const plan = paying ? PLAN_BY_AMOUNT[price && price.unit_amount] || 'none' : 'none';
        await savePlan(uid, plan, item.id, true);
      }
    }
    // Other events are acknowledged and ignored.
    return response.status(200).json({ received: true });
  } catch (error) {
    // A failure answers 500, so Stripe tries again later.
    console.error('Stripe webhook:', error.message);
    return response.status(500).json({ error: 'Could not update the package. Stripe will retry.' });
  }
}
