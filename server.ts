import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for scraping
  app.get("/api/scrape", async (req, res) => {
    const month = req.query.month as string; // Optional: "janvier 2025"
    console.log(`[SCRAPE] Utilisation de l'API directe LONACI pour: ${month || "mois actuel"}`);
    try {
      const now = new Date();
      const monthsChoices = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      
      let monthYear = month;
      if (!monthYear) {
        monthYear = `${monthsChoices[now.getMonth()]} ${now.getFullYear()}`;
      }
      
      // Determine year from monthYear string
      const yearMatch = monthYear.match(/\d{4}/);
      const currentQueryYear = yearMatch ? parseInt(yearMatch[0]) : now.getFullYear();

      const url = `https://lotobonheur.ci/api/results?monthYear=${encodeURIComponent(monthYear)}&drawType=Tous%20les%20tirages`;
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      };

      const response = await axios.get(url, { headers, timeout: 15000 });
      const data = response.data;
      
      const drawsResultsWeekly = data.drawsResultsWeekly || [];
      const draws: any[] = [];

      drawsResultsWeekly.forEach((week: any) => {
        const dailyResults = week.drawResultsDaily || [];
        dailyResults.forEach((day: any) => {
          const dateStr = day.date; // format: "samedi 09/05"
          const dateMatch = dateStr.match(/(\d{2})\/(\d{2})/);
          
          let fullDate = dateStr;
          let sortTimestamp = 0;

          if (dateMatch) {
            const dayNum = parseInt(dateMatch[1]);
            const monthNum = parseInt(dateMatch[2]);
            fullDate = `${dateMatch[1]}/${dateMatch[2]}/${currentQueryYear}`;
            // Simple sortable value: YYYYMMDD
            sortTimestamp = currentQueryYear * 10000 + monthNum * 100 + dayNum;
          }

          const standard = day.drawResults?.standardDraws || [];
          const night = day.drawResults?.nightDraws || [];
          
          [...standard, ...night].forEach((draw: any) => {
            if (draw.drawName && draw.drawName !== "-" && draw.winningNumbers && draw.winningNumbers !== ". - . - . - . - .") {
              const winningStr = String(draw.winningNumbers || "");
              const machineStr = String(draw.machineNumbers || "");
              
              const gagnants = winningStr.split(" - ").map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n));
              const machine = machineStr.split(" - ").map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n));

              if (gagnants.length === 5) {
                // Determine hour/priority for sort_key
                let hourPriority = 0;
                const nameUpper = draw.drawName.toUpperCase();
                const hourMatch = nameUpper.match(/(\d{1,2})\s*H/);

                if (nameUpper.includes("SPECIAL WEEKEND")) {
                  hourPriority = 7; // Before Digital Reveil (08H)
                } else if (hourMatch) {
                  hourPriority = parseInt(hourMatch[1]);
                } else if (nameUpper.includes("NIGHT")) {
                  hourPriority = 22; // Late night
                } else if (nameUpper.includes("REVEIL")) {
                  hourPriority = 8;
                }

                draws.push({
                  date_tirage: fullDate,
                  nom_tirage: draw.drawName,
                  gagnants: gagnants,
                  machine: machine,
                  timestamp: new Date().toISOString(),
                  sort_key: sortTimestamp * 100 + hourPriority
                });
              }
            }
          });
        });
      });

      // Sort by date DESC
      draws.sort((a, b) => b.sort_key - a.sort_key);

      console.log(`[SCRAPE] Synchronisation terminée pour ${monthYear}: ${draws.length} tirages extraits.`);
      res.json({ success: true, count: draws.length, data: draws });
    } catch (error: any) {
      console.error("[SCRAPE] Erreur API:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
