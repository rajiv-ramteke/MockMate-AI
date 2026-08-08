import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBo4tX_nqGOZVivZ9MXfz9XdZ1ggvbSb1I",
  authDomain: "interviewgenius-fee19.firebaseapp.com",
  projectId: "interviewgenius-fee19",
  storageBucket: "interviewgenius-fee19.firebasestorage.app",
  messagingSenderId: "420382050354",
  appId: "1:420382050354:web:3b119354ddcb2624f7d42b",
  measurementId: "G-FE9BN9Y5PZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
