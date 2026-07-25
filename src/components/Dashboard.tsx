import React, { useMemo, useState, useEffect } from 'react';
import { Trade, Account } from '../types';
import { useTradeSync } from '../hooks/useTradeSync';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Percent, X, Shield, AlertTriangle, ListChecks } from 'lucide-react';
import { cn } from '../lib/utils';
import { RegisterModal } from './RegisterModal';

interface DashboardProps {
  trades: Trade[];
  onUpdate?: (trade: Trade) => void;
}

export function Dashboard({ trades, onUpdate }: DashboardProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { settings } = useTradeSync();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedResultType, setSelectedResultType] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<string>('all');
  const [selectedTrend, setSelectedTrend] = useState<string>('all');
  const [selectedPartial, setSelectedPartial] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'day' | 'hour'>('day');
  const [viewTrade, setViewTrade] = useState<Trade | null>(null);
  const [isChartHovered, setIsChartHovered] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  useEffect(() => {
    setAccounts(settings.accounts || []);
  }, [settings]);

  const activeInitialBalance = useMemo(() => {
    if (selectedAccountId === 'all') {
      return accounts.reduce((acc, account) => acc + account.initialBalance, 0);
    }
    const acc = accounts.find(a => a.id === selectedAccountId);
    return acc ? acc.initialBalance : 0;
  }, [accounts, selectedAccountId]);

  const filteredTrades = useMemo(() => {
    let filtered = [...trades];
    
    if (selectedAccountId !== 'all') {
      // Legacy trades might not have accountId, we can associate them with the first account if needed,
      // but strictly speaking, filter by accountId or assume 'default'
      filtered = filtered.filter(t => t.accountId === selectedAccountId || (!t.accountId && accounts[0]?.id === selectedAccountId));
    }

    if (startDate) {
      filtered = filtered.filter(t => isAfter(parseISO(t.date), startOfDay(parseISO(startDate))) || t.date === startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => isBefore(parseISO(t.date), endOfDay(parseISO(endDate))) || t.date === endDate);
    }
    if (selectedStrategy !== 'all') {
      filtered = filtered.filter(t => t.strategy === selectedStrategy);
    }
    if (selectedSentiment !== 'all') {
      filtered = filtered.filter(t => t.sentiment === selectedSentiment);
    }
    if (selectedResultType !== 'all') {
      filtered = filtered.filter(t => t.resultType === selectedResultType);
    }
    if (selectedAsset !== 'all') {
      filtered = filtered.filter(t => t.asset === selectedAsset);
    }
    if (selectedTrend !== 'all') {
      filtered = filtered.filter(t => t.trend === selectedTrend);
    }
    if (selectedPartial !== 'all') {
      const isPartial = selectedPartial === 'true';
      filtered = filtered.filter(t => t.isPartial === isPartial);
    }
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
      return dateA - dateB;
    });
  }, [trades, startDate, endDate, selectedAccountId, accounts, selectedStrategy, selectedSentiment, selectedResultType, selectedAsset, selectedTrend, selectedPartial]);

  const uniqueStrategies = useMemo(() => {
    const strategies = new Set<string>();
    trades.forEach(t => {
      if (t.strategy) strategies.add(t.strategy);
    });
    return Array.from(strategies).sort();
  }, [trades]);

  const uniqueSentiments = useMemo(() => {
    const sentiments = new Set<string>();
    trades.forEach(t => {
      if (t.sentiment) sentiments.add(t.sentiment);
    });
    return Array.from(sentiments).sort();
  }, [trades]);

  const uniqueAssets = useMemo(() => {
    const assets = new Set<string>();
    trades.forEach(t => {
      if (t.asset) assets.add(t.asset);
    });
    return Array.from(assets).sort();
  }, [trades]);

  const stats = useMemo(() => {
    const gains = filteredTrades.filter(t => t.resultValue > 0);
    const losses = filteredTrades.filter(t => t.resultValue < 0);
    
    const totalGains = gains.reduce((acc, curr) => acc + curr.resultValue, 0);
    const totalLoss = losses.reduce((acc, curr) => acc + curr.resultValue, 0); // This will be negative
    const netResult = totalGains + totalLoss;
    
    const maxGain = gains.length ? Math.max(...gains.map(t => t.resultValue)) : 0;
    const maxLoss = losses.length ? Math.min(...losses.map(t => t.resultValue)) : 0;
    
    const avgGain = gains.length ? totalGains / gains.length : 0;
    const avgLoss = losses.length ? totalLoss / losses.length : 0;

    let currentConsecutiveGains = 0;
    let maxConsecutiveGains = 0;
    let currentConsecutiveLosses = 0;
    let maxConsecutiveLosses = 0;
    
    let totalRR = 0;
    let rrCount = 0;

    filteredTrades.forEach(t => {
      if (t.resultValue > 0) {
        currentConsecutiveGains++;
        currentConsecutiveLosses = 0;
        if (currentConsecutiveGains > maxConsecutiveGains) {
          maxConsecutiveGains = currentConsecutiveGains;
        }
      } else if (t.resultValue < 0) {
        currentConsecutiveLosses++;
        currentConsecutiveGains = 0;
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentConsecutiveLosses;
        }
      } else {
        // Tie (0x0) breaks streaks
        currentConsecutiveGains = 0;
        currentConsecutiveLosses = 0;
      }
      
      const entry = Number(t.entryPrice);
      const stop = Number(t.initialStopPrice);
      const target = Number(t.targetPrice);
      if (entry && stop && target && entry !== stop) {
        const risk = Math.abs(entry - stop);
        const reward = Math.abs(target - entry);
        if (risk > 0) {
          totalRR += reward / risk;
          rrCount++;
        }
      }
    });

    const avgRiskReward = rrCount > 0 ? totalRR / rrCount : 0;

    const roi = activeInitialBalance > 0 ? (netResult / activeInitialBalance) * 100 : 0;

    return { totalGains, totalLoss, netResult, maxGain, maxLoss, avgGain, avgLoss, winRate: filteredTrades.length ? (gains.length / filteredTrades.length) * 100 : 0, roi, totalTrades: filteredTrades.length, maxConsecutiveGains, maxConsecutiveLosses, avgRiskReward };
  }, [filteredTrades, activeInitialBalance]);

  const riskStats = useMemo(() => {
    const targetDate = startDate || format(new Date(), 'yyyy-MM-dd');
    
    const dailyTrades = trades.filter(t => {
      const matchesAccount = selectedAccountId === 'all' || 
                            t.accountId === selectedAccountId || 
                            (!t.accountId && accounts[0]?.id === selectedAccountId);
                            
      return t.date.startsWith(targetDate) && matchesAccount;
    });
    
    const dailyLoss = dailyTrades
      .filter(t => t.resultValue < 0)
      .reduce((acc, t) => acc + Math.abs(t.resultValue), 0);
    
    const maxDailyTradeLoss = dailyTrades.length > 0 
      ? Math.max(...dailyTrades.map(t => t.resultValue < 0 ? Math.abs(t.resultValue) : 0))
      : 0;

    const tradeCount = dailyTrades.length;

    return {
      dailyLoss,
      maxDailyTradeLoss,
      tradeCount,
      isSpecificDate: !!startDate,
      targetDate
    };
  }, [trades, startDate, selectedAccountId, accounts]);

  const chronologicalTrades = useMemo(() => {
    return filteredTrades;
  }, [filteredTrades]);

  const drawdownStats = useMemo(() => {
    let currentBalance = activeInitialBalance;
    let peak = activeInitialBalance;
    let maxDrawdownValue = 0;
    let maxDrawdownPercent = 0;
    
    chronologicalTrades.forEach(t => {
      currentBalance += t.resultValue;
      if (currentBalance > peak) {
        peak = currentBalance;
      }
      
      const currentDrawdownValue = peak - currentBalance;
      const currentDrawdownPercent = peak > 0 ? (currentDrawdownValue / peak) * 100 : 0;
      
      if (currentDrawdownValue > maxDrawdownValue) maxDrawdownValue = currentDrawdownValue;
      if (currentDrawdownPercent > maxDrawdownPercent) maxDrawdownPercent = currentDrawdownPercent;
    });

    const currentDrawdownValue = peak - currentBalance;
    const currentDrawdownPercent = peak > 0 ? (currentDrawdownValue / peak) * 100 : 0;

    return {
      currentDrawdownValue,
      currentDrawdownPercent,
      maxDrawdownValue,
      maxDrawdownPercent
    };
  }, [chronologicalTrades, activeInitialBalance]);

  const chartData = useMemo(() => {
    let cumulative = activeInitialBalance;
    const data: any[] = [{
      date: 'Início',
      fullDate: 'Saldo Inicial',
      value: 0,
      cumulative: activeInitialBalance
    }];

    const aggregated = chronologicalTrades.reduce((acc, t) => {
      let key = format(parseISO(t.date), 'dd/MM', { locale: ptBR });
      let fullLabel = format(parseISO(t.date), 'dd MMM yyyy', { locale: ptBR });
      
      if (viewMode === 'hour') {
        const timeStr = t.time || '00:00:00';
        key = `${key} ${timeStr}`;
        fullLabel = `${fullLabel} ${timeStr}`;
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          fullDate: fullLabel,
          value: 0
        };
      }
      acc[key].value += t.resultValue;
      return acc;
    }, {} as Record<string, any>);

    Object.values(aggregated).forEach((dayData: any) => {
      cumulative += dayData.value;
      data.push({
        ...dayData,
        cumulative
      });
    });
    
    return data;
  }, [chronologicalTrades, activeInitialBalance, viewMode]);

  const consistencyScore = useMemo(() => {
    if (chartData.length < 2) return 0;
    
    const n = chartData.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    chartData.forEach((d, i) => {
      const x = i;
      const y = d.cumulative;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    });

    const numerator = Math.pow((n * sumXY - sumX * sumY), 2);
    const denominator = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);
    
    if (denominator === 0) return 1;
    
    return numerator / denominator;
  }, [chartData]);

  const barChartData = useMemo(() => {
    return chronologicalTrades.map((t, index) => ({
      name: `Op ${index + 1}`,
      date: format(parseISO(t.date), 'dd MMM yyyy', { locale: ptBR }),
      asset: t.asset,
      value: t.resultValue,
      originalTrade: t,
    }));
  }, [chronologicalTrades]);

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
          <p className="font-semibold text-slate-800">{data.asset}</p>
          <p className="text-sm text-slate-500">{data.date}</p>
          <p className={`text-sm font-bold mt-1 ${data.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            Valor: {data.value >= 0 ? '+' : ''}$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const directionPieData = useMemo(() => {
    let compraCount = 0;
    let vendaCount = 0;
    filteredTrades.forEach(t => {
      const dir = t.direction || 'Compra';
      if (dir === 'Compra') compraCount++;
      else if (dir === 'Venda') vendaCount++;
    });
    return [
      { name: 'Compra', value: compraCount, color: '#0ea5e9' },
      { name: 'Venda', value: vendaCount, color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [filteredTrades]);

  const resultPieData = useMemo(() => {
    let gainCount = 0;
    let lossCount = 0;
    let zeroCount = 0;
    filteredTrades.forEach(t => {
      if (t.resultType === 'Gain') gainCount++;
      else if (t.resultType === 'Loss') lossCount++;
      else if (t.resultType === '0x0') zeroCount++;
    });
    return [
      { name: 'Gain', value: gainCount, color: '#00f260' },
      { name: 'Loss', value: lossCount, color: '#ff0844' },
      { name: '0x0', value: zeroCount, color: '#94a3b8' }
    ].filter(d => d.value > 0);
  }, [filteredTrades]);

  const calendarData = useMemo(() => {
    if (filteredTrades.length === 0) return [];
    
    // Find min and max date
    const sortedDates = [...filteredTrades].map(t => parseISO(t.date)).sort((a, b) => a.getTime() - b.getTime());
    const minDate = sortedDates[0];
    const maxDate = sortedDates[sortedDates.length - 1];
    
    // Group by month
    const months: { monthDate: Date; days: { date: Date; result: number; percentage: number; count: number }[] }[] = [];
    
    let currentMonthStart = startOfMonth(minDate);
    const endMonthStart = startOfMonth(maxDate);
    
    while (currentMonthStart.getTime() <= endMonthStart.getTime()) {
      const monthEnd = endOfMonth(currentMonthStart);
      const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: monthEnd });
      
      const daysData = daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTrades = filteredTrades.filter(t => t.date === dayStr);
        const result = dayTrades.reduce((sum, t) => sum + t.resultValue, 0);
        
        // Calculate percentage for the day based on activeInitialBalance + cumulative previous
        let prevSum = 0;
        trades.forEach(t => {
           if (isBefore(parseISO(t.date), startOfDay(day))) {
              if (selectedAccountId === 'all' || t.accountId === selectedAccountId) {
                prevSum += t.resultValue;
              }
           }
        });
        const dayStartBalance = activeInitialBalance + prevSum;
        const percentage = dayStartBalance > 0 ? (result / dayStartBalance) * 100 : 0;
        
        return {
          date: day,
          result,
          percentage,
          count: dayTrades.length
        };
      });
      
      months.push({ monthDate: currentMonthStart, days: daysData });
      currentMonthStart = startOfMonth(new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1));
    }
    
    return months;
  }, [filteredTrades, activeInitialBalance, trades, selectedAccountId]);

  const gradientOffset = () => {
    const dataMax = Math.max(...chartData.map((i) => i.cumulative));
    const dataMin = Math.min(...chartData.map((i) => i.cumulative));

    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }

    return dataMax / (dataMax - dataMin);
  };

  const handleSaveModal = (data: Omit<Trade, 'id'>) => {
    if (viewTrade && onUpdate) {
      onUpdate({ ...data, id: viewTrade.id });
    }
    setViewTrade(null);
  };

  const strategyRanking = useMemo(() => {
    const ranking: Record<string, { netResult: number; winCount: number; totalCount: number }> = {};
    filteredTrades.forEach(t => {
      if (!t.strategy) return;
      if (!ranking[t.strategy]) {
        ranking[t.strategy] = { netResult: 0, winCount: 0, totalCount: 0 };
      }
      ranking[t.strategy].totalCount++;
      ranking[t.strategy].netResult += t.resultValue;
      if (t.resultValue > 0) {
        ranking[t.strategy].winCount++;
      }
    });

    return Object.entries(ranking)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.netResult - a.netResult);
  }, [filteredTrades]);

  const off = chartData.length > 0 ? gradientOffset() : 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Conta:</label>
          <select 
            value={selectedAccountId} 
            onChange={e => setSelectedAccountId(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todas as Contas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">De:</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Até:</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        <div className="flex items-center gap-2 ml-2 border-l border-slate-200 pl-4">
          <button
            onClick={() => {
              const dateStr = format(new Date(), 'yyyy-MM-dd');
              setStartDate(dateStr);
              setEndDate(dateStr);
            }}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            No Dia
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const start = new Date(now);
              start.setDate(start.getDate() - start.getDay()); // Sunday
              const end = new Date(start);
              end.setDate(end.getDate() + 6); // Saturday
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Na Semana
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), 1);
              const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            No Mês
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const start = new Date(now.getFullYear(), 0, 1);
              const end = new Date(now.getFullYear(), 11, 31);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            No Ano
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm font-medium text-slate-700">Estratégia:</label>
          <select
            value={selectedStrategy}
            onChange={e => setSelectedStrategy(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-[120px]"
          >
            <option value="all">Todas</option>
            {uniqueStrategies.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Sentimento:</label>
          <select
            value={selectedSentiment}
            onChange={e => setSelectedSentiment(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-[120px]"
          >
            <option value="all">Todos</option>
            {uniqueSentiments.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Ativo:</label>
          <select
            value={selectedAsset}
            onChange={e => setSelectedAsset(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-[120px]"
          >
            <option value="all">Todos</option>
            {uniqueAssets.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Resultado:</label>
          <select
            value={selectedResultType}
            onChange={e => setSelectedResultType(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-[120px]"
          >
            <option value="all">Todos</option>
            <option value="Gain">Gain</option>
            <option value="Loss">Loss</option>
            <option value="0x0">0x0</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Tendência:</label>
          <select
            value={selectedTrend}
            onChange={e => setSelectedTrend(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-[120px]"
          >
            <option value="all">Todas</option>
            <option value="a favor">A favor</option>
            <option value="contra">Contra</option>
            <option value="lateralizado">Lateralizado</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Parcial:</label>
          <select
            value={selectedPartial}
            onChange={e => setSelectedPartial(e.target.value)}
            className="rounded-md border border-slate-300 p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-[120px]"
          >
            <option value="all">Todos</option>
            <option value="true">Com Parcial</option>
            <option value="false">Sem Parcial</option>
          </select>
        </div>
        <button 
          onClick={() => { 
            setStartDate(''); 
            setEndDate(''); 
            setSelectedAccountId('all'); 
            setSelectedStrategy('all'); 
            setSelectedSentiment('all'); 
            setSelectedResultType('all'); 
            setSelectedAsset('all'); 
            setSelectedTrend('all');
            setSelectedPartial('all');
          }}
          className="text-sm text-blue-600 hover:text-blue-800 ml-auto"
        >
          Limpar Filtros
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Patrimônio Atual" value={activeInitialBalance + stats.netResult} icon={<DollarSign size={20} />} isCurrency />
        <StatCard title="Lucro/Prejuízo (%)" value={stats.roi} suffix="%" icon={<Percent size={20} />} valueColor={stats.roi >= 0 ? 'text-emerald-600' : 'text-red-600'} />
        <StatCard title="Resultado Líquido" value={stats.netResult} icon={<DollarSign size={20} />} isCurrency />
        <StatCard title="Win Rate" value={stats.winRate} suffix="%" icon={<Target size={20} />} />
        <StatCard title="Total Operações" value={stats.totalTrades} icon={<Activity size={20} />} />
        <StatCard title="Score Consistência" value={consistencyScore * 100} suffix="%" icon={<Target size={20} />} valueColor={consistencyScore >= 0.8 ? 'text-emerald-600' : consistencyScore >= 0.5 ? 'text-orange-500' : 'text-red-600'} />
      </div>

      {/* Risk Management Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settings.dailyRiskLimit ? (
          <StatCard 
            title={`Risco Diário (${riskStats.isSpecificDate ? format(parseISO(riskStats.targetDate), 'dd/MM') : 'Hoje'})`} 
            value={riskStats.dailyLoss} 
            isCurrency 
            icon={<Shield size={20} />} 
            valueColor={
              riskStats.dailyLoss > settings.dailyRiskLimit 
                ? 'text-red-600' 
                : riskStats.dailyLoss >= settings.dailyRiskLimit * 0.8 
                  ? 'text-orange-500' 
                  : 'text-emerald-600'
            }
            suffix={` / $${settings.dailyRiskLimit}`}
          />
        ) : (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-xs text-slate-400">Configure o limite de risco diário nas configurações.</p>
          </div>
        )}

        {settings.riskPerTradeLimit ? (
          <StatCard 
            title={`Maior Stop (${riskStats.isSpecificDate ? format(parseISO(riskStats.targetDate), 'dd/MM') : 'do Dia'})`} 
            value={riskStats.maxDailyTradeLoss} 
            isCurrency 
            icon={<TrendingDown size={20} />} 
            valueColor={
              riskStats.maxDailyTradeLoss > settings.riskPerTradeLimit 
                ? 'text-red-600' 
                : riskStats.maxDailyTradeLoss >= settings.riskPerTradeLimit * 0.8 
                  ? 'text-orange-500' 
                  : 'text-emerald-600'
            }
            suffix={` / $${settings.riskPerTradeLimit}`}
          />
        ) : (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-xs text-slate-400">Configure o risco por operação nas configurações.</p>
          </div>
        )}

        {settings.maxTradesPerDay ? (
          <StatCard 
            title={`Operações (${riskStats.isSpecificDate ? format(parseISO(riskStats.targetDate), 'dd/MM') : 'Hoje'})`} 
            value={riskStats.tradeCount} 
            icon={<ListChecks size={20} />} 
            valueColor={
              riskStats.tradeCount > settings.maxTradesPerDay 
                ? 'text-red-600' 
                : riskStats.tradeCount >= settings.maxTradesPerDay 
                  ? 'text-orange-500' 
                  : 'text-slate-800'
            }
            suffix={` / ${settings.maxTradesPerDay}`}
          />
        ) : (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-xs text-slate-400">Configure o limite de operações nas configurações.</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Loss" value={stats.totalLoss} icon={<TrendingDown size={20} />} isCurrency valueColor="text-red-600" />
        <StatCard title="Maior Gain" value={stats.maxGain} icon={<TrendingUp size={20} />} isCurrency valueColor="text-emerald-600" />
        <StatCard title="Maior Loss" value={stats.maxLoss} icon={<TrendingDown size={20} />} isCurrency valueColor="text-red-600" />
        <StatCard title="Média Gain" value={stats.avgGain} icon={<Activity size={20} />} isCurrency valueColor="text-emerald-600" />
        <StatCard title="Média Loss" value={stats.avgLoss} icon={<Activity size={20} />} isCurrency valueColor="text-red-600" />
        <StatCard title="Risco/Retorno (Médio)" value={stats.avgRiskReward > 0 ? `1:${stats.avgRiskReward.toFixed(2)}` : '-'} icon={<Activity size={20} />} isStringValue />
        <StatCard title="Seq. Gains (Máx)" value={stats.maxConsecutiveGains} icon={<TrendingUp size={20} />} valueColor="text-emerald-600" />
        <StatCard title="Seq. Loss (Máx)" value={stats.maxConsecutiveLosses} icon={<TrendingDown size={20} />} valueColor="text-red-600" />
        <StatCard title="Drawdown Atual" value={drawdownStats.currentDrawdownValue} suffix={` (${drawdownStats.currentDrawdownPercent.toFixed(1)}%)`} icon={<TrendingDown size={20} />} isCurrency valueColor="text-red-600" />
        <StatCard title="Drawdown Máximo" value={drawdownStats.maxDrawdownValue} suffix={` (${drawdownStats.maxDrawdownPercent.toFixed(1)}%)`} icon={<TrendingDown size={20} />} isCurrency valueColor="text-red-600" />
      </div>

      {/* Strategy Ranking Table */}
      {strategyRanking.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Ranking de Setups / Estratégias</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Estratégia</th>
                  <th className="px-4 py-3 font-medium">Operações</th>
                  <th className="px-4 py-3 font-medium">Vitórias</th>
                  <th className="px-4 py-3 font-medium">Win Rate</th>
                  <th className="px-4 py-3 font-medium">Resultado Líquido ($)</th>
                </tr>
              </thead>
              <tbody>
                {strategyRanking.map((strategy, index) => {
                  const winRate = strategy.totalCount > 0 ? (strategy.winCount / strategy.totalCount) * 100 : 0;
                  return (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{strategy.name}</td>
                      <td className="px-4 py-3 text-slate-600">{strategy.totalCount}</td>
                      <td className="px-4 py-3 text-emerald-600">{strategy.winCount}</td>
                      <td className="px-4 py-3 text-slate-600">{winRate.toFixed(1)}%</td>
                      <td className={`px-4 py-3 font-semibold ${strategy.netResult >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {strategy.netResult >= 0 ? '+' : ''}$ {strategy.netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Resultado</h3>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                  viewMode === 'day' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('hour')}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                  viewMode === 'hour' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                Hora
              </button>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase">Resultado Total</span>
              <span className={`text-sm font-bold ${stats.netResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {stats.netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
        <div 
          className="h-[400px] w-full"
          onMouseEnter={() => setIsChartHovered(true)}
          onMouseLeave={() => setIsChartHovered(false)}
        >
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                style={{ outline: 'none' }}
              >
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <YAxis 
                  orientation="right"
                  width={80} 
                  domain={['auto', 'auto']} 
                  tick={{ fill: '#64748b', fontSize: 10 }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val.toLocaleString('pt-BR')}`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEquity)"
                  animationDuration={2000}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-500 italic">
                Sem dados para o período selecionado.
             </div>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_path]:outline-none [&_rect]:outline-none">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Resultado por Operação</h3>
        <div className="w-full overflow-x-auto">
          <div className="h-[300px]" style={{ minWidth: barChartData.length > 10 ? `${barChartData.length * 60}px` : '100%' }}>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} style={{ outline: 'none' }}>
                  <defs>
                    <linearGradient id="colorGainBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f260" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="colorLossBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#be123c" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="#ff0844" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis width={95} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(val) => `$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 8, 8]} 
                    onClick={(data) => {
                      if (data && data.payload && data.payload.originalTrade) {
                        setViewTrade(data.payload.originalTrade);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 0 ? 'url(#colorGainBar)' : 'url(#colorLossBar)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Sem dados para o período selecionado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Operações (Compradas vs Vendidas)</h3>
          <div className="h-[300px] w-full">
            {directionPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={directionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {directionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Sem dados.
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Resultados (Gain vs Loss vs 0x0)</h3>
          <div className="h-[300px] w-full">
            {resultPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {resultPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Sem dados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      {calendarData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Calendário de Resultados</h3>
          <div className="flex flex-col gap-8">
            {calendarData.map((monthData, idx) => (
              <div key={idx} className="overflow-x-auto">
                <h4 className="text-md font-semibold text-slate-700 mb-4 capitalize">{format(monthData.monthDate, 'MMMM yyyy', { locale: ptBR })}</h4>
                <div className="min-w-[700px] grid grid-cols-7 gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
                    <div key={dayName} className="text-center font-medium text-slate-500 py-2">{dayName}</div>
                  ))}
                  {Array.from({ length: getDay(monthData.monthDate) }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2 border border-transparent"></div>
                  ))}
                  {monthData.days.map((day, i) => {
                    let bgColor = 'bg-slate-50';
                    let textColor = 'text-slate-500';
                    if (day.count > 0) {
                      if (day.result > 0) {
                        bgColor = 'bg-emerald-100 hover:bg-emerald-200';
                        textColor = 'text-emerald-800';
                      } else if (day.result < 0) {
                        bgColor = 'bg-red-100 hover:bg-red-200';
                        textColor = 'text-red-800';
                      } else {
                        bgColor = 'bg-slate-200 hover:bg-slate-300';
                        textColor = 'text-slate-800';
                      }
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={cn("p-2 border border-slate-100 rounded-lg min-h-[80px] flex flex-col items-center justify-center relative cursor-pointer transition-colors", bgColor)}
                        onClick={() => {
                          if (day.count > 0) {
                            setSelectedCalendarDate(format(day.date, 'yyyy-MM-dd'));
                          }
                        }}
                      >
                        <span className="absolute top-1 left-2 text-xs font-semibold text-slate-400">{format(day.date, 'd')}</span>
                        {day.count > 0 && (
                          <div className={cn("text-center flex flex-col items-center justify-center w-full", textColor)}>
                            <span className="font-bold text-sm">
                              {day.result >= 0 ? '+' : '-'}${Math.abs(day.result).toFixed(2)}
                            </span>
                            <span className="text-xs opacity-80">
                              {day.percentage > 0 ? '+' : ''}{day.percentage.toFixed(2)}%
                            </span>
                            <span className="text-[10px] bg-white/50 px-1 rounded mt-1">
                              {day.count} op{day.count > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCalendarDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl sticky top-0">
              <h2 className="text-xl font-semibold text-slate-800">Operações do Dia: {format(parseISO(selectedCalendarDate), 'dd/MM/yyyy')}</h2>
              <button onClick={() => setSelectedCalendarDate(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {filteredTrades.filter(t => t.date === selectedCalendarDate).map(trade => (
                  <div key={trade.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors" onClick={() => { setViewTrade(trade); setSelectedCalendarDate(null); }}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">{trade.asset}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          trade.direction === 'Compra' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                        )}>{trade.direction || 'Compra'}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          trade.resultType === 'Gain' ? "bg-emerald-100 text-emerald-700" :
                          trade.resultType === 'Loss' ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-700"
                        )}>{trade.resultType}</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Entrada: {trade.entryPrice} | Saída: {trade.exitPrice}
                      </div>
                      {trade.strategy && (
                         <div className="text-xs text-slate-400 mt-1">Estratégia: {trade.strategy}</div>
                      )}
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      trade.resultValue >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {trade.resultValue >= 0 ? '+' : '-'}${Math.abs(trade.resultValue).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewTrade && (
        <RegisterModal
          initialData={viewTrade}
          onClose={() => setViewTrade(null)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, isCurrency = false, suffix = '', valueColor, isStringValue = false }: any) {
  let formattedValue = '';
  if (isStringValue) {
    formattedValue = value;
  } else {
    formattedValue = isCurrency 
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })
      : value.toFixed(2);
  }
    
  let color = valueColor || 'text-slate-800';
  if (!valueColor && isCurrency && !isStringValue) {
    if (value > 0) color = 'text-emerald-600';
    if (value < 0) color = 'text-red-600';
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
          {icon}
        </div>
      </div>
      <p className={cn("text-2xl font-bold", color)}>
        {formattedValue}{suffix}
      </p>
    </div>
  );
}
