
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDj4359oy9TDDGkPPAcVJOnjXulztNqkuI",
  authDomain: "expensetracker-357ca.firebaseapp.com",
  databaseURL: "https://expensetracker-357ca-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "expensetracker-357ca",
  storageBucket: "expensetracker-357ca.firebasestorage.app",
  messagingSenderId: "556499254077",
  appId: "1:556499254077:web:d6f05eca8ee536e797e354"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
