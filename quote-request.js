// "Request a quote" for the Coach & Team package. A signed-in coach fills in a short form, and it is
// saved in Firestore under quoteRequests/{id}, where the owner reads it (Firebase console > Firestore).
// The Firestore rules (see docs/PACKAGES_SETUP.md) let a signed-in user create a request for their own
// account only, with these fields and sizes, and nobody can read, change or delete requests from the
// site. Load it as a module after the page's other Firebase scripts.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore-lite.js';

const app = getApps().length ? getApp() : initializeApp({
  apiKey: 'AIzaSyDuvuM5uTaAY7tV3nazl7hZdCgC3GdxeC0',
  authDomain: 'qb-sense.firebaseapp.com',
  projectId: 'qb-sense',
  appId: '1:304842558509:web:0732a12a9ad5cd9e60bca4',
});
const auth = getAuth(app);
const database = getFirestore(app);
// One request every 10 minutes from the same browser, so a double click does not send two.
const WAIT_MS = 10 * 60 * 1000;
const LIMITS = { name: 100, email: 200, organization: 150, message: 2000 };
// On localhost with a test package set (see plan-gate.js), the form is checked but not sent.
const TESTING = ['localhost', '127.0.0.1'].includes(location.hostname) && localStorage.getItem('qbsense_test_plan');

function field(label, input) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const text = document.createElement('label');
  text.htmlFor = input.id;
  text.textContent = label;
  wrap.append(text, input);
  return wrap;
}

function input(id, type, max, placeholder) {
  const element = document.createElement(type === 'textarea' ? 'textarea' : 'input');
  element.id = id;
  if (type !== 'textarea') element.type = type;
  if (max) element.maxLength = max;
  if (placeholder) element.placeholder = placeholder;
  element.required = id !== 'quoteMessage';
  return element;
}

function buildForm() {
  const card = document.createElement('form');
  card.id = 'quoteForm';
  card.className = 'card';
  card.hidden = true;
  card.noValidate = true;
  const title = document.createElement('h2');
  title.textContent = 'Request a Coach & Team quote';
  const intro = document.createElement('p');
  intro.textContent = 'Tell us about your group and we will get back to you with pricing.';
  const name = input('quoteName', 'text', LIMITS.name, 'Example: Coach Jordan Smith');
  const email = input('quoteEmail', 'email', LIMITS.email, 'you@example.com');
  const organization = input('quoteOrganization', 'text', LIMITS.organization, 'Example: Lincoln High School Football');
  const quarterbacks = input('quoteQuarterbacks', 'number', 0, 'Example: 6');
  quarterbacks.min = '1';
  quarterbacks.max = '1000';
  quarterbacks.step = '1';
  const message = input('quoteMessage', 'textarea', LIMITS.message, 'Anything else: VR headsets needed, start date, questions');
  message.rows = 4;
  message.style.width = '100%';
  const status = document.createElement('p');
  status.id = 'quoteStatus';
  status.setAttribute('role', 'status');
  const send = document.createElement('button');
  send.type = 'submit';
  send.className = 'btn primary';
  send.textContent = 'Send request';
  card.append(title, intro,
    field('Your name', name), field('Email to reach you', email), field('Team, school, or organization', organization),
    field('Number of quarterbacks', quarterbacks), field('Message (optional)', message), status, send);
  return { card, name, email, organization, quarterbacks, message, status, send };
}

function start() {
  const button = document.getElementById('quoteButton');
  const anchor = document.getElementById('quoteCard');
  if (!button || !anchor) return;
  const form = buildForm();
  anchor.after(form.card);

  button.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
      if (!form.name.value) form.name.value = user.displayName || '';
      if (!form.email.value) form.email.value = user.email || '';
    }
    form.card.hidden = false;
    form.card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.name.focus({ preventScroll: true });
  });

  form.card.addEventListener('submit', async (event) => {
    event.preventDefault();
    const say = (text, ok) => { form.status.textContent = text; form.status.style.color = ok ? '#14532D' : '#B91C1C'; };
    const values = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      organization: form.organization.value.trim(),
      quarterbacks: Number(form.quarterbacks.value),
      message: form.message.value.trim(),
    };
    if (!values.name || !values.organization) return say('Enter your name and your team, school, or organization.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return say('Enter an email address we can reach you at.');
    if (!Number.isInteger(values.quarterbacks) || values.quarterbacks < 1 || values.quarterbacks > 1000) {
      return say('Enter how many quarterbacks, from 1 to 1000.');
    }
    for (const [key, max] of Object.entries(LIMITS)) if (values[key].length > max) return say('One of the answers is too long.');
    const last = Number(localStorage.getItem('qbsense_quote_sent') || 0);
    if (Date.now() - last < WAIT_MS) return say('Your request was already sent. We will be in touch soon.', true);

    form.send.disabled = true;
    say('Sending…', true);
    try {
      if (TESTING) {
        console.info('Quote request (test, not sent):', values);
      } else {
        const user = auth.currentUser;
        if (!user) throw new Error('signed out');
        await addDoc(collection(database, 'quoteRequests'), { ...values, uid: user.uid, createdAt: serverTimestamp() });
      }
      localStorage.setItem('qbsense_quote_sent', String(Date.now()));
      say(`Thanks! Your request was sent. We will reply to ${values.email}.`, true);
      form.card.querySelectorAll('input, textarea').forEach((element) => { element.disabled = true; });
    } catch (error) {
      form.send.disabled = false;
      say(error.message === 'signed out' ? 'Sign in first, then send your request.' : 'The request could not be sent. Please try again in a moment.');
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
