import React, { useState, useEffect } from 'react';
import { useTradeSync } from '../hooks/useTradeSync';
import { AppSettings, Account } from '../types';
import { Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';

export function Settings() {
  const { settings: syncedSettings, updateSettings } = useTradeSync();
  const [settings, setSettings] = useState<AppSettings>(syncedSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(syncedSettings);
  }, [syncedSettings]);

  const handleAddAccount = () => {
    const newAccount: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Nova Conta ${settings.accounts.length + 1}`,
      initialBalance: 0
    };
    setSettings({
      ...settings,
      accounts: [...settings.accounts, newAccount]
    });
    setSaved(false);
  };

  const handleUpdateAccount = (id: string, field: keyof Account, value: string | number) => {
    setSettings({
      ...settings,
      accounts: settings.accounts.map(acc => 
        acc.id === id ? { ...acc, [field]: value } : acc
      )
    });
    setSaved(false);
  };

  const handleRemoveAccount = (id: string) => {
    if (settings.accounts.length === 1) {
      alert("Você precisa ter pelo menos uma conta.");
      return;
    }
    setSettings({
      ...settings,
      accounts: settings.accounts.filter(acc => acc.id !== id)
    });
    setSaved(false);
  };

  const handleAddSetup = () => {
    const newSetup = "";
    setSettings({
      ...settings,
      setups: [...(settings.setups || []), newSetup]
    });
    setSaved(false);
  };

  const handleUpdateSetup = (index: number, value: string) => {
    const newSetups = [...(settings.setups || [])];
    newSetups[index] = value;
    setSettings({
      ...settings,
      setups: newSetups
    });
    setSaved(false);
  };

  const handleRemoveSetup = (index: number) => {
    const newSetups = (settings.setups || []).filter((_, i) => i !== index);
    setSettings({
      ...settings,
      setups: newSetups
    });
    setSaved(false);
  };

  const handleAddAsset = () => {
    const newAsset = "";
    setSettings({
      ...settings,
      assets: [...(settings.assets || []), newAsset]
    });
    setSaved(false);
  };

  const handleUpdateAsset = (index: number, value: string) => {
    const newAssets = [...(settings.assets || [])];
    newAssets[index] = value;
    setSettings({
      ...settings,
      assets: newAssets
    });
    setSaved(false);
  };

  const handleRemoveAsset = (index: number) => {
    const newAssets = (settings.assets || []).filter((_, i) => i !== index);
    setSettings({
      ...settings,
      assets: newAssets
    });
    setSaved(false);
  };

  const handleSave = async () => {
    // Filter out empty setups and assets before saving
    const cleanedSettings = {
      ...settings,
      setups: (settings.setups || []).filter(s => s.trim() !== ''),
      assets: (settings.assets || []).filter(a => a.trim() !== '')
    };
    await updateSettings(cleanedSettings);
    setSettings(cleanedSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Contas e Configurações</h2>
          <p className="text-sm text-slate-500">Gerencie suas contas de trade e saldos iniciais.</p>
        </div>
        <button
          onClick={handleAddAccount}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
        >
          <Plus size={16} />
          Nova Conta
        </button>
      </div>
        <div className="p-6 space-y-6">
        <div className="space-y-4">
          {settings.accounts.map((account) => (
            <div key={account.id} className="flex flex-col gap-4 p-5 border border-slate-200 bg-slate-50/50 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Conta</label>
                    <input
                      type="text"
                      value={account.name}
                      onChange={(e) => handleUpdateAccount(account.id, 'name', e.target.value)}
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Ex: Mesa Proprietária, Conta Pessoal..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Inicial ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={account.initialBalance}
                        onChange={(e) => handleUpdateAccount(account.id, 'initialBalance', Number(e.target.value))}
                        className="w-full pl-7 rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAccount(account.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors mt-6 shrink-0"
                  title="Remover Conta"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Risco Diário Máx.</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                    <input 
                      type="number" 
                      value={account.dailyRiskLimit || ''} 
                      onChange={e => handleUpdateAccount(account.id, 'dailyRiskLimit', Number(e.target.value))}
                      className="w-full pl-7 rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Ex: 100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Risco por Operação</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                    <input 
                      type="number" 
                      value={account.riskPerTradeLimit || ''} 
                      onChange={e => handleUpdateAccount(account.id, 'riskPerTradeLimit', Number(e.target.value))}
                      className="w-full pl-7 rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Max. Op/Dia</label>
                  <input 
                    type="number" 
                    value={account.maxTradesPerDay || ''} 
                    onChange={e => handleUpdateAccount(account.id, 'maxTradesPerDay', Number(e.target.value))}
                    className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Ex: 5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Setups Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Setups Predefinidos</h2>
            <button
              onClick={handleAddSetup}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Adicionar Setup
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Estes setups aparecerão como opções ao registrar uma nova operação.</p>
          
          <div className="space-y-2">
            {(settings.setups || []).map((setup, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={setup}
                  onChange={(e) => handleUpdateSetup(index, e.target.value)}
                  className="flex-1 rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nome do setup..."
                />
                <button
                  onClick={() => handleRemoveSetup(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Remover Setup"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {(settings.setups || []).length === 0 && (
              <p className="text-center py-4 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-lg">
                Nenhum setup cadastrado.
              </p>
            )}
          </div>
        </div>

        {/* Assets Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Ativos Predefinidos</h2>
            <button
              onClick={handleAddAsset}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Adicionar Ativo
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Estes ativos aparecerão no seletor ao registrar uma nova operação.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(settings.assets || []).map((asset, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={asset}
                  onChange={(e) => handleUpdateAsset(index, e.target.value)}
                  className="flex-1 rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nome do ativo..."
                />
                <button
                  onClick={() => handleRemoveAsset(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Remover Ativo"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {(settings.assets || []).length === 0 && (
              <p className="col-span-full text-center py-4 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-lg">
                Nenhum ativo cadastrado.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save size={18} />
            Salvar Configurações
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium animate-in fade-in">
              <CheckCircle2 size={16} />
              Salvo com sucesso!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
