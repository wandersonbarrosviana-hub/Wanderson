import { Trade, AppSettings, DEFAULT_SETUPS } from './types';

const STORAGE_KEY = 'trading_diary_trades';
const SETTINGS_KEY = 'trading_diary_settings';

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      let needsSave = false;

      if (!parsed.accounts || parsed.accounts.length === 0) {
        // Migrate legacy settings
        parsed.accounts = [
          {
            id: 'default',
            name: 'Conta Principal',
            initialBalance: parsed.initialBalance || 0
          }
        ];
        needsSave = true;
      }

      if (!parsed.setups) {
        parsed.setups = [...DEFAULT_SETUPS];
        needsSave = true;
      }

      if (needsSave) {
        saveSettings(parsed);
      }
      return parsed;
    }
    return { 
      initialBalance: 0, 
      accounts: [{ id: 'default', name: 'Conta Principal', initialBalance: 0 }],
      setups: [...DEFAULT_SETUPS]
    };
  } catch (error) {
    return { 
      initialBalance: 0, 
      accounts: [{ id: 'default', name: 'Conta Principal', initialBalance: 0 }],
      setups: [...DEFAULT_SETUPS]
    };
  }
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings', error);
  }
};

export const getTrades = (): Trade[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse trades from local storage', error);
    return [];
  }
};

export const saveTrades = (trades: Trade[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch (error) {
    console.error('Failed to save trades to local storage', error);
  }
};

export const addTrade = (trade: Trade) => {
  const trades = getTrades();
  trades.push(trade);
  saveTrades(trades);
};

export const deleteTrade = (id: string) => {
  const trades = getTrades();
  saveTrades(trades.filter(t => t.id !== id));
};
