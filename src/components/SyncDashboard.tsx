import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Volume2, 
  RefreshCw, 
  Trash2, 
  Terminal, 
  X, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { 
  isOnlineSimulated, 
  setOnlineSimulated, 
  getSyncLogs, 
  clearSyncLogs, 
  syncCloudflareD1ToUserOfflineStorage, 
  SyncLog 
} from '../utils/syncEngine';
import { localDB } from '../utils/db';
import { useLanguage } from '../utils/LanguageContext';

export default function SyncDashboard() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(isOnlineSimulated());
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  
  // Local DB stats
  const [vocabCount, setVocabCount] = useState(0);
  const [audioCount, setAudioCount] = useState(0);
  const [pendingTxns, setPendingTxns] = useState(0);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Sync latest stats and logs
  const updateStats = async () => {
    try {
      const vCount = await localDB.words_and_audio.count();
      setVocabCount(vCount);
      
      const words = await localDB.words_and_audio.toArray();
      const aCount = words.filter(w => w.audio_blob instanceof Blob).length;
      setAudioCount(aCount);
      
      const pCount = await localDB.transactions.where('is_synced').equals(0).count();
      setPendingTxns(pCount);
    } catch (e) {
      console.error("Error reading IndexedDB stats:", e);
    }
  };

  const refreshLogs = () => {
    setLogs(getSyncLogs());
  };

  useEffect(() => {
    updateStats();
    refreshLogs();

    // Listen to custom window events triggered by the sync engine
    const handleConnectivity = () => {
      setIsOnline(isOnlineSimulated());
      refreshLogs();
    };

    const handleLogs = () => {
      refreshLogs();
      updateStats();
    };

    const handleSync = () => {
      updateStats();
    };

    window.addEventListener('sirithai_connectivity_changed', handleConnectivity);
    window.addEventListener('sirithai_sync_logs_updated', handleLogs);
    window.addEventListener('sirithai_db_synced', handleSync);

    return () => {
      window.removeEventListener('sirithai_connectivity_changed', handleConnectivity);
      window.removeEventListener('sirithai_sync_logs_updated', handleLogs);
      window.removeEventListener('sirithai_db_synced', handleSync);
    };
  }, []);

  // Scroll to bottom of terminal when logs change
  useEffect(() => {
    if (isOpen) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const handleToggleOnline = (checked: boolean) => {
    setOnlineSimulated(checked);
  };

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    await syncCloudflareD1ToUserOfflineStorage(true);
    setSyncing(false);
    updateStats();
  };

  const handleClearLogs = () => {
    clearSyncLogs();
  };

  return (
    <>
      {/* Floating Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white font-bold py-3 px-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-teal-400/30"
        id="sync-console-toggle-btn"
      >
        <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
        <span className="text-xs uppercase tracking-wider font-mono">
          {isOpen ? t('sync_status') : 'Sync Engine'}
        </span>
        {pendingTxns > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white animate-pulse">
            {pendingTxns}
          </span>
        )}
      </button>

      {/* Slide-out Glassmorphic Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[420px] max-w-full z-45 bg-gray-950/80 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-500 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-gray-900 to-black">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-teal-400 animate-pulse" />
            <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-teal-300">
              {t('sim_connectivity')}
            </h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Console Controls */}
        <div className="p-5 flex flex-col gap-5 border-b border-white/5">
          {/* Online/Offline Toggle */}
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-200">
                {isOnline ? t('network_online') : t('network_offline')}
              </span>
              <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                {isOnline ? 'Active cloud listeners' : 'IndexedDB offline fallback active'}
              </span>
            </div>
            
            <button
              onClick={() => handleToggleOnline(!isOnline)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isOnline ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isOnline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sync Stats Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-mono">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>DB Rows</span>
              </div>
              <span className="text-lg font-bold font-mono text-cyan-200 mt-1">{vocabCount}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-mono">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audio Blobs</span>
              </div>
              <span className="text-lg font-bold font-mono text-emerald-200 mt-1">{audioCount}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-mono">
                <AlertCircle className={`w-3.5 h-3.5 ${pendingTxns > 0 ? 'text-amber-400 animate-bounce' : 'text-gray-400'}`} />
                <span>Unsynced</span>
              </div>
              <span className={`text-lg font-bold font-mono mt-1 ${pendingTxns > 0 ? 'text-amber-300' : 'text-gray-400'}`}>
                {pendingTxns}
              </span>
            </div>
          </div>

          {/* Synchronize Button Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleManualSync}
              disabled={!isOnline || syncing}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all border ${
                isOnline 
                  ? 'bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border-teal-500/30 active:scale-[0.98]'
                  : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : t('sync_action')}
            </button>

            <button
              onClick={handleClearLogs}
              className="px-3.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/20 rounded-xl transition-all active:scale-[0.98]"
              title="Clear Logs Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Terminal Log Console */}
        <div className="flex-1 flex flex-col min-h-0 bg-black/90 p-4 font-mono text-xs select-none">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-white/10 text-gray-400 uppercase text-[10px]">
            <Terminal className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('sync_logs')}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 italic text-[11px]">
                No sync events logged yet
              </div>
            ) : (
              logs.slice().reverse().map((log, idx) => {
                let colorClass = 'text-gray-300';
                if (log.type === 'success') colorClass = 'text-emerald-400';
                if (log.type === 'warning') colorClass = 'text-amber-400';
                if (log.type === 'error') colorClass = 'text-rose-400';

                return (
                  <div key={idx} className="leading-5 break-words">
                    <span className="text-gray-500 mr-2 text-[10px] select-none">[{log.timestamp}]</span>
                    <span className="text-cyan-400 uppercase text-[10px] mr-1.5 select-none font-semibold">
                      [{log.module}]
                    </span>
                    <span className={colorClass}>{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </>
  );
}
