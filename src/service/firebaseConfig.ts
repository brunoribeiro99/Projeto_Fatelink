import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyDvJalAe55Ld8RzVdJWo0t_ar3X0d8sx-o",
  authDomain: "fatelink-82e48.firebaseapp.com",
  projectId: "fatelink-82e48",
  storageBucket: "fatelink-82e48.firebasestorage.app",
  messagingSenderId: "181153345098",
  appId: "1:181153345098:web:52f7050f22d060ef1c00b3",
  measurementId: "G-08E03MX6N5",
};

// Inicializa a aplicação Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias dos serviços que utilizaremos
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
