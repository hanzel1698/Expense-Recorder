import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase config from Firebase Console
// Go to: https://console.firebase.google.com/
// Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyBP2DlgOf45wIvXoNVdCvBzHr7W6Sl-8dY",
  authDomain: "expense-recorder-1988.firebaseapp.com",
  projectId: "expense-recorder-1988",
  storageBucket: "expense-recorder-1988.firebasestorage.app",
  messagingSenderId: "123757327810",
  appId: "1:123757327810:web:f8bdc29651e164b4fcd25b",
  measurementId: "G-JHFPMJF3DY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
