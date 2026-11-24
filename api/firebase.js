<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QB Sense Login</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f6f8;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }

    .box {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      width: 320px;
      text-align: center;
    }

    input {
      width: 100%;
      padding: 10px;
      margin: 8px 0;
      border: 1px solid #ccc;
      border-radius: 6px;
      box-sizing: border-box;
    }

    button {
      width: 100%;
      padding: 10px;
      margin-top: 10px;
      border: none;
      border-radius: 6px;
      background: #2563eb;
      color: white;
      font-size: 16px;
      cursor: pointer;
    }

    button:hover {
      background: #1d4ed8;
    }

    #protectedContent {
      display: none;
    }
  </style>
</head>

<body>
  <div class="box">
    <div id="authForms">
      <h2>QB Sense</h2>

      <h3>Create account</h3>
      <form id="signupForm">
        <input id="signupEmail" type="email" placeholder="Email" required>
        <input id="signupPassword" type="password" placeholder="Password" required>
        <button type="submit">Sign up</button>
      </form>

      <hr>

      <h3>Log in</h3>
      <form id="loginForm">
        <input id="loginEmail" type="email" placeholder="Email" required>
        <input id="loginPassword" type="password" placeholder="Password" required>
        <button type="submit">Log in</button>
      </form>
    </div>

    <div id="protectedContent">
      <h2>Welcome to QB Sense</h2>
      <p id="userEmail"></p>
      <button id="logoutButton">Log out</button>
    </div>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
    import {
      getAuth,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      onAuthStateChanged,
      signOut
    } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

    const firebaseConfig = {
      apiKey: "AIzaSyDuvuM5uTaAY7tV3nazl7hZdCgC3GdxeC0",
      authDomain: "qb-sense.firebaseapp.com",
      projectId: "qb-sense",
      storageBucket: "qb-sense.firebasestorage.app",
      messagingSenderId: "304842558509",
      appId: "1:304842558509:web:0732a12a9ad5cd9e60bca4",
      measurementId: "G-SM1FMT6EXH"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");
    const logoutButton = document.getElementById("logoutButton");
    const authForms = document.getElementById("authForms");
    const protectedContent = document.getElementById("protectedContent");
    const userEmail = document.getElementById("userEmail");

    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created successfully!");
      } catch (error) {
        alert(error.message);
      }
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully!");
      } catch (error) {
        alert("Incorrect email or password.");
      }
    });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        authForms.style.display = "none";
        protectedContent.style.display = "block";
        userEmail.textContent = "Logged in as: " + user.email;
      } else {
        authForms.style.display = "block";
        protectedContent.style.display = "none";
      }
    });

    logoutButton.addEventListener("click", async () => {
      await signOut(auth);
      alert("You have been logged out.");
    });
  </script>
</body>
</html>
