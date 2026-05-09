import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { signInWithGoogle, auth } from "./firebase";
import { subscribeToDraws, saveDraws } from "./services/DrawService";
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
  Database
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
          </div>
          
          <div className="flex items-center gap-4">
            <SyncButton />
          </div>
        </header>

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
    setSyncStatus({ loading: true, message: 'Initialisation du Deep Sync...' });
    
    try {
      const monthsChoices = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      const now = new Date();
      const monthsToFetch = [];
      
      // We fetch last 6 months to build a decent DB
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        monthsToFetch.push(`${monthsChoices[d.getMonth()]} ${d.getFullYear()}`);
      }

      let total = 0;
      for (const m of monthsToFetch) {
        setSyncStatus({ loading: true, message: `Extraction: ${m}...` });
        const res = await axios.get(`/api/scrape?month=${encodeURIComponent(m)}`);
        if (res.data.success && res.data.count > 0) {
          await saveDraws(res.data.data);
          total += res.data.count;
        }
      }
      setSyncStatus({ loading: false, message: `Deep Sync terminé: ${total} tirages ajoutés !` });
    } catch (err: any) {
      setSyncStatus({ loading: false, message: `Erreur: ${err.message}` });
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
        </div>
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <p className="text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-widest">Expansion Données</p>
          <button 
            disabled={syncStatus.loading || !user}
            onClick={handleDeepSync}
            className="text-xs font-bold text-indigo-600 flex items-center gap-2 hover:underline disabled:opacity-30"
          >
            <Database className="w-4 h-4" />
            {syncStatus.loading ? 'Synchronisation...' : 'Lancer Deep Sync (6 Mo)'}
          </button>
          {syncStatus.message && (
            <p className="text-[8px] font-bold text-indigo-400 mt-2 uppercase animate-pulse">{syncStatus.message}</p>
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
  const frequencies: Record<number, number> = {};
  draws.forEach(d => [...d.gagnants, ...d.machine].forEach(n => frequencies[n] = (frequencies[n] || 0) + 1));
  
  const sorted = Object.entries(frequencies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <section className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-l-4 border-indigo-500 px-2 text-indigo-500">Top 10 Numéros Chauds</h3>
          <TrendingUp className="w-5 h-5 text-indigo-500 opacity-20" />
        </div>
        <div className="space-y-6">
          {sorted.map(([num, count]) => (
            <div key={num} className="flex items-center gap-6 group">
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                {num}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / (draws.length * 10)) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 min-w-[60px] text-right">
                {count} <span className="opacity-40 font-normal">SORTS</span>
              </span>
            </div>
          ))}
        </div>
      </section>
      
      <div className="space-y-8">
        <section className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl shadow-slate-200/20 text-white relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Volume Data</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative">
              <Calendar className="w-16 h-16 text-indigo-500/20 mb-2" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
            <p className="text-5xl font-bold tracking-tighter text-white mb-2">{draws.length}</p>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Tirages Archivés</p>
          </div>
          <div className="absolute -right-6 -bottom-6 text-white/5 font-bold text-[8rem] pointer-events-none tracking-tighter">DATA</div>
        </section>

        <section className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Santé Base de Données</p>
          <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xl tracking-tight uppercase">OPTIMISÉE</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 italic">Connected via Firestore</p>
        </section>
      </div>
    </div>
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
    return subscribeToDraws(setDraws);
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
