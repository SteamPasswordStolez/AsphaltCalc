// Firebase Configuration
// Import functions from CDN for ES Module usage without bundler
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAhvgzjhWM2CTmF7LUAQyMhPZ0oKP1a4Yg",
    authDomain: "asphaltcalc-social.firebaseapp.com",
    projectId: "asphaltcalc-social",
    storageBucket: "asphaltcalc-social.firebasestorage.app",
    messagingSenderId: "242987209588",
    appId: "1:242987209588:web:9253ab7eda1cc873019221"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };