import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, child } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBiC7S29mWNiNyusbIwnR-Pha6aIZZTA0o",
  authDomain: "quiziz-30f51.firebaseapp.com",
  databaseURL: "https://quiziz-30f51-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quiziz-30f51",
  storageBucket: "quiziz-30f51.firebasestorage.app",
  messagingSenderId: "335258259474",
  appId: "1:335258259474:web:a89f78bcb592481fb9c8cb",
  measurementId: "G-X6C0SV86SV",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, get, set, child };
