import React, { useState } from 'react';
import { Trade } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { RegisterModal } from './RegisterModal';

interface HistoryProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onUpdate: (trade: Trade) => void;
}

export function History({ trades, onDelete, onUpdate }: HistoryProps) {
  const [viewTrade, setViewTrade] = useState<Trade | null>(null);

  const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">Histórico de Operações</h2>
        <p className="text-sm text-slate-500">Suas análises organizadas por data.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium border-b border-slate-200">Data</th>
              <th className="p-4 font-medium border-b border-slate-200">Ativo</th>
              <th className="p-4 font-medium border-b border-slate-200">Direção</th>
              <th className="p-4 font-medium border-b border-slate-200">Estratégia</th>
              <th className="p-4 font-medium border-b border-slate-200">Resultado</th>
              <th className="p-4 font-medium border-b border-slate-200">Valor</th>
              <th className="p-4 font-medium border-b border-slate-200">Sentimento</th>
              <th className="p-4 font-medium border-b border-slate-200 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Nenhuma operação registrada ainda.
                </td>
              </tr>
            ) : (
              sortedTrades.map(trade => (
                <tr key={trade.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm text-slate-700">
                    {format(parseISO(trade.date), 'dd MMM yyyy', { locale: ptBR })}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-900">{trade.asset}</td>
                  <td className="p-4 text-sm">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      trade.direction === 'Compra' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {trade.direction || 'Compra'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{trade.strategy || '-'}</td>
                  <td className="p-4 text-sm">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      trade.resultType === 'Gain' ? "bg-emerald-100 text-emerald-700" :
                      trade.resultType === 'Loss' ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {trade.resultType}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium">
                    <span className={cn(
                      trade.resultValue > 0 ? "text-emerald-600" :
                      trade.resultValue < 0 ? "text-red-600" : "text-slate-600"
                    )}>
                      {trade.resultValue >= 0 ? '+' : ''}{trade.resultValue.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 truncate max-w-[150px]" title={trade.sentiment}>
                    {trade.sentiment}
                  </td>
                  <td className="p-4 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setViewTrade(trade)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Ver Detalhes"
                      >
                        <ExternalLink size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if(confirm('Tem certeza que deseja excluir esta operação?')) {
                            onDelete(trade.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewTrade && (
        <RegisterModal 
          initialData={viewTrade} 
          onClose={() => setViewTrade(null)} 
          onSave={(updated) => {
            onUpdate({ ...updated, id: viewTrade.id });
            setViewTrade(null);
          }} 
        />
      )}
    </div>
  );
}
