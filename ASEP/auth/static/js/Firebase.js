import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbW25iCUlAwslI_2zdoiIavEQe_Uiz_wo",
  authDomain: "foodconnect-4e64e.firebaseapp.com",
  projectId: "foodconnect-4e64e",
  storageBucket: "foodconnect-4e64e.appspot.com",
  messagingSenderId: "574910241302",
  appId: "1:574910241302:web:970aaa182b7d7f23387337",
  measurementId: "G-KJ4QPSNTYY",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";
const provider = new GoogleAuthProvider();

document
  .getElementById("googleSignInButton")
  .addEventListener("click", function () {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        user.getIdToken().then((idToken) => {
          fetch("/firebase-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idToken: idToken,
              name: user.displayName,
              email: user.email,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.new_user) {
                window.location.href = "/select_type"; // Redirect to dash.html
              } else {
                window.location.href = "/dashboard"; // Redirect existing users to their dashboard
              }
            });
        });
      })
      .catch((error) => {
        console.error("Error signing in:", error);
      });
  });
