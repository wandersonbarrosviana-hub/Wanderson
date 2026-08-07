import React, { useState } from 'react';
import { Trade } from '../types';
import { FileDown, Calendar, Loader2, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { LogoIcon } from './Logo';
import { useTradeSync } from '../hooks/useTradeSync';

interface ReportsProps {
  trades: Trade[];
}

export function Reports({ trades }: ReportsProps) {
  const { settings } = useTradeSync();
  const accounts = settings.accounts || [];
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [reportAnalysis, setReportAnalysis] = useState<string>('');
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateData = async () => {
    if (!startDate || !endDate) {
      setError('Selecione uma data de início e fim.');
      return;
    }

    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));

    let selectedTrades = trades.filter((t) => {
      const tradeDate = parseISO(t.date);
      return isWithinInterval(tradeDate, { start, end });
    });

    if (selectedAccountId !== 'all') {
      selectedTrades = selectedTrades.filter(t => t.accountId === selectedAccountId || (!t.accountId && accounts[0]?.id === selectedAccountId));
    }

    if (selectedTrades.length === 0) {
      setError('Nenhuma operação encontrada no período e conta selecionados.');
      return;
    }

    setLoading(true);
    setError('');
    setFilteredTrades(selectedTrades);

    try {
      const response = await fetch('/api/analyze-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trades: selectedTrades, 
          isReport: true,
          accounts: accounts
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar análise.');
      }

      setReportAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao gerar os dados do relatório.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('pdf-report-content');
    if (!reportElement) return;

    setIsGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let currentY = margin;
      const usableWidth = pdfWidth - margin * 2;

      // Briefly unhide for html-to-image to render
      const containerElement = document.getElementById('pdf-report-container');
      if (containerElement) {
        containerElement.style.left = '0';
        containerElement.style.top = '0';
        containerElement.style.zIndex = '-9999';
      }

      // We need to wait a tick for layout to happen
      await new Promise(resolve => setTimeout(resolve, 100));

      const aiContent = reportElement.querySelector('#ai-analysis-content > div');
      if (aiContent) {
        const wrapTextNodesInDivs = (node: Element) => {
          if (node.tagName === 'DIV') {
            Array.from(node.childNodes).forEach((child: ChildNode) => {
              if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
                const lines = child.textContent.split('\n').filter(line => line.trim());
                const fragment = document.createDocumentFragment();
                lines.forEach(line => {
                  const p = document.createElement('p');
                  p.textContent = line;
                  fragment.appendChild(p);
                });
                node.replaceChild(fragment, child);
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                wrapTextNodesInDivs(child as Element);
              }
            });
          } else {
            Array.from(node.children).forEach(child => wrapTextNodesInDivs(child));
          }
        };
        wrapTextNodesInDivs(aiContent);

        const getLeafBlocks = (parent: Element): Element[] => {
          const leaves: Element[] = [];
          Array.from(parent.children).forEach(child => {
            if (child.tagName === 'DIV') {
              leaves.push(...getLeafBlocks(child));
            } else {
              leaves.push(child);
            }
          });
          return leaves;
        };

        const leafBlocks = getLeafBlocks(aiContent);

        if (leafBlocks.length > 0) {
          leafBlocks.forEach((child: any) => {
            child.classList.add('pdf-block');
            // Ensure it has a white background and occupies full width so toJpeg renders it correctly
            child.style.backgroundColor = '#ffffff';
            child.style.display = 'block';
            child.style.width = '100%';
            child.style.paddingLeft = '20px';
            child.style.paddingRight = '20px';
            child.style.paddingBottom = '12px';
            if (child.tagName === 'LI') {
              child.style.listStylePosition = 'inside';
            }
          });
        } else {
          // Fallback if somehow it's empty
          aiContent.classList.add('pdf-block');
        }
      }

      const blocks = reportElement.querySelectorAll('.pdf-block');

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i] as HTMLElement;
        
        // Skip empty blocks
        if (block.offsetHeight === 0) continue;

        const dataUrl = await toJpeg(block, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const blockPdfHeight = (imgProps.height * usableWidth) / imgProps.width;

        // If it doesn't fit on this page, create a new one
        if (currentY + blockPdfHeight > pdfHeight - margin && currentY > margin) {
          pdf.addPage();
          currentY = margin;
        }

        // Handle case where a single block is taller than a whole page
        if (blockPdfHeight > pdfHeight - margin * 2) {
           let remainingHeight = blockPdfHeight;
           let sourceY = 0;
           while (remainingHeight > 0) {
             if (currentY >= pdfHeight - margin) {
               pdf.addPage();
               currentY = margin;
             }
             
             const availableSpace = pdfHeight - margin - currentY;
             const drawHeight = Math.min(remainingHeight, availableSpace);
             
             // Negative Y acts as a viewport shift down for the image source.
             pdf.addImage(dataUrl, 'JPEG', margin, currentY - sourceY, usableWidth, blockPdfHeight);
             
             // Draw white masks over top and bottom margins to prevent repeated text bleeding
             pdf.setFillColor(255, 255, 255);
             pdf.rect(0, 0, pdfWidth, margin, 'F');
             pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F');
             
             remainingHeight -= drawHeight;
             sourceY += drawHeight;
             currentY += drawHeight;
           }
        } else {
          pdf.addImage(dataUrl, 'JPEG', margin, currentY, usableWidth, blockPdfHeight);
          currentY += blockPdfHeight + 5; // 5mm spacing
        }
      }

      pdf.save(`relatorio-operacoes-${startDate}-a-${endDate}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Erro ao gerar o PDF.');
    } finally {
      // Re-hide report element
      const containerElement = document.getElementById('pdf-report-container');
      if (containerElement) {
        containerElement.style.left = '-9999px';
        containerElement.style.top = '-9999px';
        containerElement.style.zIndex = 'auto';
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
          <FileDown size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatórios de Operações</h2>
          <p className="text-sm text-slate-500">Exporte relatórios em PDF com análises da IA</p>
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filtrar por Conta:</span>
          </div>
          <select 
            value={selectedAccountId} 
            onChange={e => setSelectedAccountId(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-w-[200px]"
          >
            <option value="all">Todas as Contas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-slate-400" />
            </div>
            <input
              type="date"
              className="pl-10 w-full rounded-lg border-slate-300 border px-3 py-2 focus:border-sky-500 focus:ring-sky-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-slate-400" />
            </div>
            <input
              type="date"
              className="pl-10 w-full rounded-lg border-slate-300 border px-3 py-2 focus:border-sky-500 focus:ring-sky-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerateData}
        disabled={loading || isGenerating}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
        Gerar Dados do Relatório
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-lg w-full text-left">
          <AlertCircle size={24} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {reportAnalysis && !loading && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-sky-900 mb-2">Dados Gerados com Sucesso!</h3>
            <p className="text-sky-700 mb-4">A análise da inteligência artificial foi concluída e as imagens foram preparadas.</p>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-bold transition-colors w-full sm:w-auto shadow-sm"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
              {isGenerating ? 'Gerando PDF...' : 'Baixar Relatório em PDF'}
            </button>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="text-sky-600" size={20} /> 
              Prévia da Análise (IA)
            </h3>
            <div className="prose prose-slate max-w-none prose-h3:text-sky-700 prose-h3:font-semibold prose-h4:text-slate-700 text-base border-t border-slate-100 pt-4">
              <div dangerouslySetInnerHTML={{ __html: reportAnalysis }} />
            </div>
          </div>
        </div>
      )}

      {/* Hidden Report Template for PDF Generation */}
      <div id="pdf-report-container" className="absolute left-[-9999px] top-[-9999px]">
        <div id="pdf-report-content" className="bg-white p-10 w-[800px] text-slate-800 font-sans" style={{ minHeight: '1122px' }}>
          {/* Header */}
          <div className="pdf-block flex items-center justify-between border-b-4 border-sky-500 pb-6 mb-8">
            <div className="flex items-center gap-3 text-sky-600">
              <LogoIcon className="w-10 h-10" />
              <h1 className="text-3xl font-extrabold tracking-tight">TradeDiary</h1>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-700">Relatório de Operações</h2>
              <p className="text-sm text-slate-500">Período: {startDate ? format(parseISO(startDate), 'dd/MM/yyyy') : ''} a {endDate ? format(parseISO(endDate), 'dd/MM/yyyy') : ''}</p>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="mb-10">
            <div className="pdf-block flex items-center gap-2 mb-4 border-b-2 border-sky-600 pb-2 text-sky-700">
              <Sparkles size={24} />
              <h3 className="text-xl font-bold">Análise Inteligente (IA)</h3>
            </div>
            <div id="ai-analysis-content" className="prose prose-slate max-w-none prose-h3:text-sky-700 prose-h3:font-semibold prose-h4:text-slate-700 text-base bg-white p-4 rounded border border-slate-100">
              <div dangerouslySetInnerHTML={{ __html: reportAnalysis }} />
            </div>
          </div>

          {/* Trades and Images */}
          <div>
             <div className="pdf-block flex items-center gap-2 mb-6 bg-sky-600 text-white p-3 rounded-t-lg">
              <h3 className="text-lg font-bold">Registro Visual das Operações</h3>
            </div>
            
            <div className="space-y-8">
              {filteredTrades.map((trade, index) => (
                <div key={trade.id} className="pdf-block border border-slate-200 rounded-lg overflow-hidden" style={{ pageBreakInside: 'avoid', marginBottom: '32px' }}>
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800">Operação {index + 1} - {trade.asset}</h4>
                      <p className="text-sm text-slate-500">{format(parseISO(trade.date), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    <div className={`font-bold ${trade.resultValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.resultValue >= 0 ? '+' : ''}${trade.resultValue.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500">Entrada:</span> <span className="font-medium">{trade.entryPrice}</span></div>
                    <div><span className="text-slate-500">Saída:</span> <span className="font-medium">{trade.exitPrice}</span></div>
                    <div className="col-span-2"><span className="text-slate-500">Sentimento:</span> <span className="font-medium capitalize">{trade.sentiment}</span></div>
                    <div className="col-span-2"><span className="text-slate-500">Descrição:</span> <p className="mt-1">{trade.description}</p></div>
                  </div>

                  {trade.annotatedImageUrl || trade.imageUrl ? (
                    <div className="border-t border-slate-200 p-4 bg-slate-50 text-center">
                      <img src={trade.annotatedImageUrl || trade.imageUrl} alt={`Operação ${index + 1}`} className="max-w-full h-auto mx-auto border border-slate-300 rounded shadow-sm" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div className="border-t border-slate-200 p-4 bg-slate-50 text-center text-slate-400 italic text-sm">
                      Nenhuma imagem anexada para esta operação.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="pdf-block mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-400">
            Gerado por TradeDiary Platform &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
