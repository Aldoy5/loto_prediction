import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with long polling to bypass potential WebSocket issues in restricted environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.error('Popup blocked');
      throw new Error('Le popup a été bloqué par votre navigateur.');
    }
    throw error;
  }
};

// Connection test with retry logic
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Use a timeout for the fetch itself if possible, though getDocFromServer doesn't take one easily
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection successful");
      return;
    } catch (error: any) {
      // If it's a permission error, we actually reached the server!
      if (error.code === 'permission-denied') {
        console.log("Firestore connection reached (Permission Denied as expected)");
        return;
      }
      
      console.warn(`Firestore connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error("Firestore connectivity issue. Please ensure the Firestore database is provisioned and your network allows Firebase traffic.");
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
}

// Delayed test
setTimeout(() => testConnection(), 2000);
