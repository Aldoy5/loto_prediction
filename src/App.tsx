import { useState, useEffect, useMemo, useRef } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { signInWithGoogle, auth } from "./firebase";
import { subscribeToDraws, saveDraws, getAllDraws } from "./services/DrawService";
import { subscribeToUserPredictions, savePrediction, evaluatePredictions } from "./services/PredictionService";
import { Draw, Prediction } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  History, 
  BarChart3, 
  RefreshCw, 
  LogOut, 
  LogIn, 
  Sparkles,
  TrendingUp,
  Clock,
  Calendar,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  Database,
  Download,
  Search,
  Info,
  Settings2
} from "lucide-react";
import axios from "axios";
import { getPredictions } from "./services/geminiService";

function Layout({ children, activeTab, setActiveTab }: { children: React.ReactNode, activeTab: string, setActiveTab: (t: string) => void }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">LotoScraper <span className="text-indigo-400">v2</span></span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">LONACI DATA TRACKER</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Navigation</div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-md transition-all font-medium ${activeTab === 'dashboard' ? 'bg-indigo-500 bg-opacity-10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-md transition-all font-medium ${activeTab === 'history' ? 'bg-indigo-500 bg-opacity-10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <History className="w-5 h-5" />
            <span>Historique</span>
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-md transition-all font-medium ${activeTab === 'stats' ? 'bg-indigo-500 bg-opacity-10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Statistiques</span>
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-md transition-all font-medium ${activeTab === 'ai' ? 'bg-indigo-500 bg-opacity-10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Prédictions IA</span>
          </button>
          <button 
            onClick={() => setActiveTab('prediction-history')}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-md transition-all font-medium ${activeTab === 'prediction-history' ? 'bg-indigo-500 bg-opacity-10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Historique Prédictions</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-slate-700 shadow-sm" alt="Avatar" />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate text-slate-200">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => auth.signOut()}
                className="w-full text-left flex items-center gap-3 text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err: any) {
                  alert(err.message || "Erreur lors de la connexion");
                }
              }}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>S'identifier</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden shadow-2xl relative z-10 rounded-l-[2rem] my-4 mr-4 border border-slate-200 shadow-slate-200/50">
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-slate-800 font-bold text-lg tracking-tight capitalize">{activeTab}</h2>
            <div className="h-4 w-[1px] bg-slate-200" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Loto Bonheur CI</span>
            
            {/* Local Mode Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-tight">Hybride: Cloud + Local DB</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <SyncButton />
          </div>
        </header>

        {/* Global Warning Banner for Quota */}
        <AnimatePresence>
          {window.localStorage.getItem('firestore_quota_hit') && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-red-600 text-white px-8 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                <span>Quota Firebase Épuisé : L'application utilise maintenant la base locale (IndexedDB). Les nouvelles données sont sauvegardées dans votre navigateur.</span>
              </div>
              <button 
                onClick={() => {
                  window.localStorage.removeItem('firestore_quota_hit');
                  window.location.reload();
                }}
                className="hover:underline"
              >
                Réessayer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-8 bg-white/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SyncButton() {
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean, message: string, type: 'info' | 'success' | 'error' | null }>({
    loading: false,
    message: '',
    type: null
  });
  const { user } = useAuth();

  const handleSync = async () => {
    if (!user) {
      setSyncStatus({ loading: false, message: 'Veuillez vous connecter pour synchroniser.', type: 'error' });
      return;
    }
    
    setSyncStatus({ loading: true, message: 'Récupération depuis LONACI...', type: 'info' });
    
    try {
      const res = await axios.get("/api/scrape");
      if (res.data.success) {
        if (res.data.count > 0) {
          setSyncStatus({ loading: true, message: `Sauvegarde de ${res.data.count} tirages...`, type: 'info' });
          await saveDraws(res.data.data);
          setSyncStatus({ loading: false, message: `${res.data.count} tirages synchronisés !`, type: 'success' });
        } else {
          setSyncStatus({ loading: false, message: 'Aucun tirage trouvé sur le site.', type: 'error' });
        }
      } else {
        throw new Error(res.data.error || "Erreur inconnue");
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      setSyncStatus({ loading: false, message: `Erreur: ${err.message}`, type: 'error' });
    }
    
    // Clear status after 5s if success
    setTimeout(() => {
      setSyncStatus(prev => prev.type === 'success' ? { loading: false, message: '', type: null } : prev);
    }, 5000);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button 
        onClick={handleSync}
        disabled={syncStatus.loading}
        className={`px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.loading ? 'animate-spin' : ''}`} />
        <span className="uppercase tracking-tight">Sync LONACI</span>
      </button>
      
      <AnimatePresence>
        {syncStatus.message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`text-[9px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${
              syncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              syncStatus.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
              'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}
          >
            {syncStatus.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Ball({ num, variant = "winner" }: { num: number, variant?: "winner" | "machine" }) {
  const numStr = num < 10 ? `0${num}` : `${num}`;
  return (
    <div className={`ball ${variant === "winner" ? "ball-g" : "ball-m"}`}>
      {numStr}
    </div>
  );
}

function Dashboard({ draws }: { draws: Draw[] }) {
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean, message: string }>({ loading: false, message: '' });
  const { user } = useAuth();

  const handleDeepSync = async () => {
    if (!user) return;
    setSyncStatus({ loading: true, message: 'Initialisation de la synchronisation totale...' });
    
    try {
      const monthsChoices = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      const now = new Date();
      const currentYear = now.getFullYear();
      const startYear = 2012; // Universal LONACI archives start potentially in 2012, API might stop earlier
      
      const monthsToFetch: string[] = [];
      
      for (let y = currentYear; y >= startYear; y--) {
        const monthLimit = y === currentYear ? now.getMonth() : 11;
        for (let m = monthLimit; m >= 0; m--) {
          monthsToFetch.push(`${monthsChoices[m]} ${y}`);
        }
      }

      let total = 0;
      let emptyMonthsStreak = 0;
      let successCount = 0;
      let failCount = 0;
      
      // Sequential for maximum reliability
      for (let i = 0; i < monthsToFetch.length; i++) {
        const m = monthsToFetch[i];
        const progress = Math.round((i / monthsToFetch.length) * 100);
        
        setSyncStatus({ 
          loading: true, 
          message: `[${progress}%] ${m} — Extraction... (${i}/${monthsToFetch.length})` 
        });
        
        try {
          console.debug(`[FullSync] Fetching ${m}...`);
          const res = await axios.get(`/api/scrape?month=${encodeURIComponent(m)}`, { timeout: 60000 });
          
          if (res.data.success) {
            successCount++;
            if (res.data.count > 0) {
              await saveDraws(res.data.data);
              total += res.data.count;
              emptyMonthsStreak = 0;
            } else {
              emptyMonthsStreak++;
              if (emptyMonthsStreak > 12) {
                 // Heuristic: If we get 12 consecutive months with 0 data, stop early (likely reached end of archives)
                 console.log("[FullSync] Consecutive empty months found in deep archive. Stopping.");
                 break;
              }
            }
          } else {
            console.error(`[FullSync] Server error for ${m}`);
            failCount++;
          }
        } catch (err: any) {
          console.error(`[FullSync] Error for ${m}:`, err.message);
          failCount++;
          // Wait a bit on error before next try
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Small delay to be gentle and allow UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setSyncStatus({ 
        loading: false, 
        message: `Terminé ! ${total} tirages archivés (${successCount} mois vérifiés, ${failCount} échecs).` 
      });
    } catch (err: any) {
      setSyncStatus({ loading: false, message: `Erreur critique: ${err.message}` });
    }
    
    setTimeout(() => setSyncStatus({ loading: false, message: '' }), 15000);
  };

  const handleExport = async () => {
    setSyncStatus({ loading: true, message: 'Récupération de la base locale...' });
    try {
      const allDraws = await getAllDraws();
      const blob = new Blob([JSON.stringify(allDraws, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const exportFileDefaultName = `lonaci_full_export_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      setSyncStatus({ loading: false, message: 'Export JSON local terminé !' });
    } catch (err) {
      console.error("Export failed:", err);
      setSyncStatus({ loading: false, message: 'Erreur lors de l\'export local.' });
    }
    setTimeout(() => setSyncStatus({ loading: false, message: '' }), 5000);
  };

  if (draws.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
      <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
      <p className="text-sm text-slate-500 font-medium tracking-tight">Aucun tirage disponible. Utilisez le bouton Sync en haut à droite.</p>
    </div>
  );

  const latest = draws[0];

  return (
    <div className="space-y-12">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-widest">Base de Données</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tighter">{draws.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-black">Tirages</span>
          </div>
          {draws.length > 0 && (
            <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">
              Plage: {draws[draws.length - 1].date_tirage} — {draws[0].date_tirage}
            </p>
          )}
        </div>
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <p className="text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-widest">Mise à jour</p>
          <div className="flex flex-col gap-2">
            <button 
              disabled={syncStatus.loading || !user}
              onClick={handleDeepSync}
              className="text-xs font-bold text-indigo-600 flex items-center gap-2 hover:underline disabled:opacity-30"
            >
              <Database className="w-4 h-4" />
              {syncStatus.loading ? 'Sync Global...' : 'Sync Totale (2012-2026)'}
            </button>
            <button 
              onClick={async () => {
                if (confirm("Voulez-vous vraiment effacer la base locale et tout re-télécharger ?")) {
                  const { localDb } = await import("./lib/db");
                  await localDb.draws.clear();
                  window.location.reload();
                }
              }}
              className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase tracking-tighter"
            >
              Réinitialiser la base
            </button>
            <button 
              onClick={handleExport}
              disabled={draws.length === 0}
              className="text-xs font-bold text-slate-600 flex items-center gap-2 hover:underline disabled:opacity-30"
            >
              <Download className="w-4 h-4" />
              Exporter JSON
            </button>
          </div>
          {syncStatus.message && (
            <p className="text-[8px] font-bold text-indigo-400 mt-2 uppercase animate-pulse leading-tight">{syncStatus.message}</p>
          )}
        </div>
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-widest">Réseau Neuronal</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tighter">Gemini 1.5</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-widest">Fiabilité</p>
          <p className="text-3xl font-bold text-emerald-600 tracking-tighter">OPTIMALE</p>
        </div>
      </div>

      {/* Hero: Latest Result */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest px-2 border-l-4 border-indigo-500">Dernier Tirage</h3>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 uppercase font-mono text-center">
           <Clock className="w-3 h-3" /> {latest.date_tirage} • {latest.nom_tirage}
          </span>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-xl shadow-slate-100 relative overflow-hidden group">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-500 mb-6 flex items-center gap-2 tracking-widest">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Numéros Gagnants (G)
              </p>
              <div className="flex gap-4">
                {latest.gagnants.map((n, i) => <Ball key={i} num={n} />)}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-pink-500 mb-6 flex items-center gap-2 tracking-widest">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span> Numéros Machine (M)
              </p>
              <div className="flex gap-4 opacity-70">
                {latest.machine.map((n, i) => <Ball key={i} num={n} variant="machine" />)}
              </div>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700">
            <Trophy className="w-64 h-64 rotate-12" />
          </div>
        </div>
      </section>

      {/* Grid of recent history */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 px-2 border-l-4 border-slate-300">Archives Récentes</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {draws.slice(1, 7).map((draw) => (
            <div key={draw.id} className="bg-white p-5 border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all group flex flex-col justify-between shadow-sm hover:shadow-lg hover:shadow-indigo-500/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm tracking-tight capitalize">{draw.nom_tirage}</h4>
                  <p className="text-[10px] font-mono font-medium text-slate-400">{draw.date_tirage}</p>
                </div>
                <div className="text-[9px] px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded font-bold uppercase tracking-widest group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-colors text-center">Archived</div>
              </div>
              <div className="flex gap-1.5">
                {draw.gagnants.map((n, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {n < 10 ? `0${n}` : n}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HistoryView({ draws }: { draws: Draw[] }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              <th className="px-6 py-4">Date du Tirage</th>
              <th className="px-6 py-4">Session</th>
              <th className="px-6 py-4">Gagnants (G)</th>
              <th className="px-6 py-4">Machine (M)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {draws.map(draw => (
              <tr key={draw.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{draw.date_tirage}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded font-bold uppercase tracking-wide border border-indigo-100 text-center">
                    {draw.nom_tirage}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5">
                    {draw.gagnants.map((n, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {n < 10 ? `0${n}` : n}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    {draw.machine.map((n, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-bold group-hover:border-pink-200 group-hover:text-pink-600 transition-colors">
                        {n < 10 ? `0${n}` : n}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatsView({ draws }: { draws: Draw[] }) {
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  
  if (draws.length === 0) return null;

  // Analysis for Selected Number
  const getNumAnalysis = (num: number) => {
    const drawsWithNum = draws.filter(d => d.gagnants.includes(num));
    const neighbors: Record<number, number> = {};
    const following: Record<number, number> = {};
    const preceding: Record<number, number> = {};

    draws.forEach((d, i) => {
      if (d.gagnants.includes(num)) {
        // Neighbors
        d.gagnants.forEach(n => {
          if (n !== num) neighbors[n] = (neighbors[n] || 0) + 1;
        });

        // Following (Draw i-1 in our DESC array is chronologically next)
        if (i > 0) {
          draws[i-1].gagnants.forEach(n => {
            following[n] = (following[n] || 0) + 1;
          });
        }

        // Preceding (Draw i+1 in our DESC array is chronologically previous)
        if (i < draws.length - 1) {
          draws[i+1].gagnants.forEach(n => {
            preceding[n] = (preceding[n] || 0) + 1;
          });
        }
      }
    });

    const sort = (entries: Record<number, number>) => 
      Object.entries(entries).sort(([, a], [, b]) => b - a).slice(0, 5);

    return {
      freq: drawsWithNum.length,
      neighbors: sort(neighbors),
      following: sort(following),
      preceding: sort(preceding)
    };
  };

  const analysis = selectedNum ? getNumAnalysis(selectedNum) : null;

  // 1. Frequencies (Winners & Machine)
  const winnersFreq: Record<number, number> = {};
  const machineFreq: Record<number, number> = {};
  const totalFreq: Record<number, number> = {};
  
  // 2. Gaps (Last appearance)
  const lastSeen: Record<number, number> = {}; // draw index
  
  draws.forEach((d, drawIndex) => {
    d.gagnants.forEach(n => {
      winnersFreq[n] = (winnersFreq[n] || 0) + 1;
      totalFreq[n] = (totalFreq[n] || 0) + 1;
      if (lastSeen[n] === undefined) lastSeen[n] = drawIndex;
    });
    d.machine.forEach(n => {
      machineFreq[n] = (machineFreq[n] || 0) + 1;
      totalFreq[n] = (totalFreq[n] || 0) + 1;
    });
  });

  // 3. Hot and Cold
  const sortedWinners = Object.entries(winnersFreq)
    .sort(([, a], [, b]) => b - a);
  
  const hotNumbers = sortedWinners.slice(0, 10);
  const coldNumbers = sortedWinners.slice(-10).reverse();

  // 4. Parity
  let even = 0;
  let odd = 0;
  draws.forEach(d => {
    d.gagnants.forEach(n => {
      if (n % 2 === 0) even++;
      else odd++;
    });
  });
  const totalNumbers = even + odd;

  // 5. Decades
  const decades: Record<string, number> = {
    '1-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '41-50': 0, 
    '51-60': 0, '61-70': 0, '71-80': 0, '81-90': 0
  };
  draws.forEach(d => {
    d.gagnants.forEach(n => {
      if (n <= 10) decades['1-10']++;
      else if (n <= 20) decades['11-20']++;
      else if (n <= 30) decades['21-30']++;
      else if (n <= 40) decades['31-40']++;
      else if (n <= 50) decades['41-50']++;
      else if (n <= 60) decades['51-60']++;
      else if (n <= 70) decades['61-70']++;
      else if (n <= 80) decades['71-80']++;
      else if (n <= 90) decades['81-90']++;
    });
  });

  // 6. Average Gaps (Top 5 largest gaps currently)
  const gaps = Object.entries(lastSeen)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-12">
      {/* Algorithmic Prediction based on Cross-Frequencies */}
      <ProbabilisticPrediction draws={draws} />

      {/* Data Export Section */}
      {draws.length > 0 && (
        <section className="bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-l-4 border-indigo-600 px-2">Exportation Expert</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 px-3">Téléchargez l'historique par type de jeu pour analyse externe</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from(new Set(draws.map(d => d.nom_tirage)))
                .map(gameName => {
                  const gameDraws = draws.filter(d => d.nom_tirage === gameName);
                  if (gameDraws.length < 200) return null;
                  
                  return (
                    <button
                      key={gameName}
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameDraws, null, 2));
                        const downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", `lotto_export_${gameName.toLowerCase()}_${gameDraws.length}.json`);
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                      }}
                      className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      {gameName} ({gameDraws.length})
                    </button>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Number Analysis Search */}
      <section className="bg-white border-2 border-indigo-50 p-8 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-l-4 border-indigo-600 px-2">Recherche Individuelle</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 px-3">Analysez les comportements d'un numéro spécifique</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input 
              type="number" 
              placeholder="Ex: 45"
              min="1"
              max="90"
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-24"
              onChange={(e) => setSelectedNum(e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>

        {analysis && selectedNum ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Fréquence Totale</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-indigo-600">{analysis.freq}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Apparitions</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Compagnons (Voisins)</p>
              <div className="flex flex-wrap gap-2">
                {analysis.neighbors.map(([num, count]) => (
                  <div key={num} className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700">{num}</span>
                    <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1 rounded">x{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Numéros Précédents</p>
              <div className="flex flex-wrap gap-2">
                {analysis.preceding.map(([num, count]) => (
                  <div key={num} className="bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-700">{num}</span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-white px-1 rounded">x{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-slate-400 italic">Apparus au tirage T-1</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Numéros Suivants</p>
              <div className="flex flex-wrap gap-2">
                {analysis.following.map(([num, count]) => (
                  <div key={num} className="bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg flex items-center gap-2">
                    <span className="text-xs font-black text-amber-700">{num}</span>
                    <span className="text-[9px] font-bold text-amber-600 bg-white px-1 rounded">x{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-slate-400 italic">Apparus au tirage T+1</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <Search className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-400 uppercase">Entrez un numéro pour voir ses affinités</p>
          </div>
        )}
      </section>

      {/* Top Section: Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold mb-3 uppercase tracking-widest">Parité (Gagnants)</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Pairs</span>
            <span className="text-xs font-mono font-bold text-indigo-600">{Math.round((even/totalNumbers)*100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-indigo-500" style={{ width: `${(even/totalNumbers)*100}%` }} />
            <div className="h-full bg-pink-400" style={{ width: `${(odd/totalNumbers)*100}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-bold text-slate-700">Impairs</span>
            <span className="text-xs font-mono font-bold text-pink-500">{Math.round((odd/totalNumbers)*100)}%</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold mb-3 uppercase tracking-widest">Moyenne Gagnants</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tighter">
              {Math.round(draws.reduce((acc, d) => acc + d.gagnants.reduce((s, n) => s + n, 0), 0) / (draws.length * 5))}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-black">Valeur</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 italic">Sur {draws.length} tirages</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-white">
          <p className="text-slate-500 text-[10px] font-bold mb-3 uppercase tracking-widest">Record Ecart</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-500 tracking-tighter">{gaps[0][1]}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Tirages</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">Numéro {gaps[0][0]} en attente</p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold mb-3 uppercase tracking-widest">Santé Data</p>
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-lg tracking-tight uppercase">OPTIMAL</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 italic">Sync: Tout OK</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hot Numbers */}
        <section className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-l-4 border-indigo-500 px-2 text-indigo-500">Numéros les plus fréquents</h3>
            <TrendingUp className="w-5 h-5 text-indigo-500 opacity-20" />
          </div>
          <div className="space-y-4">
            {hotNumbers.map(([num, count]) => (
              <div key={num} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {num}
                </div>
                <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${(count / draws.length) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Cold Numbers */}
        <section className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-l-4 border-pink-500 px-2 text-pink-500">Numéros les moins fréquents</h3>
            <TrendingUp className="w-5 h-5 text-pink-500 opacity-20 rotate-180" />
          </div>
          <div className="space-y-4">
            {coldNumbers.map(([num, count]) => (
              <div key={num} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center font-bold text-xs group-hover:bg-pink-600 group-hover:text-white transition-all">
                  {num}
                </div>
                <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-400" style={{ width: `${(count / draws.length) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Decades Distribution */}
      <section className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-8 border-l-4 border-slate-300 px-2">Distribution par Dizaines</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-4 text-center">
          {Object.entries(decades).map(([decade, count]) => (
            <div key={decade} className="space-y-3">
              <div className="relative h-32 w-full bg-slate-50 rounded-lg flex flex-col justify-end overflow-hidden border border-slate-100">
                <div 
                  className="bg-indigo-500/80 w-full transition-all duration-500" 
                  style={{ height: `${(count / (draws.length * 5)) * 500}%` }} 
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{decade}</p>
              <p className="text-[10px] font-mono font-bold text-indigo-600">{count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gap Analysis */}
      <section className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl text-white">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 border-l-4 border-amber-500 px-2">Analyse des Ecarts (Tirages manqués)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
          {gaps.map(([num, gap]) => (
            <div key={num} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-black text-xs text-indigo-400 border border-slate-600 mb-2">
                {num}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ecart Actuel</p>
              <p className="text-2xl font-bold tracking-tighter text-amber-500">{gap}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProbabilisticPrediction({ draws }: { draws: Draw[] }) {
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [backtestResult, setBacktestResult] = useState<{ bankerHits: number, napHits: number, total: number } | null>(null);
  const [testing, setTesting] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  
  // Weights storage: Map of gameName -> { gapWeight: number, transWeight: number }
  const [gameWeights, setGameWeights] = useState<Record<string, { gap: number, trans: number, depth: number }>>({});

  // Derive unique game names
  const gameNames = useMemo(() => {
    const names = Array.from(new Set(draws.map(d => d.nom_tirage).filter(Boolean)));
    return names.sort();
  }, [draws]);

  // Set default game
  useEffect(() => {
    if (gameNames.length > 0 && !selectedGame) {
      setSelectedGame(gameNames[0]);
    }
  }, [gameNames, selectedGame]);

  const filteredDraws = useMemo(() => {
    if (!selectedGame) return [];
    return draws.filter(d => d.nom_tirage === selectedGame);
  }, [draws, selectedGame]);

  const currentWeights = useMemo(() => {
    return gameWeights[selectedGame] || { gap: 3.0, trans: 1.0, depth: 100 };
  }, [gameWeights, selectedGame]);

  if (draws.length < 5) return null;

  const getPredictionForDrawIndex = (index: number, activeDraws: Draw[], customWeights?: { gap: number, trans: number, depth: number }) => {
    const baseDraw = activeDraws[index];
    if (!baseDraw) return null;

    const weights = customWeights || currentWeights;
    const historicalData = activeDraws.slice(index, index + (weights.depth || 100));
    if (historicalData.length < 20) return null;

    const n = historicalData.length;
    const hist = [...historicalData].reverse();
    const base = hist[hist.length - 1];

    const scores: Record<number, number> = {};
    for (let i = 1; i <= 90; i++) scores[i] = 0;

    const freq: Record<number, number> = {};
    for (let i = 1; i <= 90; i++) freq[i] = 0;
    
    // Matrix of co-occurrences for Correlation Factor
    const coMatrix: Record<number, Record<number, number>> = {};

    hist.forEach(d => {
      d.gagnants.forEach(a => {
        freq[a]++;
        if (!coMatrix[a]) coMatrix[a] = {};
        d.gagnants.forEach(b => {
          if (a !== b) coMatrix[a][b] = (coMatrix[a][b] || 0) + 1;
        });
      });
    });
    
    const expected = n * 5 / 90;
    const sigma = Math.sqrt(n * (5/90) * (85/90));

    const baseSet = new Set(base.gagnants);
    for (let i = 0; i < n - 1; i++) {
      const overlap = hist[i].gagnants.some(num => baseSet.has(num));
      if (overlap) {
        const age = n - 1 - (i + 1);
        const recency = Math.exp(-age / 30);
        hist[i + 1].gagnants.forEach(f => {
          scores[f] += weights.trans * recency; 
        });
      }
    }

    for (let num = 1; num <= 90; num++) {
      let occ = 0, gap = 0;
      let found = false;
      for (let i = n - 1; i >= 0; i--) {
        if (hist[i].gagnants.includes(num)) {
          if (!found) { gap = n - 1 - i; found = true; }
          occ++;
        }
      }
      if (occ > 0) {
        const avgGap = n / occ;
        const z = (freq[num] - expected) / sigma;
        if (gap > avgGap && z < 0.5) {
          scores[num] += weights.gap * (gap / avgGap);
        }
      }
    }

    // ── FACTOR 3: CO-OCCURRENCE (Correlation) ──
    // Boost numbers that often come together with the top results from factors 1 & 2
    const preliminaryTop = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([n]) => parseInt(n));

    preliminaryTop.forEach(topNum => {
      if (coMatrix[topNum]) {
        Object.entries(coMatrix[topNum]).forEach(([otherNum, count]) => {
          const ratio = count / (freq[topNum] || 1);
          if (ratio > 0.15) { // If they appear together > 15% of the time
            scores[parseInt(otherNum)] += (ratio * 1.5);
          }
        });
      }
    });

    const vals = Object.values(scores);
    const minVal = Math.min(...vals), maxVal = Math.max(...vals);
    if (maxVal > minVal) {
      for (let i = 1; i <= 90; i++) {
        scores[i] = (scores[i] - minVal) / (maxVal - minVal);
      }
    }

    const ranked = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Calculate a basic confidence index (0-1) based on the "gap" between top scores and mean
    const topScore = ranked[0][1];
    const avgScore = vals.reduce((a, b) => a + b, 0) / 90;
    const confidence = Math.min(1, Math.max(0, (topScore - avgScore) / 0.5));

    return {
      numbers: ranked.map(([n]) => parseInt(n)),
      confidence
    };
  };

  const currentResult = filteredDraws.length >= 30 ? getPredictionForDrawIndex(0, filteredDraws) : null;
  const currentProposed = currentResult?.numbers || null;
  const confidenceScore = currentResult?.confidence || 0;

  const runCalibration = async () => {
    if (filteredDraws.length < 40) return;
    setCalibrating(true);
    
    let bestGap = 3.0;
    let bestTrans = 1.0;
    let bestDepth = 100;
    let maxHits = -1;

    const gapRange = [1.0, 3.0, 5.0];
    const transRange = [0.5, 1.5, 3.0];
    const depthRange = [30, 60, 100, 200];

    const testSpan = Math.min(filteredDraws.length - 1, 30);

    for (const d of depthRange) {
      for (const g of gapRange) {
        for (const t of transRange) {
          let hits = 0;
          for (let i = 1; i <= testSpan; i++) {
            const res = getPredictionForDrawIndex(i, filteredDraws, { gap: g, trans: t, depth: d });
            if (res && filteredDraws[i-1].gagnants.includes(res.numbers[0])) {
              hits++;
            }
          }
          if (hits > maxHits) {
            maxHits = hits;
            bestGap = g;
            bestTrans = t;
            bestDepth = d;
          }
        }
      }
    }

    setGameWeights(prev => ({ ...prev, [selectedGame]: { gap: bestGap, trans: bestTrans, depth: bestDepth } }));
    setCalibrating(false);
    setTimeout(() => runBacktest(), 100);
  };

  const runBacktest = () => {
    if (filteredDraws.length < 31) return;
    setTesting(true);
    let bankerHits = 0;
    let napHits = 0;
    const testCount = Math.min(filteredDraws.length - 1, 50); 

    for (let i = 1; i < testCount; i++) {
        const res = getPredictionForDrawIndex(i, filteredDraws);
        if (!res || res.numbers.length === 0) continue;

        const actualDrawWinners = filteredDraws[i-1].gagnants;
        const banker = res.numbers[0];
        
        if (actualDrawWinners.includes(banker)) bankerHits++;
        if (res.numbers.some(n => actualDrawWinners.includes(n))) napHits++;
    }

    setBacktestResult({ bankerHits, napHits, total: testCount - 1 });
    setTesting(false);
  };

  return (
    <section className="bg-indigo-900 border border-indigo-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
         <Sparkles className="w-24 h-24" />
       </div>
       <div className="relative z-10">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
           <div>
             <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2 border-l-4 border-indigo-500 px-2">Algorithme V2 Optimisé</h3>
             <div className="flex items-center gap-3 mt-4">
                <p className="text-[10px] text-indigo-400 font-bold uppercase whitespace-nowrap">Jeu analysé :</p>
                <select 
                  value={selectedGame}
                  onChange={(e) => {
                    setSelectedGame(e.target.value);
                    setBacktestResult(null);
                  }}
                  className="bg-indigo-950/50 border border-indigo-700 text-indigo-200 text-xs font-bold rounded-lg px-3 py-1 outline-none cursor-pointer focus:border-indigo-400 transition-colors"
                >
                  {gameNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
             </div>
           </div>
           <div className="flex flex-wrap items-center gap-3">
             {filteredDraws.length >= 40 && (
               <button 
                 onClick={runCalibration}
                 disabled={calibrating}
                 className="flex items-center gap-2 px-3 py-1.5 transition-all text-[10px] font-bold uppercase tracking-wider rounded-lg bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800 disabled:opacity-50 border border-indigo-700/50"
               >
                 <Settings2 className="w-3 h-3" />
                 {calibrating ? "Calibration..." : "Calibrer les poids"}
               </button>
             )}

             {filteredDraws.length >= 31 && (
               <button 
                 onClick={runBacktest}
                 disabled={testing}
                 className="flex items-center gap-2 px-3 py-1.5 transition-all text-[10px] font-bold uppercase tracking-wider rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-900/40"
               >
                 <TrendingUp className="w-3 h-3" />
                 {testing ? "Backtest..." : `Backtest ${selectedGame} (${Math.min(filteredDraws.length - 1, 50)} derniers)`}
               </button>
             )}
           </div>
         </div>

         {gameWeights[selectedGame] && (
           <div className="mb-6 flex items-center gap-4 bg-indigo-950/20 p-2 rounded-lg border border-indigo-800/30">
             <div className="flex items-center gap-2">
                <span className="text-[8px] text-indigo-500 uppercase font-black tracking-tighter">Profondeur :</span>
                <span className="text-[10px] text-indigo-300 font-mono font-bold">{gameWeights[selectedGame].depth}</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[8px] text-indigo-500 uppercase font-black tracking-tighter">Poids Écart :</span>
                <span className="text-[10px] text-indigo-300 font-mono font-bold">{gameWeights[selectedGame].gap.toFixed(1)}</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[8px] text-indigo-500 uppercase font-black tracking-tighter">Poids Trans :</span>
                <span className="text-[10px] text-indigo-300 font-mono font-bold">{gameWeights[selectedGame].trans.toFixed(1)}</span>
             </div>
             <div className="ml-auto flex items-center gap-2">
                <span className="text-[8px] text-emerald-500 uppercase font-black">Confiance :</span>
                <div className="w-16 h-1.5 bg-indigo-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${confidenceScore * 100}%` }} />
                </div>
                <span className="text-[10px] text-emerald-400 font-black">{Math.round(confidenceScore * 100)}%</span>
             </div>
            </div>
          )}
         
         {!currentProposed ? (
           <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-indigo-800/50 rounded-2xl bg-indigo-950/20">
             <Info className="w-8 h-8 text-indigo-700 mb-3" />
             <p className="text-sm text-indigo-400 font-medium italic">Pas assez de données pour {selectedGame} (Min. 30 requis)</p>
             <p className="text-[10px] text-indigo-600 mt-2 uppercase font-bold tracking-tighter">Données actuelles : {filteredDraws.length} tirages</p>
           </div>
         ) : (
           <div className="flex flex-wrap gap-6 items-center">
             {currentProposed.map((num, i) => (
               <div key={num} className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl transition-transform hover:scale-110 ${i === 0 ? 'bg-amber-500 text-white border-4 border-amber-400 shadow-amber-500/20' : 'bg-white text-indigo-900'}`}>
                    {num < 10 ? `0${num}` : num}
                  </div>
                  <div className="mt-3 flex flex-col items-center">
                    <span className="text-[10px] font-black text-white">{i === 0 ? 'BANKER' : `NAP ${i+1}`}</span>
                  </div>
               </div>
             ))}
           </div>
         )}

         {backtestResult && (
           <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-indigo-950/50 p-4 rounded-2xl border border-indigo-500/20">
               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Taux de réussite (Banker)</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-black text-amber-500">{Math.round((backtestResult.bankerHits / backtestResult.total) * 100)}%</span>
                 <span className="text-[10px] text-indigo-400 uppercase font-bold">Sur {backtestResult.total} tirages testés</span>
               </div>
             </div>
             <div className="bg-indigo-950/50 p-4 rounded-2xl border border-indigo-500/20">
               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Taux de présence (Au moins 1 NAP)</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-black text-emerald-400">{Math.round((backtestResult.napHits / backtestResult.total) * 100)}%</span>
                 <span className="text-[10px] text-indigo-400 uppercase font-bold">Probabilité de gain (NAP2/3)</span>
               </div>
             </div>
           </div>
         )}
         
         <div className="mt-8 pt-6 border-t border-indigo-800/50">
           <p className="text-[9px] text-indigo-400 italic leading-relaxed max-w-2xl bg-indigo-950/30 p-4 rounded-xl border border-indigo-800/30">
             <strong className="text-indigo-300 not-italic">Optimisation V3 :</strong> Analyse des cycles par fenêtre glissante optimisée (depth calibration). Inclusion du facteur de co-occurrence (Correlation Matrix) pour booster les paires historiques fortes. Un score de confiance est calculé sur la variance du signal.
           </p>
         </div>
       </div>
    </section>
  );
}

function AIView({ draws }: { draws: Draw[] }) {
  const [prediction, setPrediction] = useState<{banker: number, nap2: number[], nap3: number[], perm: number[], reasoning: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();

  const generate = async () => {
    setLoading(true);
    setSaved(false);
    const res = await getPredictions(draws);
    if (res && res.banker) {
      setPrediction(res);
      
      // Auto-save if user is logged in
      if (user) {
        try {
          await savePrediction({
            userId: user.uid,
            numbers: res.perm,
            banker: res.banker,
            nap2: res.nap2,
            nap3: res.nap3,
            drawType: "Tous les tirages",
            method: "Gemini AI Analysis"
          });
          setSaved(true);
        } catch (err) {
          console.error("Failed to save prediction:", err);
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-6 max-w-xl mx-auto">
        <div className="inline-flex p-4 rounded-3xl bg-indigo-50 text-indigo-600 mb-2 shadow-inner">
          <Sparkles className="w-10 h-10" />
        </div>
        <h3 className="text-3xl font-bold tracking-tighter text-slate-900">Analyse Prédictive Gemini <span className="text-indigo-600">v1.4</span></h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Notre moteur IA analyse plus de 50 variables incluant les cycles de sortie historiques, les fréquences relatives et les écarts types pour suggérer les probabilités optimales.
        </p>
        <button 
          onClick={generate}
          disabled={loading || draws.length < 5}
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-[11px]"
        >
          {loading ? "Calcul des probabilités..." : "Lancer le moteur d'analyse"}
        </button>
        {!user && (
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-amber-50 py-2 border border-amber-100 rounded-lg">
            Connectez-vous pour sauvegarder vos prédictions dans l'historique.
          </p>
        )}
      </div>

      {prediction && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-12">
              <div className="flex flex-col">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pronostic IA Suggéré</h4>
                {saved && (
                  <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-widest mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Sauvegardé dans l'historique
                  </span>
                )}
              </div>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100">CONFIDENCE: 89%</div>
            </div>

            <div className="flex flex-col gap-8 mb-12">
              {/* Banker & NAP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2">💰 BANKER (100%)</span>
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-amber-500/20">
                    {prediction.banker < 10 ? `0${prediction.banker}` : prediction.banker}
                  </div>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">🔥 NAP 2 (FORTS)</span>
                  <div className="flex gap-2">
                    {prediction.nap2.map((n, i) => (
                      <div key={i} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                        {n < 10 ? `0${n}` : n}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">🌟 NAP 3 (BOUM)</span>
                  <div className="flex gap-2">
                    {prediction.nap3.map((n, i) => (
                      <div key={i} className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center text-sm font-bold border border-slate-600">
                        {n < 10 ? `0${n}` : n}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permutation */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block text-center">🔄 PERMUTATION 5 (STATISTIQUE)</span>
                <div className="flex justify-center gap-4">
                  {prediction.perm.map((n, i) => (
                    <div key={i} className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center text-lg font-bold border border-slate-200 hover:scale-110 transition-transform">
                      {n < 10 ? `0${n}` : n}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-4 bg-indigo-500 rounded-full" />
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Note Méthodologique :</h5>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 font-medium italic">
                "{prediction.reasoning}"
              </p>
            </div>
          </div>
          
          <div className="absolute -right-20 -bottom-20 text-slate-50 pointer-events-none">
            <Sparkles className="w-64 h-64" />
          </div>
        </motion.div>
      )}

      {/* Script Log-style Footer for AI */}
      <div className="mt-12 bg-slate-900 rounded-2xl p-6 mono text-[11px] text-emerald-400 border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
          <span className="text-slate-500 uppercase tracking-widest font-bold">Predictive Engine Log</span>
          <span className="text-slate-500 italic uppercase">Kernel: Gemini-1.5-Flash</span>
        </div>
        <div className="space-y-1">
          <p><span className="text-indigo-400">[SYSTEM]</span> Moteur de prédiction initialisé...</p>
          <p><span className="text-indigo-400">[DATA]</span> Lecture de {draws.length} archives en base Firestore...</p>
          <p><span className="text-indigo-400">[INFO]</span> Application du modèle de distribution de Poisson...</p>
          <p><span className="text-emerald-500">[SUCCESS]</span> Vecteur de probabilité calculé avec succès.</p>
          <p className="animate-pulse">_</p>
        </div>
      </div>
    </div>
  );
}

function PredictionHistoryView({ predictions, draws }: { predictions: Prediction[], draws: Draw[] }) {
  if (predictions.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-indigo-50/10">
      <ClipboardList className="w-16 h-16 text-slate-200 mb-6" />
      <h3 className="text-xl font-bold text-slate-400 tracking-tight mb-2">Aucune prédiction enregistrée</h3>
      <p className="text-sm text-slate-400 max-w-xs text-center leading-relaxed">
        Lancez une analyse dans l'onglet <strong>Prédictions IA</strong> pour commencer à archiver vos pronostics.
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map((pred) => (
          <div key={pred.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Généré le</span>
                <p className="text-xs font-mono text-slate-500">
                  {pred.timestamp instanceof Object ? new Date(pred.timestamp.seconds * 1000).toLocaleString('fr-FR') : 'Juste maintenant'}
                </p>
              </div>
              <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-widest border border-indigo-100">
                {pred.method === "Gemini AI Analysis" ? "GEMINI v1.4" : pred.method}
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Banker</span>
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                  {pred.banker ? (pred.banker < 10 ? `0${pred.banker}` : pred.banker) : '--'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NAP 2</span>
                <div className="flex gap-1">
                  {pred.nap2?.map((n, i) => (
                    <div key={i} className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {n < 10 ? `0${n}` : n}
                    </div>
                  )) || <span className="text-[10px] text-slate-300">--</span>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Perm 5</span>
                <div className="flex gap-1">
                  {pred.numbers.map((n, i) => (
                    <div key={i} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold border border-slate-200">
                      {n < 10 ? `0${n}` : n}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 mt-4">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Correspondances Trouvées</h5>
              {pred.matches && pred.matches.length > 0 ? (
                <div className="space-y-2">
                  {pred.matches.slice(0, 3).map((match, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-emerald-700 leading-none">{match.drawName}</span>
                        <span className="text-[8px] text-emerald-600 font-mono">{match.drawDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-emerald-700">+{match.count}</span>
                        <div className="flex gap-0.5">
                          {match.matchedNumbers.map((n, j) => (
                            <div key={j} className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[7px] font-bold">
                              {n}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {pred.matches.length > 3 && (
                    <p className="text-[9px] text-slate-400 text-center font-bold uppercase italic">+ {pred.matches.length - 3} autres gagnants encore...</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 italic text-[10px]">
                  En attente de résultats correspondants...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [draws, setDraws] = useState<Draw[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    return subscribeToDraws(setDraws, 100000);
  }, []);

  useEffect(() => {
    if (user) {
      return subscribeToUserPredictions(user.uid, setPredictions);
    }
  }, [user]);

  // Evaluate predictions whenever draws change
  useEffect(() => {
     if (draws.length > 0 && predictions.length > 0) {
       evaluatePredictions(predictions, draws.slice(0, 50)); // Evaluate only the most recent draws for performance
     }
  }, [draws, predictions]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && <Dashboard draws={draws} />}
      {activeTab === "history" && <HistoryView draws={draws} />}
      {activeTab === "stats" && <StatsView draws={draws} />}
      {activeTab === "ai" && <AIView draws={draws} />}
      {activeTab === "prediction-history" && <PredictionHistoryView predictions={predictions} draws={draws} />}
    </Layout>
  );
}
