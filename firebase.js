import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  query,
  orderByChild,
  limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDiCrZhKVpkYE3HUeeDkAo7xA9I88uZ1i0",
  authDomain: "abojana-3f0c2.firebaseapp.com",
  databaseURL: "https://abojana-3f0c2-default-rtdb.firebaseio.com",
  projectId: "abojana-3f0c2",
  storageBucket: "abojana-3f0c2.firebasestorage.app",
  messagingSenderId: "819681544560",
  appId: "1:819681544560:web:be2249a51d0c79ee21a7b5",
  measurementId: "G-23EYSF1BE0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export {
  db,
  ref,
  get,
  set,
  update,
  push,
  query,
  orderByChild,
  limitToLast
};
