import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { Draw, OperationType } from "../types";
import { handleFirestoreError } from "../lib/firestoreErrorHandler";

const COLLECTION_NAME = "draws";

export const subscribeToDraws = (callback: (draws: Draw[]) => void, max: number = 100) => {
  const q = query(
    collection(db, COLLECTION_NAME), 
    orderBy("sort_key", "desc"),
    orderBy("timestamp", "desc"), 
    limit(max)
  );
  
  return onSnapshot(q, (snapshot) => {
    const draws = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Draw[];
    callback(draws);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const saveDraws = async (draws: Draw[]) => {
  for (const draw of draws) {
    const id = `${draw.date_tirage.replace(/\//g, '-')}_${draw.nom_tirage.replace(/\s+/g, '_')}`;
    const docRef = doc(db, COLLECTION_NAME, id);
    
    try {
      // Use setDoc to overwrite or create, effectively INSERT OR IGNORE if we check existence or just set it
      // Based on rules, create is allowed if not exists
      await setDoc(docRef, {
        ...draw,
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving draw:", draw.nom_tirage, error);
      // We don't necessarily want to halt the whole process if one fails (e.g. duplicate)
    }
  }
};

export const getAllDraws = async (): Promise<Draw[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy("sort_key", "desc"),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Draw[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};
