import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MultiDeviceMeshEngine } from './multiDeviceMeshEngine';

export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
  sourceDevice: string;
  category?: 'text' | 'phone' | 'otp' | 'command' | 'link';
}

const LOCAL_STORAGE_HISTORY_KEY = 'portaltr_clipboard_history';
const LOCAL_STORAGE_ACTIVE_KEY = 'portaltr_clipboard_active';

export class ClipboardEngineSingleton {
  private static instance: ClipboardEngineSingleton;
  private history: ClipboardItem[] = [];
  private activeItem: ClipboardItem | null = null;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.loadFromStorage();

    // Cross-tab synchronization via storage event
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === LOCAL_STORAGE_HISTORY_KEY || e.key === LOCAL_STORAGE_ACTIVE_KEY) {
          this.loadFromStorage();
          this.notify();
        }
      });
    }

    // Sync with multi-device mesh
    MultiDeviceMeshEngine.subscribeSession((session) => {
      if (session?.sharedClipboard && session.sharedClipboard !== this.activeItem?.text) {
        this.setClipboardInternal(session.sharedClipboard, 'Mesh Device', false);
      }
    });
  }

  public static getInstance(): ClipboardEngineSingleton {
    if (!ClipboardEngineSingleton.instance) {
      ClipboardEngineSingleton.instance = new ClipboardEngineSingleton();
    }
    return ClipboardEngineSingleton.instance;
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }

      const savedActive = localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
      if (savedActive) {
        this.activeItem = JSON.parse(savedActive);
      }
    } catch (err) {
      console.warn('[ClipboardEngine] Error loading from localStorage:', err);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(this.history));
      if (this.activeItem) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, JSON.stringify(this.activeItem));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_KEY);
      }
    } catch (err) {
      console.warn('[ClipboardEngine] Error saving to localStorage:', err);
    }
  }

  public async copyText(text: string, source: string = 'Local Device'): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch (e) {
      console.warn('[ClipboardEngine] Native clipboard write fallback:', e);
    }

    this.setClipboardInternal(text, source, true);
    return true;
  }

  public async readText(): Promise<string> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          this.setClipboardInternal(text, 'System Pasteboard', false);
          return text;
        }
      }
    } catch (e) {
      console.warn('[ClipboardEngine] Native clipboard read error:', e);
    }

    return this.activeItem?.text || '';
  }

  private setClipboardInternal(text: string, sourceDevice: string, broadcastToMesh: boolean) {
    if (!text || !text.trim()) return;

    let category: 'text' | 'phone' | 'otp' | 'command' | 'link' = 'text';
    const trimmed = text.trim();
    if (/^\+?[0-9\s\-()]{7,15}$/.test(trimmed)) category = 'phone';
    else if (/^\d{4,8}$/.test(trimmed)) category = 'otp';
    else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) category = 'link';
    else if (trimmed.startsWith('/')) category = 'command';

    const newItem: ClipboardItem = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      timestamp: Date.now(),
      sourceDevice,
      category
    };

    this.activeItem = newItem;
    this.history = [newItem, ...this.history.filter((i) => i.text !== trimmed)].slice(0, 30);

    this.saveToStorage();

    if (broadcastToMesh) {
      MultiDeviceMeshEngine.syncSharedClipboard(trimmed);
    }

    this.notify();
  }

  public getActiveItem(): ClipboardItem | null {
    return this.activeItem;
  }

  public getHistory(): ClipboardItem[] {
    return this.history;
  }

  public clearHistory() {
    this.history = [];
    this.activeItem = null;
    this.saveToStorage();
    this.notify();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    callback();
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }
}

export const ClipboardEngine = ClipboardEngineSingleton.getInstance();
export type ClipboardEngineService = ClipboardEngineSingleton;

// React Context Integration
interface ClipboardContextType {
  activeItem: ClipboardItem | null;
  history: ClipboardItem[];
  copyText: (text: string, source?: string) => Promise<boolean>;
  readText: () => Promise<string>;
  clearHistory: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeItem, setActiveItem] = useState<ClipboardItem | null>(ClipboardEngine.getActiveItem());
  const [history, setHistory] = useState<ClipboardItem[]>(ClipboardEngine.getHistory());

  useEffect(() => {
    const unsubscribe = ClipboardEngine.subscribe(() => {
      setActiveItem(ClipboardEngine.getActiveItem());
      setHistory(ClipboardEngine.getHistory());
    });
    return () => unsubscribe();
  }, []);

  const copyText = (text: string, source?: string) => ClipboardEngine.copyText(text, source);
  const readText = () => ClipboardEngine.readText();
  const clearHistory = () => ClipboardEngine.clearHistory();

  return (
    <ClipboardContext.Provider value={{ activeItem, history, copyText, readText, clearHistory }}>
      {children}
    </ClipboardContext.Provider>
  );
};

export const useClipboard = (): ClipboardContextType => {
  const context = useContext(ClipboardContext);
  if (!context) {
    // Graceful fallback if used outside Provider
    return {
      activeItem: ClipboardEngine.getActiveItem(),
      history: ClipboardEngine.getHistory(),
      copyText: (text: string, source?: string) => ClipboardEngine.copyText(text, source),
      readText: () => ClipboardEngine.readText(),
      clearHistory: () => ClipboardEngine.clearHistory()
    };
  }
  return context;
};
