// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
 
const firebaseConfig = {
  apiKey: "AIzaSyBakEKP03QplA22reJV_wvpch8uoEqaEjc",
  authDomain: "raise-82da7.firebaseapp.com",
  projectId: "raise-82da7",
  storageBucket: "raise-82da7.appspot.com",
  messagingSenderId: "223847036195",
  appId: "1:223847036195:web:468bb601bbe799521a4896",
  measurementId: "G-K1YR4J8LY1"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore();


