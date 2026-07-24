import React, { useState } from 'react';
import { useTradeSync } from './hooks/useTradeSync';
import { Trade } from './types';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { RegisterModal } from './components/RegisterModal';
import { Settings } from './components/Settings';
import { AIAnalysis } from './components/AIAnalysis';
import { Reports } from './components/Reports';
import { LayoutDashboard, History as HistoryIcon, Plus, Settings as SettingsIcon, Sparkles, FileDown, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { LogoIcon } from './components/Logo';
import { cn } from './lib/utils';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, signIn, signOut } = useAuth();
  const { trades, loading, addTrade, updateTrade, deleteTrade } = useTradeSync();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'ai' | 'reports' | 'settings'>('dashboard');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSaveTrade = async (tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: Math.random().toString(36).substr(2, 9)
    };
    await addTrade(newTrade);
    setIsRegisterOpen(false);
  };

  const handleUpdateTrade = async (updatedTrade: Trade) => {
    await updateTrade(updatedTrade);
  };

  const handleDeleteTrade = async (id: string) => {
    await deleteTrade(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      {/* Background Watermark */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.02] overflow-hidden">
        <LogoIcon className="w-[80vw] h-[80vw] text-slate-900" />
      </div>

      {/* Sidebar / Top Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[100rem] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 sm:p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 shrink-0">
                <LogoIcon className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <span className="font-bold text-lg sm:text-xl text-slate-800 tracking-tight shrink-0">TradeDiary</span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar pl-2">
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
              
              {user ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="hidden xl:flex flex-col items-end mr-2">
                    <span className="text-xs font-medium text-slate-700">{user.displayName}</span>
                    <span className="text-[10px] text-slate-500">{user.email}</span>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                      <UserIcon size={16} />
                    </div>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 flex-shrink-0"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline">Entrar com Google</span>
                </button>
              )}

              <button
                onClick={() => setIsRegisterOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex-shrink-0 ml-1"
              >
                <Plus size={16} />
                <span className="hidden md:inline whitespace-nowrap">Nova Operação</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {loading && user ? (
          <div className="flex items-center justify-center h-64 text-slate-500 gap-2">
            <Sparkles className="animate-spin" size={24} />
            Sincronizando dados...
          </div>
        ) : (
          <>
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
          </>
        )}
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

