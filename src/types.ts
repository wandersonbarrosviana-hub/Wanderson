export type TradeResultType = 'Gain' | 'Loss' | '0x0';

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
}

export interface AppSettings {
  initialBalance: number; // Legacy, kept for backward compatibility
  accounts: Account[];
  dailyRiskLimit?: number;
  riskPerTradeLimit?: number;
  maxTradesPerDay?: number;
  setups?: string[];
}

export const DEFAULT_SETUPS = [
  'Trade abertura',
  'Rejeição de fundo',
  'Rejeição de topo',
  'Retorno/Pullback',
  'Barra elefante (a favor da tendência)',
  'Barra elefante (falha de continuação de tendência)'
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
}
