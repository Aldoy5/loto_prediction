import { GoogleGenAI, Type } from "@google/genai";
import { Draw } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getPredictions(draws: Draw[]) {
  if (draws.length < 5) return "Pas assez de données pour une prédiction fiable.";

  const history = draws.map(d => ({
    date: d.date_tirage,
    nom: d.nom_tirage,
    gagnants: d.gagnants.join(", ")
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tu es un expert statisticien spécialisé dans le Loto Bonheur de la LONACI (Côte d'Ivoire). 
      Analyse l'historique de tirages suivant pour extraire des motifs, des fréquences et des "longues attentes".
      
      Règles du jeu : 
      - 90 boules (1 à 90).
      - 5 boules tirées par tirage.
      - NAP 2 : 2 numéros doivent sortir parmi les 5.
      - NAP 3 : 3 numéros doivent sortir parmi les 5.
      - PERM 2 : On choisit un ensemble, et si 2 numéros sortent, on gagne.
      
      Ton objectif : Fournir un pronostic optimisé pour maximiser les chances de gain.
      
      Historique récent (les plus récents en premier) :
      ${JSON.stringify(history.slice(0, 100))}
      
      Consignes :
      1. Identifie le "Banker" (le numéro le plus probable).
      2. Suggère un NAP 2 (deux numéros forts).
      3. Suggère un NAP 3 (trois numéros).
      4. Suggère une Permutation de 5 numéros (les plus probables statistiquement).
      5. Explique ton raisonnement en te basant sur les "voisins", les "répétitions" et les "cycles" typiques du Loto Bonheur.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            banker: { type: Type.INTEGER },
            nap2: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "2 numéros recommandés pour le NAP 2"
            },
            nap3: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "3 numéros recommandés pour le NAP 3"
            },
            perm: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "5 numéros suggérés pour une permutation (les plus probables)"
            },
            reasoning: { type: Type.STRING }
          },
          required: ["banker", "nap2", "nap3", "perm", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}
