import React, { useState, useRef, useEffect } from 'react';
import { Trade } from '../types';
import { Sparkles, Loader2, AlertCircle, Send, MessageSquare } from 'lucide-react';
import { useTradeSync } from '../hooks/useTradeSync';

interface AIAnalysisProps {
  trades: Trade[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export function AIAnalysis({ trades }: AIAnalysisProps) {
  const { settings } = useTradeSync();
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleAskQuestion = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!currentQuestion.trim() || isAsking) return;
    
    if (trades.length === 0) {
      setError('Adicione pelo menos uma operação para perguntar algo à IA.');
      return;
    }

    const question = currentQuestion.trim();
    setCurrentQuestion('');
    
    const newUserMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: question
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsAsking(true);

    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trades,
          question,
          riskSettings: {
            dailyRiskLimit: settings.dailyRiskLimit,
            riskPerTradeLimit: settings.riskPerTradeLimit,
            maxTradesPerDay: settings.maxTradesPerDay
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao perguntar à inteligência artificial.');
      }

      const newAiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'ai',
        content: data.answer
      };
      
      setMessages(prev => [...prev, newAiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'ai',
        content: `<p class="text-red-600"><strong>Erro:</strong> ${err.message || 'Ocorreu um erro inesperado.'}</p>`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Seção Insights IA / Chat */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Insights IA</h3>
            <p className="text-sm text-slate-500">Faça perguntas sobre suas operações e desempenho</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <MessageSquare size={48} className="opacity-20" />
              <p className="text-center max-w-sm">
                Exemplos:<br/>
                "Qual meu erro mais comum?"<br/>
                "Como foi meu desempenho nos dias de loss?"<br/>
                "Devo parar de operar mais cedo?"
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0"
                      dangerouslySetInnerHTML={{ __html: msg.content }} 
                    />
                  )}
                </div>
              </div>
            ))
          )}
          
          {isAsking && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-sm text-slate-500">A IA está analisando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleAskQuestion} className="shrink-0 mt-auto pt-4 border-t border-slate-100">
          <div className="relative">
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              disabled={isAsking}
              placeholder="Pergunte algo sobre seus trades..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!currentQuestion.trim() || isAsking}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
