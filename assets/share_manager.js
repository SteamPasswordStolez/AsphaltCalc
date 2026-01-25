import { db, auth } from "./firebase_config.js";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const ShareManager = {
    /**
     * Upload garage data to Firestore
     * @param {object} garageData - The raw garage data object
     * @returns {Promise<string>} The document ID (share code)
     */
    shareGarage: async function (garageData) {
        try {
            // Ensure Auth
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }

            // Remove sensitive or unnecessary keys if any?
            // garageData is simple { carId: { star, rank... } } map.
            // Converting to string to ensure integrity
            const payload = {
                data: JSON.stringify(garageData),
                source: "AsphaltCalc_v2",
                createdAt: serverTimestamp(),
                uid: auth.currentUser.uid // Track owner if needed
            };

            const docRef = await addDoc(collection(db, "garages"), payload);
            console.log("Document written with ID: ", docRef.id);
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    /**
     * Load friend's garage data from Code
     * @param {string} code - The document ID
     * @returns {Promise<object>} The garage data object
     */
    loadGarage: async function (code) {
        try {
            // Ensure Auth for Read as well
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }

            const docRef = doc(db, "garages", code);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const raw = docSnap.data().data;
                return JSON.parse(raw);
            } else {
                throw new Error("No such garage found!");
            }
        } catch (e) {
            console.error("Error getting document:", e);
            throw e;
        }
    }
};

export default ShareManager;
