import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCxY8NiggVx8ggjU5qYAu9jDbJfFOZ9tT4",
    authDomain: "ballinium-runtime-server.firebaseapp.com",
    projectId: "ballinium-runtime-server",
    storageBucket: "ballinium-runtime-server.firebasestorage.app",
    messagingSenderId: "926706236269",
    appId: "1:926706236269:web:62b5a2c58cb1d19d37f864"
};

let app, db;
let isInitialized = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isInitialized = true;
} catch (error) {
    console.warn("Firebase not initialized:", error);
}

export const fetchServerConfig = async () => {
    if (!isInitialized) {
        return { isOnline: false, announcement: "CLIENT INITIALIZATION FAILED.", secureKey: "" };
    }

    try {
        const configRef = doc(db, 'server', 'config');
        const levelsRef = doc(db, 'server', 'levels');

        // Fetch config first
        const docSnap = await getDoc(configRef);

        // Try to fetch levels, but don't fail everything if it's missing/denied
        try {
            const levelsSnap = await getDoc(levelsRef);
            if (levelsSnap.exists()) {
                (window as any).__BALLINIUM_ENCRYPTED_LEVELS__ = levelsSnap.data().payload;
            }
        } catch (levelErr) {
            console.warn("Failed to fetch encrypted levels. This is expected if they are not set up yet:", levelErr);
        }

        if (docSnap.exists()) {
            return docSnap.data() as { isOnline: boolean, announcement?: string, secureKey?: string };
        } else {
            // Because Firestore is in Production mode, checking an empty doc will either fail gracefully or return empty.
            // Returning offline by default just in case it doesn't fail fast.
            console.error("Config document does not exist. Please create it in Firebase Console.");
            return { isOnline: false, announcement: "CONNECTION SEVERED // SERVER UNCONFIGURED.", secureKey: "" };
        }
    } catch (error) {
        console.error("Failed to fetch server config (Possbile permission/CORS error):", error);
        return { isOnline: false, announcement: "SERVER COMMS FAILED // ACCESS DENIED", secureKey: "" };
    }
};
