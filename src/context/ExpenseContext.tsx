import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Receipt, CategoryData } from '../types';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

interface ExpenseContextType {
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (receipt: Receipt) => void;
  deleteReceipt: (receiptId: string) => void;
  categoryData: CategoryData;
  addCategory: (name: string) => void;
  addSubCategory: (category: string, sub: string) => void;
  addLabel: (label: string) => void;
  resetAll: () => void;
  updateCategory: (oldName: string, newName: string) => void;
  updateSubCategory: (category: string, oldSub: string, newSub: string) => void;
  updateLabel: (oldLabel: string, newLabel: string) => void;
  removeCategory: (name: string, reassignTo?: string) => void;
  removeSubCategory: (category: string, sub: string, reassignToSub?: string) => void;
  removeLabel: (label: string) => void;
  importData: (payload: { receipts: Receipt[]; categoryData: CategoryData }) => void;
  autoBackup: boolean;
  setAutoBackup: (enabled: boolean) => void;
  restoreFromLocalBackup: () => void;
  pushToFirestore: () => Promise<void>;
  pullFromFirestore: () => Promise<void>;
  isPushing: boolean;
  isPulling: boolean;
  lastPushTime: Date | null;
  lastPullTime: Date | null;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [lastPushTime, setLastPushTime] = useState<Date | null>(null);
  const [lastPullTime, setLastPullTime] = useState<Date | null>(null);
  const RECEIPTS_KEY = 'expenseRecorder.receipts';
  const CATEGORY_DATA_KEY = 'expenseRecorder.categoryData';
  const BACKUP_KEY = 'expenseRecorder.backup';
  const AUTO_BACKUP_KEY = 'expenseRecorder.autoBackup';

  const defaultCategoryData: CategoryData = {
    categories: {
      Uncategorized: [],
      Food: ['Groceries', 'Dining Out'],
      Transportation: ['Gas', 'Public Transit'],
      Entertainment: ['Movies', 'Games'],
    },
    labels: ['Organic', 'Discount', 'Gift', 'Bulk'],
  };

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    try {
      const raw = localStorage.getItem(RECEIPTS_KEY);
      if (raw) {
        return JSON.parse(raw) as Receipt[];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [categoryData, setCategoryData] = useState<CategoryData>(() => {
    try {
      const raw = localStorage.getItem(CATEGORY_DATA_KEY);
      const parsed = raw ? (JSON.parse(raw) as CategoryData) : null;
      if (parsed && parsed.categories && parsed.labels) {
        return parsed;
      }
      return defaultCategoryData;
    } catch {
      return defaultCategoryData;
    }
  });

  const [autoBackup, setAutoBackupState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(AUTO_BACKUP_KEY);
      return raw ? !!JSON.parse(raw) : true;
    } catch {
      return true;
    }
  });

  const setAutoBackup = (enabled: boolean) => {
    setAutoBackupState(enabled);
    try { localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(enabled)); } catch {}
  };

  const addReceipt = (receipt: Receipt) => {
    setReceipts(prev => [...prev, receipt]);
  };

  const updateReceipt = (receipt: Receipt) => {
    setReceipts(prev => prev.map(r => r.id === receipt.id ? receipt : r));
  };

  const deleteReceipt = (receiptId: string) => {
    setReceipts(prev => prev.filter(r => r.id !== receiptId));
  };

  const addCategory = (name: string) => {
    if (!categoryData.categories[name]) {
      setCategoryData(prev => ({
        ...prev,
        categories: { ...prev.categories, [name]: [] }
      }));
    }
  };

  const addSubCategory = (category: string, sub: string) => {
    if (categoryData.categories[category] && !categoryData.categories[category].includes(sub)) {
      setCategoryData(prev => ({
        ...prev,
        categories: {
          ...prev.categories,
          [category]: [...prev.categories[category], sub]
        }
      }));
    }
  };

  const addLabel = (label: string) => {
    if (!categoryData.labels.includes(label)) {
      setCategoryData(prev => ({
        ...prev,
        labels: [...prev.labels, label]
      }));
    }
  };

  const updateCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    if (categoryData.categories[trimmed]) return; // avoid overwrite
    
    // First update category data
    setCategoryData(prev => {
      const { [oldName]: oldSubs, ...rest } = prev.categories;
      if (!oldSubs) return prev;
      return {
        ...prev,
        categories: { ...rest, [trimmed]: oldSubs },
      };
    });
    
    // Then update all receipts to use new category name
    setReceipts(prev => prev.map(r => ({
      ...r,
      items: r.items.map(i => i.category === oldName ? { ...i, category: trimmed } : i)
    })));
  };

  const updateSubCategory = (category: string, oldSub: string, newSub: string) => {
    const trimmed = newSub.trim();
    if (!trimmed || oldSub === trimmed) return;
    const subs = categoryData.categories[category] || [];
    if (subs.includes(trimmed)) return; // already exists
    setCategoryData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: (prev.categories[category] || []).map(s => s === oldSub ? trimmed : s)
      }
    }));
    setReceipts(prev => prev.map(r => ({
      ...r,
      items: r.items.map(i => (i.category === category && i.subCategory === oldSub) ? { ...i, subCategory: trimmed } : i)
    })));
  };

  const updateLabel = (oldLabel: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed || oldLabel === trimmed) return;
    if (categoryData.labels.includes(trimmed)) return; // avoid duplicate
    setCategoryData(prev => ({
      ...prev,
      labels: prev.labels.map(l => l === oldLabel ? trimmed : l)
    }));
    setReceipts(prev => prev.map(r => ({
      ...r,
      items: r.items.map(i => ({
        ...i,
        labels: i.labels.map(l => l === oldLabel ? trimmed : l)
      }))
    })));
  };

  const removeCategory = (name: string, reassignTo?: string) => {
    if (name === 'Uncategorized') return; // safeguard: do not delete default
    const inUse = receipts.some(r => r.items.some(i => i.category === name));
    const target = inUse && !reassignTo ? 'Uncategorized' : reassignTo;
    
    // First update receipts
    setReceipts(prev => prev.map(r => ({
      ...r,
      items: r.items.map(i => {
        if (i.category !== name) return i;
        if (target) return { ...i, category: target };
        return i;
      })
    })));
    
    // Then remove category from categoryData
    setCategoryData(prev => {
      const { [name]: subsToMove = [], ...restCats } = prev.categories;
      let newCats = restCats;
      const ensureTarget = target || undefined;
      if (ensureTarget && restCats[ensureTarget] !== undefined) {
        const existingTargetSubs = restCats[ensureTarget] || [];
        const targetSubs = new Set([...(existingTargetSubs)]);
        for (const s of subsToMove) targetSubs.add(s);
        newCats = { ...restCats, [ensureTarget]: Array.from(targetSubs) };
      }
      return { ...prev, categories: newCats };
    });
  };

  const removeSubCategory = (category: string, sub: string, reassignToSub?: string) => {
    const inUse = receipts.some(r => r.items.some(i => i.category === category && i.subCategory === sub));
    if (inUse && !reassignToSub) return; // safeguard
    setReceipts(prev => prev.map(r => ({
      ...r,
      items: r.items.map(i => {
        if (i.category === category && i.subCategory === sub) {
          if (reassignToSub) return { ...i, subCategory: reassignToSub };
        }
        return i;
      })
    })));
    setCategoryData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: (prev.categories[category] || []).filter(s => s !== sub)
      }
    }));
  };

  const removeLabel = (label: string) => {
    setCategoryData(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l !== label)
    }));
    setReceipts(prev => prev.map(r => ({
      ...r,
      items: r.items.map(i => ({
        ...i,
        labels: i.labels.filter(l => l !== label)
      }))
    })));
  };

  const resetAll = () => {
    try {
      localStorage.removeItem(RECEIPTS_KEY);
      localStorage.removeItem(CATEGORY_DATA_KEY);
    } catch {}
    setReceipts([]);
    setCategoryData(defaultCategoryData);
  };

  const importData: ExpenseContextType['importData'] = (payload) => {
    const safeReceipts = Array.isArray(payload?.receipts) ? payload.receipts : [];
    const incoming = payload?.categoryData;
    const safeCategoryData: CategoryData = incoming && incoming.categories && incoming.labels
      ? {
          categories: {
            // ensure required default persists
            Uncategorized: Array.from(new Set([...(incoming.categories['Uncategorized'] || [])])),
            ...Object.fromEntries(Object.entries(incoming.categories).filter(([k]) => k !== 'Uncategorized')),
          },
          labels: Array.isArray(incoming.labels) ? incoming.labels : [],
        }
      : defaultCategoryData;

    setReceipts(safeReceipts);
    setCategoryData(safeCategoryData);
    try {
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify(safeReceipts));
      localStorage.setItem(CATEGORY_DATA_KEY, JSON.stringify(safeCategoryData));
    } catch {}
  };

  // Persist to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
    } catch {}
  }, [receipts]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORY_DATA_KEY, JSON.stringify(categoryData));
    } catch {}
  }, [categoryData]);

  // Push local data to Firestore
  const pushToFirestore = async () => {
    if (!user || authLoading) {
      console.log('Cannot push: User not logged in');
      return;
    }

    setIsPushing(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      console.log('📤 Pushing to Firestore...');
      
      // Use setDoc without merge to completely overwrite with local data
      // This ensures deletions are reflected in Firestore
      await setDoc(userDocRef, {
        receipts,
        categoryData,
        updatedAt: new Date().toISOString(),
      });
      
      setLastPushTime(new Date());
      console.log('✅ Push completed successfully');
    } catch (error) {
      console.error('❌ Error pushing to Firestore:', error);
      throw error;
    } finally {
      setIsPushing(false);
    }
  };

  // Pull data from Firestore
  const pullFromFirestore = async () => {
    if (!user || authLoading) {
      console.log('Cannot pull: User not logged in');
      return;
    }

    setIsPulling(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      console.log('📥 Pulling from Firestore...');
      
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Received data from Firestore:', { 
          receiptsCount: data.receipts?.length || 0,
          categoriesCount: Object.keys(data.categoryData?.categories || {}).length 
        });
        
        if (data.receipts) {
          setReceipts(data.receipts);
        }
        if (data.categoryData) {
          setCategoryData(data.categoryData);
        }
        
        setLastPullTime(new Date());
        console.log('✅ Pull completed successfully');
      } else {
        console.log('No data found in Firestore');
      }
    } catch (error) {
      console.error('❌ Error pulling from Firestore:', error);
      throw error;
    } finally {
      setIsPulling(false);
    }
  };

  // Auto-backup snapshot of both receipts and categoryData
  useEffect(() => {
    if (!autoBackup) return;
    try {
      const snapshot = {
        receipts,
        categoryData,
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
    } catch {}
  }, [receipts, categoryData, autoBackup]);

  const restoreFromLocalBackup = () => {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.receipts || !parsed.categoryData) return;
      importData({ receipts: parsed.receipts as Receipt[], categoryData: parsed.categoryData as CategoryData });
    } catch {}
  };

  return (
    <ExpenseContext.Provider value={{ 
      receipts, 
      addReceipt, 
      updateReceipt,
      deleteReceipt, 
      categoryData, 
      addCategory, 
      addSubCategory, 
      addLabel, 
      resetAll, 
      updateCategory, 
      updateSubCategory, 
      updateLabel, 
      removeCategory, 
      removeSubCategory, 
      removeLabel, 
      importData, 
      autoBackup, 
      setAutoBackup, 
      restoreFromLocalBackup,
      pushToFirestore,
      pullFromFirestore,
      isPushing,
      isPulling,
      lastPushTime,
      lastPullTime
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within ExpenseProvider');
  return context;
};