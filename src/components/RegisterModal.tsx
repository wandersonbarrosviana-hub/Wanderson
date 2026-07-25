import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Trade, TradeResultType, Account } from '../types';
import { ImageAnnotator } from './ImageAnnotator';
import { useTradeSync } from '../hooks/useTradeSync';

interface RegisterModalProps {
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id'>) => void;
  initialData?: Trade;
}

export function RegisterModal({ onClose, onSave, initialData }: RegisterModalProps) {
  const { settings } = useTradeSync();
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  useEffect(() => {
    setAccounts(settings.accounts || []);
  }, [settings]);

  const [formData, setFormData] = useState({
    accountId: initialData?.accountId || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    asset: initialData?.asset || '',
    direction: initialData?.direction || 'Compra',
    quantity: initialData?.quantity?.toString() || '',
    strategy: initialData?.strategy || '',
    customStrategy: '', // Added to handle "Outros" field
    trend: initialData?.trend || '',
    entryPrice: initialData?.entryPrice?.toString() || '',
    initialStopPrice: initialData?.initialStopPrice?.toString() || '',
    targetPrice: initialData?.targetPrice?.toString() || '',
    exitPrice: initialData?.exitPrice?.toString() || '',
    resultType: initialData?.resultType || 'Gain',
    sentiment: initialData?.sentiment || '',
    isPartial: initialData?.isPartial || false,
    partialRationale: initialData?.partialRationale || '',
    description: initialData?.description || '',
    resultValue: initialData?.resultValue?.toString() || '',
    ratingEntryQuality: initialData?.ratingEntryQuality?.toString() || '',
    ratingDiscipline: initialData?.ratingDiscipline?.toString() || '',
    ratingExecution: initialData?.ratingExecution?.toString() || '',
    ratingManagement: initialData?.ratingManagement?.toString() || '',
    ratingEmotionalControl: initialData?.ratingEmotionalControl?.toString() || '',
    timeframe: initialData?.timeframe || '',
    evalFollowedPlan: initialData?.evalFollowedPlan ?? false,
    evalRespectedSetup: initialData?.evalRespectedSetup ?? false,
    evalImpulseEntry: initialData?.evalImpulseEntry ?? false,
    evalMovedStop: initialData?.evalMovedStop ?? false,
    evalEarlyProfit: initialData?.evalEarlyProfit ?? false,
    initialStopFinancial: initialData?.initialStopFinancial?.toString() || '',
    targetFinancial: initialData?.targetFinancial?.toString() || '',
  });

  const [isOtherStrategy, setIsOtherStrategy] = useState(false);

  useEffect(() => {
    if (initialData?.strategy && settings.setups) {
      const isPredefined = settings.setups.includes(initialData.strategy);
      if (!isPredefined) {
        setIsOtherStrategy(true);
        setFormData(prev => ({ 
          ...prev, 
          strategy: 'Outros..',
          customStrategy: initialData.strategy || ''
        }));
      }
    }
  }, [initialData, settings.setups]);

  // Once accounts are loaded, set a default accountId if not editing an existing trade
  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId && !initialData) {
      setFormData(prev => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, formData.accountId, initialData]);

  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || '');
  const [annotatedImageUrl, setAnnotatedImageUrl] = useState<string>(initialData?.annotatedImageUrl || '');
  const [canvasData, setCanvasData] = useState<string>(initialData?.canvasData || '[]');

  const riskRewardRatio = React.useMemo(() => {
    const entry = Number(formData.entryPrice);
    const stop = Number(formData.initialStopPrice);
    const target = Number(formData.targetPrice);
    
    if (entry && stop && target && entry !== stop) {
      const risk = Math.abs(entry - stop);
      const reward = Math.abs(target - entry);
      return (reward / risk).toFixed(2);
    }
    return '-';
  }, [formData.entryPrice, formData.initialStopPrice, formData.targetPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    if (name === 'strategy') {
      if (value === 'Outros..') {
        setIsOtherStrategy(true);
      } else {
        setIsOtherStrategy(false);
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalStrategy = formData.strategy === 'Outros..' ? formData.customStrategy : formData.strategy;

    onSave({
      accountId: formData.accountId,
      date: formData.date,
      asset: formData.asset,
      direction: formData.direction as any,
      quantity: formData.quantity ? Number(formData.quantity) : undefined,
      strategy: finalStrategy,
      trend: formData.trend as any,
      entryPrice: Number(formData.entryPrice),
      initialStopPrice: Number(formData.initialStopPrice),
      targetPrice: Number(formData.targetPrice),
      exitPrice: Number(formData.exitPrice),
      resultType: formData.resultType as TradeResultType,
      sentiment: formData.sentiment,
      isPartial: formData.isPartial,
      partialRationale: formData.partialRationale,
      description: formData.description,
      resultValue: Number(formData.resultValue),
      ratingEntryQuality: formData.ratingEntryQuality ? Number(formData.ratingEntryQuality) : undefined,
      ratingDiscipline: formData.ratingDiscipline ? Number(formData.ratingDiscipline) : undefined,
      ratingExecution: formData.ratingExecution ? Number(formData.ratingExecution) : undefined,
      ratingManagement: formData.ratingManagement ? Number(formData.ratingManagement) : undefined,
      ratingEmotionalControl: formData.ratingEmotionalControl ? Number(formData.ratingEmotionalControl) : undefined,
      timeframe: formData.timeframe,
      evalFollowedPlan: formData.evalFollowedPlan,
      evalRespectedSetup: formData.evalRespectedSetup,
      evalImpulseEntry: formData.evalImpulseEntry,
      evalMovedStop: formData.evalMovedStop,
      evalEarlyProfit: formData.evalEarlyProfit,
      initialStopFinancial: formData.initialStopFinancial ? Number(formData.initialStopFinancial) : undefined,
      targetFinancial: formData.targetFinancial ? Number(formData.targetFinancial) : undefined,
      imageUrl,
      annotatedImageUrl,
      canvasData
    });
  };

  const handleAnnotatorChange = (url: string, elements: any[], flattenedUrl?: string) => {
    setImageUrl(url);
    setCanvasData(JSON.stringify(elements));
    if (flattenedUrl) {
      setAnnotatedImageUrl(flattenedUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-full flex flex-col my-auto border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-slate-800">
            {initialData ? 'Detalhes da Operação' : 'Registrar Operação'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
          {/* Form Side */}
          <form id="trade-form" onSubmit={handleSubmit} className="flex-1 space-y-4 min-w-[300px]">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Conta</label>
              <select required name="accountId" value={formData.accountId} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ativo Operado</label>
                <input required type="text" name="asset" value={formData.asset} onChange={handleChange} placeholder="ex: WINV23, EURUSD" className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Timeframe</label>
                <input type="text" name="timeframe" value={formData.timeframe} onChange={handleChange} placeholder="ex: M5, H1, D1" className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Direção</label>
                <select required name="direction" value={formData.direction} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Compra">Compra</option>
                  <option value="Venda">Venda</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estratégia / Setup</label>
                <div className="space-y-2">
                  <select 
                    required 
                    name="strategy" 
                    value={formData.strategy} 
                    onChange={handleChange} 
                    className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione um setup</option>
                    {(settings.setups || []).map((setup, idx) => (
                      <option key={idx} value={setup}>{setup}</option>
                    ))}
                    <option value="Outros..">Outros..</option>
                  </select>
                  
                  {isOtherStrategy && (
                    <input 
                      required
                      type="text" 
                      name="customStrategy" 
                      value={formData.customStrategy} 
                      onChange={handleChange} 
                      placeholder="Nome do seu setup customizado" 
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none animate-in fade-in slide-in-from-top-1" 
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qtd (Contratos/Ações)</label>
                <input type="number" step="0.01" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="ex: 1 ou 100" className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tendência</label>
                <select name="trend" value={formData.trend} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Selecione</option>
                  <option value="a favor">A favor</option>
                  <option value="contra">Contra</option>
                  <option value="lateralizado">Lateralizado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Entrada</label>
                <input required type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stop Inicial (Preço)</label>
                <input required type="number" step="any" name="initialStopPrice" value={formData.initialStopPrice} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stop Inicial ($)</label>
                <input type="number" step="any" name="initialStopFinancial" value={formData.initialStopFinancial} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Opcional" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Alvo</label>
                <input required type="number" step="any" name="targetPrice" value={formData.targetPrice} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alvo Inicial ($)</label>
                <input type="number" step="any" name="targetFinancial" value={formData.targetFinancial} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Opcional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Saída</label>
                <input required type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resultado</label>
                <select name="resultType" value={formData.resultType} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Gain">Gain</option>
                  <option value="0x0">0x0 (Empate)</option>
                  <option value="Loss">Loss</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor do Resultado ($)</label>
                <input required type="number" step="0.01" name="resultValue" value={formData.resultValue} onChange={handleChange} placeholder="ex: 150.00" className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sentimento durante a operação</label>
              <input required type="text" name="sentiment" value={formData.sentiment} onChange={handleChange} placeholder="ex: Confiante, Ansioso, Fomo..." className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="isPartial" name="isPartial" checked={formData.isPartial} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <label htmlFor="isPartial" className="text-sm text-slate-700">Fez Parcial?</label>
            </div>

            {formData.isPartial && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Racional da Parcial</label>
                <textarea name="partialRationale" value={formData.partialRationale} onChange={handleChange} rows={2} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Explique por que realizou a parcial..."></textarea>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Checklist de Disciplina</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                  <input type="checkbox" name="evalFollowedPlan" checked={formData.evalFollowedPlan} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  Você seguiu seu plano?
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                  <input type="checkbox" name="evalRespectedSetup" checked={formData.evalRespectedSetup} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  A entrada respeitou o setup?
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                  <input type="checkbox" name="evalImpulseEntry" checked={formData.evalImpulseEntry} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  Entrou por impulso?
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                  <input type="checkbox" name="evalMovedStop" checked={formData.evalMovedStop} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  Moveu o stop?
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                  <input type="checkbox" name="evalEarlyProfit" checked={formData.evalEarlyProfit} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  Realizou lucro antes da hora?
                </label>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Notas da Operação (0 a 10)</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">⭐ Qualidade da entrada</label>
                  <input type="number" min="0" max="10" name="ratingEntryQuality" value={formData.ratingEntryQuality} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">⭐ Disciplina</label>
                  <input type="number" min="0" max="10" name="ratingDiscipline" value={formData.ratingDiscipline} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">⭐ Execução</label>
                  <input type="number" min="0" max="10" name="ratingExecution" value={formData.ratingExecution} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">⭐ Gestão</label>
                  <input type="number" min="0" max="10" name="ratingManagement" value={formData.ratingManagement} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">⭐ Controle emocional</label>
                  <input type="number" min="0" max="10" name="ratingEmotionalControl" value={formData.ratingEmotionalControl} onChange={handleChange} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Racional da Operação</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full rounded-md border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Descreva o motivo da entrada, contexto do mercado..."></textarea>
            </div>
          </form>

          {/* Image Annotator Side */}
          <div className="flex-1 flex flex-col min-w-[300px] min-h-[400px]">
            <label className="block text-sm font-medium text-slate-700 mb-2">Gráfico / Print da Operação</label>
            <ImageAnnotator 
              imageUrl={imageUrl} 
              initialElements={canvasData ? JSON.parse(canvasData) : []} 
              onChange={handleAnnotatorChange} 
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="trade-form" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
            <Save size={16} />
            Salvar Operação
          </button>
        </div>
      </div>
    </div>
  );
}
