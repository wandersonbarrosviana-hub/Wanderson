import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trade, AppSettings } from '../types';
import { getTrades as getLocalTrades, getSettings as getLocalSettings } from '../store';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const sanitizeData = (data: any) => {
  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    } else {
      sanitized[key] = null;
    }
  });
  return sanitized;
};

export const useTradeSync = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getLocalSettings());
  const [loading, setLoading] = useState(true);

  // Sync Trades
  useEffect(() => {
    if (!user) {
      setTrades(getLocalTrades());
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'trades'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesData: Trade[] = [];
      snapshot.forEach((doc) => {
        tradesData.push(doc.data() as Trade);
      });
      // Sort by date desc
      tradesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTrades(tradesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/trades`);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Sync Settings
  useEffect(() => {
    if (!user) {
      setSettings(getLocalSettings());
      return;
    }

    const settingsDoc = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return unsubscribe;
  }, [user]);

  // Migration logic: Move local data to Firestore on first login
  useEffect(() => {
    const migrate = async () => {
      if (user) {
        const settingsPath = `users/${user.uid}`;
        const settingsDoc = doc(db, settingsPath);
        try {
          const snapshot = await getDoc(settingsDoc);
          
          // If Firestore is empty for this user, migrate local storage
          if (!snapshot.exists()) {
            const localTrades = getLocalTrades();
            const localSettings = getLocalSettings();

            const batch = writeBatch(db);
            
            // Save settings
            batch.set(settingsDoc, sanitizeData(localSettings));
            
            // Save trades
            localTrades.forEach(trade => {
              const tradeDoc = doc(db, 'users', user.uid, 'trades', trade.id);
              batch.set(tradeDoc, sanitizeData(trade));
            });

            await batch.commit();
            console.log("Migration to Firestore complete");
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, settingsPath);
        }
      }
    };
    migrate();
  }, [user]);

  const addTradeSync = useCallback(async (trade: Trade) => {
    if (user) {
      const path = `users/${user.uid}/trades/${trade.id}`;
      try {
        const tradeDoc = doc(db, path);
        await setDoc(tradeDoc, sanitizeData(trade));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  }, [user]);

  const updateTradeSync = useCallback(async (trade: Trade) => {
    if (user) {
      const path = `users/${user.uid}/trades/${trade.id}`;
      try {
        const tradeDoc = doc(db, path);
        await setDoc(tradeDoc, sanitizeData(trade));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  }, [user]);

  const deleteTradeSync = useCallback(async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/trades/${id}`;
      try {
        const tradeDoc = doc(db, path);
        await deleteDoc(tradeDoc);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  }, [user]);

  const updateSettingsSync = useCallback(async (newSettings: AppSettings) => {
    if (user) {
      const path = `users/${user.uid}`;
      try {
        const settingsDoc = doc(db, path);
        await setDoc(settingsDoc, sanitizeData(newSettings));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  }, [user]);

  return {
    trades,
    settings,
    loading,
    addTrade: addTradeSync,
    updateTrade: updateTradeSync,
    deleteTrade: deleteTradeSync,
    updateSettings: updateSettingsSync
  };
};
