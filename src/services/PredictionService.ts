import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc,
  updateDoc,
  doc, 
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { Prediction, OperationType, Draw } from "../types";
import { handleFirestoreError } from "../lib/firestoreErrorHandler";

const COLLECTION_NAME = "predictions";

export const subscribeToUserPredictions = (userId: string, callback: (predictions: Prediction[]) => void) => {
  if (!userId) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Prediction[];
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const savePrediction = async (prediction: Omit<Prediction, "id" | "timestamp">) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...prediction,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updatePredictionMatches = async (predictionId: string, matches: Prediction["matches"]) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, predictionId);
    await updateDoc(docRef, { matches });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
  }
};

/**
 * Utility to evaluate predictions against recent draws
 */
export const evaluatePredictions = async (predictions: Prediction[], recentDraws: Draw[]) => {
  for (const pred of predictions) {
    const newMatches: Prediction["matches"] = [];
    
    // Only check if we haven't already matched or if we want to refresh
    // For now, let's just find matches in the recent draws
    for (const draw of recentDraws) {
      // Check Banker
      let matchedNums: number[] = [];
      if (pred.banker && draw.gagnants.includes(pred.banker)) {
        matchedNums.push(pred.banker);
      }

      // Check NAP 2
      if (pred.nap2) {
        const nap2Matched = pred.nap2.filter(n => draw.gagnants.includes(n));
        if (nap2Matched.length === 2) {
           // Both matched!
           nap2Matched.forEach(n => { if(!matchedNums.includes(n)) matchedNums.push(n) });
        }
      }

      // Check all numbers (Permutation)
      const permMatched = pred.numbers.filter(n => draw.gagnants.includes(n));
      permMatched.forEach(n => { if(!matchedNums.includes(n)) matchedNums.push(n) });

      if (matchedNums.length > 0) {
        newMatches.push({
          drawId: draw.id || "",
          drawDate: draw.date_tirage,
          drawName: draw.nom_tirage,
          matchedNumbers: matchedNums,
          count: matchedNums.length
        });
      }
    }

    if (newMatches.length > 0 && pred.id) {
       // Compare with existing matches to avoid infinite loops
       const existingMatches = pred.matches || [];
       if (JSON.stringify(existingMatches) !== JSON.stringify(newMatches)) {
         await updatePredictionMatches(pred.id, newMatches);
       }
    }
  }
};
