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
import { localDb } from "../lib/db";

const COLLECTION_NAME = "draws";

export const subscribeToDraws = (callback: (draws: Draw[]) => void, max: number = 100000) => {
  // 1. First load from Local Storage (Instant response)
  const refreshLocal = async () => {
    const localDraws = await localDb.draws.orderBy('sort_key').reverse().limit(max).toArray();
    if (localDraws.length > 0) {
      callback(localDraws);
    }
  };
  refreshLocal();

  // 2. Subscribe to Firestore for real-time updates (Recent ones)
  const quotaHit = window.localStorage.getItem('firestore_quota_hit') === 'true';
  if (quotaHit) {
    console.debug("[DrawService] Quota hit detected. Real-time subscription skipped.");
    return () => {}; // No-op unsubscription
  }

  const q = query(
    collection(db, COLLECTION_NAME), 
    orderBy("sort_key", "desc"),
    limit(200) // Only subscription for recent draws to save bandwidth/quota
  );
  
  return onSnapshot(q, async (snapshot) => {
    const firestoreDraws = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Draw[];

    // Save recent draws to local DB
    if (firestoreDraws.length > 0) {
      await localDb.draws.bulkPut(firestoreDraws);
    }

    // Combine and send to callback
    const allLocal = await localDb.draws.orderBy('sort_key').reverse().limit(max).toArray();
    callback(allLocal);
  }, (error: any) => {
    // If quota hit, we just log it and continue using local data
    if (error.code === 'resource-exhausted') {
      window.localStorage.setItem('firestore_quota_hit', 'true');
      console.warn("Firestore Quota hit. Application switching to Local-Only mode for historical data.");
    } else {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    }
  });
};

export const saveDraws = async (draws: Draw[]) => {
  if (draws.length === 0) return;

  const processedDraws = draws.map(draw => {
    const id = draw.id || `${draw.date_tirage.replace(/\//g, '-')}_${draw.nom_tirage.replace(/\s+/g, '_')}`;
    return { ...draw, id };
  });

  // 1. ALWAYS save to IndexedDB (Unlimited & Free)
  try {
    await localDb.draws.bulkPut(processedDraws);
    console.log(`[LocalSync] ${processedDraws.length} tirages sauvegardés en local.`);
  } catch (err) {
    console.error("[LocalSync] Erreur IndexedDB:", err);
  }

  // 2. SAVE to Firestore (Background & Non-blocking)
  const syncToCloud = async () => {
    const quotaHit = window.localStorage.getItem('firestore_quota_hit') === 'true';
    if (quotaHit) return;

    // Process in chunks of 500 (Firestore batch limit)
    for (let i = 0; i < processedDraws.length; i += 500) {
      const chunk = processedDraws.slice(i, i + 500);
      const batch = writeBatch(db);

      for (const draw of chunk) {
        const docRef = doc(db, COLLECTION_NAME, draw.id!);
        batch.set(docRef, { ...draw, timestamp: serverTimestamp() }, { merge: true });
      }

      try {
        await batch.commit();
      } catch (error: any) {
        if (error.code === 'resource-exhausted') {
          window.localStorage.setItem('firestore_quota_hit', 'true');
          console.warn("[CloudSync] QUOTA ÉPUISÉ. Mode Local activé pour le reste de cette session.");
          return;
        }
        console.error("[DrawService] Batch commit error:", error);
      }
    }
  };

  // Run in background, don't wait. This prevents extraction UI from hanging.
  syncToCloud().catch(err => console.error("[CloudSync Background Error]", err));
};

export const getAllDraws = async (): Promise<Draw[]> => {
  // Prefer Local DB for full dumps (Quota safe)
  try {
    return await localDb.draws.orderBy('sort_key').reverse().toArray();
  } catch (error) {
    console.error("Failed to get all draws from local DB:", error);
    return [];
  }
};
