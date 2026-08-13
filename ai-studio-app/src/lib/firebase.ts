import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAdu6cZxEdUHU3nu_LV-ix-_gsi2AUk7kg",
  authDomain: "kdhelpmap.firebaseapp.com",
  projectId: "kdhelpmap",
  storageBucket: "kdhelpmap.firebasestorage.app",
  messagingSenderId: "979831969947",
  appId: "1:979831969947:web:946b9994908bf7a220ce3e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
