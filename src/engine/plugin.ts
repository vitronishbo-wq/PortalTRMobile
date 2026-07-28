export interface Observer<T> {
  next: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
}

export interface Subscription {
  unsubscribe: () => void;
}

export interface Observable<T = any> {
  subscribe(observer: Observer<T> | ((value: T) => void)): Subscription;
  getHistory?(): T[];
}

export class PluginEventSubject<T = any> implements Observable<T> {
  private observers: Array<Observer<T>> = [];
  private eventHistory: T[] = [];

  subscribe(observer: Observer<T> | ((value: T) => void)): Subscription {
    const obs: Observer<T> = typeof observer === 'function' ? { next: observer } : observer;
    this.observers.push(obs);
    return {
      unsubscribe: () => {
        this.observers = this.observers.filter((o) => o !== obs);
      }
    };
  }

  next(value: T): void {
    this.eventHistory.unshift(value);
    if (this.eventHistory.length > 50) this.eventHistory.pop();
    this.observers.forEach((obs) => {
      try {
        obs.next(value);
      } catch (err) {
        if (obs.error) obs.error(err);
      }
    });
  }

  getHistory(): T[] {
    return [...this.eventHistory];
  }
}

/**
 * Standard Plugin Interface across all runtime modules.
 */
export interface Plugin<TEvent = any> {
  id: string;
  name: string;
  version: string;
  initialize(runtime?: any): Promise<void> | void;
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
  health(): number;
  events(): Observable<TEvent>;
}
