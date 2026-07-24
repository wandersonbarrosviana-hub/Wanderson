import React, { useState, useEffect } from 'react';
import { getTrades, addTrade, deleteTrade, saveTrades } from './store';
import { Trade } from './types';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { RegisterModal } from './components/RegisterModal';
import { Settings } from './components/Settings';
import { AIAnalysis } from './components/AIAnalysis';
import { Reports } from './components/Reports';
import { LayoutDashboard, History as HistoryIcon, Plus, Settings as SettingsIcon, Sparkles, FileDown } from 'lucide-react';
import { LogoIcon } from './components/Logo';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'ai' | 'reports' | 'settings'>('dashboard');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    setTrades(getTrades());
  }, []);

  const handleSaveTrade = (tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: Math.random().toString(36).substr(2, 9)
    };
    addTrade(newTrade);
    setTrades(getTrades());
    setIsRegisterOpen(false);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    const newTrades = trades.map(t => t.id === updatedTrade.id ? updatedTrade : t);
    saveTrades(newTrades);
    setTrades(newTrades);
  };

  const handleDeleteTrade = (id: string) => {
    deleteTrade(id);
    setTrades(getTrades());
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      {/* Background Watermark */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.02] overflow-hidden">
        <LogoIcon className="w-[80vw] h-[80vw] text-slate-900" />
      </div>

      {/* Sidebar / Top Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                <LogoIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">TradeDiary</span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4">
              <NavButton 
                active={activeTab === 'dashboard'} 
                onClick={() => setActiveTab('dashboard')}
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
              />
              <NavButton 
                active={activeTab === 'history'} 
                onClick={() => setActiveTab('history')}
                icon={<HistoryIcon size={18} />}
                label="Histórico"
              />
              <NavButton 
                active={activeTab === 'ai'} 
                onClick={() => setActiveTab('ai')}
                icon={<Sparkles size={18} />}
                label="Análise IA"
              />
              <NavButton 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')}
                icon={<FileDown size={18} />}
                label="Relatórios"
              />
              <NavButton 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')}
                icon={<SettingsIcon size={18} />}
                label="Configurações"
              />
              <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Operação</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'dashboard' && <Dashboard trades={trades} onUpdate={handleUpdateTrade} />}
        {activeTab === 'history' && (
          <History 
            trades={trades} 
            onDelete={handleDeleteTrade} 
            onUpdate={handleUpdateTrade} 
          />
        )}
        {activeTab === 'ai' && <AIAnalysis trades={trades} />}
        {activeTab === 'reports' && <Reports trades={trades} />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Modals */}
      {isRegisterOpen && (
        <RegisterModal 
          onClose={() => setIsRegisterOpen(false)} 
          onSave={handleSaveTrade} 
        />
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors",
        active 
          ? "bg-slate-100 text-slate-900" 
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

