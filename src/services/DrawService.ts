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
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import { Draw, OperationType } from "../types";
import { handleFirestoreError } from "../lib/firestoreErrorHandler";

const COLLECTION_NAME = "draws";

export const subscribeToDraws = (callback: (draws: Draw[]) => void, max: number = 6000) => {
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
  if (draws.length === 0) return;

  // Process in chunks of 500 (Firestore batch limit)
  for (let i = 0; i < draws.length; i += 500) {
    const chunk = draws.slice(i, i + 500);
    const batch = writeBatch(db);

    for (const draw of chunk) {
      const id = `${draw.date_tirage.replace(/\//g, '-')}_${draw.nom_tirage.replace(/\s+/g, '_')}`;
      const docRef = doc(db, COLLECTION_NAME, id);
      
      batch.set(docRef, {
        ...draw,
        timestamp: serverTimestamp()
      }, { merge: true });
    }

    try {
      await batch.commit();
      console.log(`[DrawService] Batch de ${chunk.length} tirages sauvegardé.`);
    } catch (error) {
      console.error("[DrawService] Erreur lors du commit du batch:", error);
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
