import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // ต้องมีบรรทัดนี้
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCk4DZ-lifTpMDe0ntomtuSfHtvwsvEljQ",
  authDomain: "catch-leopards.firebaseapp.com",
  projectId: "catch-leopards",
  storageBucket: "catch-leopards.firebasestorage.app",
  messagingSenderId: "995564261043",
  appId: "1:995564261043:web:cf8d90aadd63d8d76aaac6",
  measurementId: "G-B4Z8F7NMCP"
};

// เริ่มการเชื่อมต่อ
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);