import React, { useState } from 'react';
import { Trade } from '../types';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

import { useTradeSync } from '../hooks/useTradeSync';

interface AIAnalysisProps {
  trades: Trade[];
}

export function AIAnalysis({ trades }: AIAnalysisProps) {
  const { settings } = useTradeSync();
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAnalyze = async () => {
    if (trades.length === 0) {
      setError('Adicione pelo menos uma operação para ser analisada.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trades,
          riskSettings: {
            dailyRiskLimit: settings.dailyRiskLimit,
            riskPerTradeLimit: settings.riskPerTradeLimit,
            maxTradesPerDay: settings.maxTradesPerDay
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar as operações.');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro inesperado ao se comunicar com a inteligência artificial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Análise Inteligente</h2>
        <p className="text-slate-600 mb-8">
          Nossa Inteligência Artificial analisará o histórico, sentimentos, resultados e até os <strong>prints das suas operações</strong> para fornecer insights valiosos, pontos de melhoria e identificar padrões no seu comportamento como trader.
        </p>

        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors text-lg"
          >
            <Sparkles size={20} />
            Analisar Minhas Operações
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p>A Inteligência Artificial está analisando suas operações e imagens...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-lg w-full mt-6 text-left">
            <AlertCircle size={24} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {analysis && !loading && (
        <div className="border-t border-slate-100 pt-8 mt-4">
          <div className="prose prose-slate max-w-none prose-h3:text-lg prose-h3:font-semibold prose-h3:text-slate-800 prose-h3:mt-6 prose-h3:mb-3 prose-p:text-slate-600 prose-ul:text-slate-600 prose-li:my-1 prose-strong:text-slate-700">
            <div dangerouslySetInnerHTML={{ __html: analysis }} />
          </div>

          <div className="mt-10 flex justify-center">
            <button
              onClick={handleAnalyze}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
            >
              Refazer Análise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
