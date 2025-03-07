import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAV7IQyTeJEw72KBcciziPFiRZ47ieZ7WY",
  authDomain: "trumpet-practice-hub-fe705.firebaseapp.com",
  projectId: "trumpet-practice-hub-fe705",
  storageBucket: "trumpet-practice-hub-fe705.firebasestorage.app",
  messagingSenderId: "955065582875",
  appId: "1:955065582875:web:78f4e9fb2030cb42bb3fbe",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { storage, auth, googleProvider };
