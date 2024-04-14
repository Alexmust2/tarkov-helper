import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
    authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VUE_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchAllUsers() {
    try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);
        const userList = snapshot.docs.map(doc => doc.data());
        console.log(userList);
        return userList;  // Возвращает массив объектов данных каждого документа
    } catch (error) {
        console.error("Ошибка при получении документов:", error);
    }
}

export { db, fetchAllUsers };