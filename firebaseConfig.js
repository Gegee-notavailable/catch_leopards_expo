import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // ต้องมีบรรทัดนี้

const firebaseConfig = {
  apiKey: "เลข_API_KEY_ของพี่",
  authDomain: "catch-leopards.firebaseapp.com",
  projectId: "catch-leopards",
  storageBucket: "catch-leopards.firebasestorage.app",
  messagingSenderId: "เลข_SENDER_ID",
  appId: "เลข_APP_ID"
};

// เริ่มการเชื่อมต่อ
const app = initializeApp(firebaseConfig);

// สร้างตัวแปร db เพื่อส่งไปใช้ในหน้า index.tsx
const db = getFirestore(app);

export { db };