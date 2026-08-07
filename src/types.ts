export type TradeResultType = 'Gain' | 'Loss' | '0x0';

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  dailyRiskLimit?: number;
  riskPerTradeLimit?: number;
  maxTradesPerDay?: number;
}

export interface AppSettings {
  initialBalance: number; // Legacy, kept for backward compatibility
  accounts: Account[];
  dailyRiskLimit?: number;
  riskPerTradeLimit?: number;
  maxTradesPerDay?: number;
  setups?: string[];
  assets?: string[];
}

export const DEFAULT_SETUPS = [
  'Trade abertura',
  'Rejeição de fundo',
  'Rejeição de topo',
  'Retorno/Pullback',
  'Barra elefante (a favor da tendência)',
  'Barra elefante (falha de continuação de tendência)'
];

export const DEFAULT_ASSETS = [
  'HK (Hang Seng)', 
  'USATEC', 
  'DOW JONES', 
  'AUS200', 
  'MINI INDICE', 
  'MINI DOLAR',
  'AAPL (Apple)',
  'TSLA (Tesla)',
  'NVDA (NVIDIA)',
  'MSFT (Microsoft)',
  'AMZN (Amazon)',
  'GOOGL (Alphabet)',
  'META (Meta)'
];

export type TradeDirection = 'Compra' | 'Venda';

export interface Trade {
  id: string;
  accountId?: string; // Optional for backward compatibility
  date: string; // ISO String
  time?: string; // HH:mm:ss
  asset: string;
  direction?: TradeDirection;
  strategy?: string;
  entryPrice: number;
  initialStopPrice: number;
  targetPrice: number;
  exitPrice: number;
  resultType: TradeResultType;
  sentiment: string;
  isPartial: boolean;
  partialRationale?: string;
  description: string;
  resultValue: number;
  quantity?: number;
  ratingEntryQuality?: number;
  ratingDiscipline?: number;
  ratingExecution?: number;
  ratingManagement?: number;
  ratingEmotionalControl?: number;
  timeframe?: string;
  madeError?: boolean;
  errorDetails?: string;
  evalFollowedPlan?: boolean;
  evalRespectedSetup?: boolean;
  evalImpulseEntry?: boolean;
  evalMovedStop?: boolean;
  evalEarlyProfit?: boolean;
  initialStopFinancial?: number;
  targetFinancial?: number;
  trend?: 'a favor' | 'contra' | 'lateralizado';
  imageUrl?: string;
  annotatedImageUrl?: string;
  canvasData?: string; // Serialized Konva data
  isNoTradeDay?: boolean;
  noTradeReason?: string;
}
