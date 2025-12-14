
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJvRYXPtT0mqOpG2DVbNlpL5Kptq_1swI",
    authDomain: "bzbz-219c8.firebaseapp.com",
    projectId: "bzbz-219c8",
    storageBucket: "bzbz-219c8.firebasestorage.app",
    messagingSenderId: "892097630828",
    appId: "1:892097630828:web:338ed423deb69dff5a3e49",
    measurementId: "G-19Y2C59PWY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Leaderboard = {
    async submitScore(name, score, wave, character) {
        try {
            const docRef = await addDoc(collection(db, "leaderboard"), {
                name: name,
                score: score,
                wave: wave,
                character: character,
                timestamp: new Date()
            });
            console.log("Score written with ID: ", docRef.id);
            return true;
        } catch (e) {
            console.error("Error adding document: ", e);
            return false;
        }
    },

    async getTopScores(limitCount = 10) {
        try {
            const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(limitCount));
            const querySnapshot = await getDocs(q);
            const scores = [];
            querySnapshot.forEach((doc) => {
                scores.push(doc.data());
            });
            return scores;
        } catch (e) {
            console.error("Error getting documents: ", e);
            return [];
        }
    }
};

// Expose to global scope for UI.js
window.Leaderboard = Leaderboard;
console.log("Leaderboard module loaded.");
