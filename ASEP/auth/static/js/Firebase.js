import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbW25iCUlAwslI_2zdoiIavEQe_Uiz_wo",
  authDomain: "foodconnect-4e64e.firebaseapp.com",
  projectId: "foodconnect-4e64e",
  storageBucket: "foodconnect-4e64e.firebasestorage.app",
  messagingSenderId: "574910241302",
  appId: "1:574910241302:web:970aaa182b7d7f23387337",
  measurementId: "G-KJ4QPSNTYY",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
auth.languageCode = "en";
const provider = new GoogleAuthProvider();

const googleLogin = document.getElementById("googleSignInButton");
googleLogin.addEventListener("click", function () {
  signInWithPopup(auth, provider)
    .then((result) => {
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      
      const user = result.user;
      console.log(user);
      window.location.href = "logged.html";
      
    })
    .catch((error) => {
      
      const errorCode = error.code;
      const errorMessage = error.message;
      
      const email = error.customData.email;
      
      const credential = GoogleAuthProvider.credentialFromError(error);
      
    });
});
