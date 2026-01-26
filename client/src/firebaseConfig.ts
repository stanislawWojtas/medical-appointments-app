// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkOBYkZA49Bb0IPLS2rGWr7HBhwJzfCI8",
  authDomain: "medical-appointments-app-8d3ab.firebaseapp.com",
  projectId: "medical-appointments-app-8d3ab",
  storageBucket: "medical-appointments-app-8d3ab.firebasestorage.app",
  messagingSenderId: "105446250292",
  appId: "1:105446250292:web:44696866f81f7daacab761",
  measurementId: "G-XMQ11M7WXZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
