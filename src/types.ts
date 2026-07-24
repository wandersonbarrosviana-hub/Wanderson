export type TradeResultType = 'Gain' | 'Loss' | '0x0';

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
}

export interface AppSettings {
  initialBalance: number; // Legacy, kept for backward compatibility
  accounts: Account[];
}

export type TradeDirection = 'Compra' | 'Venda';

export interface Trade {
  id: string;
  accountId?: string; // Optional for backward compatibility
  date: string; // ISO String
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
  imageUrl?: string;
  canvasData?: string; // Serialized Konva data
}
