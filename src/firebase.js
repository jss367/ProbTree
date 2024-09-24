import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBHbTJErdspxyfaoV5Ca59vWv3foXw2ncI",
  authDomain: "probtree.firebaseapp.com",
  projectId: "probtree",
  storageBucket: "probtree.appspot.com",
  messagingSenderId: "658605523771",
  appId: "1:658605523771:web:7f78a8442e455c954d6d1e"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
