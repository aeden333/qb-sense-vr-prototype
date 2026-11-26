// Sends signed-out visitors to the sign-in screen. This only guards the pages in the browser;
// anything that costs money or holds private data must also check the token on the server.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';

const app = initializeApp({
  apiKey: 'AIzaSyDuvuM5uTaAY7tV3nazl7hZdCgC3GdxeC0',
  authDomain: 'qb-sense.firebaseapp.com',
  projectId: 'qb-sense',
  appId: '1:304842558509:web:0732a12a9ad5cd9e60bca4'
});
const auth = getAuth(app);

window.qbGetIdToken = async () => {
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
};

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.replace('index.html');
});
