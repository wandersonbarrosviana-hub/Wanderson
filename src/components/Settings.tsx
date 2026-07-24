import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../store';
import { AppSettings, Account } from '../types';
import { Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({ initialBalance: 0, accounts: [] });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

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

  const handleSave = () => {
    saveSettings(settings);
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
            <div key={account.id} className="flex items-end gap-4 p-4 border border-slate-100 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Conta</label>
                <input
                  type="text"
                  value={account.name}
                  onChange={(e) => handleUpdateAccount(account.id, 'name', e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Mesa Proprietária, Conta Pessoal..."
                />
              </div>
              <div className="flex-1 max-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Inicial ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={account.initialBalance}
                  onChange={(e) => handleUpdateAccount(account.id, 'initialBalance', Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={() => handleRemoveAccount(account.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors mb-0.5"
                title="Remover Conta"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
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
