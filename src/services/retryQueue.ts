import { dlqAlertService } from './dlqAlertService.js';
import { queuePersistenceEngine } from './queuePersistence.js';

type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, listener: EventCallback): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.length === 0) return false;
    callbacks.forEach((fn) => fn(...args));
    return true;
  }

  off(event: string, listener: EventCallback): this {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter((fn) => fn !== listener));
    }
    return this;
  }
}

export interface RetryJob {
  id: string;
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  payload: any;
  headers: Record<string, string>;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number; // timestamp
  lastError?: string;
  createdAt?: number;
  workspaceId?: string;
  eventId?: string;
}

export interface RetryQueueStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  deadLetterJobs: number;
}

export class RetryQueue extends EventEmitter {
  private jobs: RetryJob[] = [];
  private deadLetter: RetryJob[] = [];
  private processing: boolean = false;
  private maxConcurrent: number = 5;
  private activeJobs: number = 0;

  constructor() {
    super();

    // Attach logging and persistence triggers
    this.on('job:enqueued', (job: RetryJob) => {
      console.log(`[RetryQueue] Job ${job.id} enfileirado para ${job.url}`);
      this.persistState();
    });

    this.on('job:success', (job: RetryJob) => {
      console.log(`[RetryQueue] Job ${job.id} entregue com sucesso`);
      this.persistState();
    });

    this.on('job:retry', (job: RetryJob) => {
      console.log(`[RetryQueue] Job ${job.id} falhou, retentativa ${job.retryCount}/${job.maxRetries} em ${new Date(job.nextRetryAt).toISOString()}`);
      this.persistState();
    });

    this.on('job:deadletter', (job: RetryJob) => {
      console.error(`[RetryQueue] Job ${job.id} movido para DLQ após ${job.retryCount} tentativas. Erro: ${job.lastError}`);
      this.persistState();
      dlqAlertService.handleDLQEvent(job, this.broadcaster).catch((err) => {
        console.error('[RetryQueue] Erro ao disparar alertas de DLQ:', err);
      });
    });

    this.on('dlq:cleared', () => {
      this.persistState();
    });

    this.on('job:requeued', () => {
      this.persistState();
    });

    // Auto-restore state on boot
    this.initPersistence();
  }

  private async initPersistence() {
    try {
      const snapshot = await queuePersistenceEngine.loadSnapshot();
      if (snapshot) {
        if (Array.isArray(snapshot.pendingJobs) && snapshot.pendingJobs.length > 0) {
          this.jobs = [...this.jobs, ...snapshot.pendingJobs];
        }
        if (Array.isArray(snapshot.deadLetterJobs) && snapshot.deadLetterJobs.length > 0) {
          this.deadLetter = [...this.deadLetter, ...snapshot.deadLetterJobs];
        }
        if (this.jobs.length > 0) {
          this.scheduleProcessing();
        }
      }
    } catch (err) {
      console.error('[RetryQueue] Erro na inicialização da persistência:', err);
    }
  }

  private persistState() {
    queuePersistenceEngine.saveSnapshot(this.jobs, this.deadLetter).catch(() => null);
  }

  private broadcaster?: (data: any) => void;

  public setBroadcaster(fn: (data: any) => void) {
    this.broadcaster = fn;
  }

  enqueue(
    url: string,
    payload: any,
    headers: Record<string, string> = {},
    options: { maxRetries?: number; workspaceId?: string; eventId?: string; method?: 'POST' | 'PUT' | 'PATCH' } = {}
  ): string {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `retry-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const job: RetryJob = {
      id,
      url,
      method: options.method || 'POST',
      payload,
      headers,
      retryCount: 0,
      maxRetries: options.maxRetries || 5,
      nextRetryAt: Date.now() + this.getBackoffDelay(0),
      createdAt: Date.now(),
      workspaceId: options.workspaceId,
      eventId: options.eventId,
    };
    this.jobs.push(job);
    this.emit('job:enqueued', job);
    this.scheduleProcessing();
    return id;
  }

  private getBackoffDelay(retryCount: number): number {
    const base = 1000; // 1s
    const maxDelay = 60000; // 60s
    // Exponential: 1s, 2s, 4s, 8s, 16s, 32s, 60s
    const delay = base * Math.pow(2, retryCount);
    // Add random jitter (0-20% of delay)
    const jitter = delay * 0.2 * Math.random();
    return Math.min(delay + jitter, maxDelay);
  }

  private scheduleProcessing(): void {
    if (this.processing) return;
    this.processing = true;
    setTimeout(() => this.processNext(), 0);
  }

  private async processNext(): Promise<void> {
    if (this.activeJobs >= this.maxConcurrent) {
      setTimeout(() => this.scheduleProcessing(), 100);
      return;
    }

    const now = Date.now();
    const index = this.jobs.findIndex((j) => j.nextRetryAt <= now);
    if (index === -1) {
      if (this.jobs.length > 0) {
        const nextJob = this.jobs.reduce((min, j) => (j.nextRetryAt < min.nextRetryAt ? j : min));
        const delay = Math.max(0, nextJob.nextRetryAt - now);
        setTimeout(() => {
          this.processing = false;
          this.scheduleProcessing();
        }, delay);
      } else {
        this.processing = false;
      }
      return;
    }

    const job = this.jobs[index];
    this.activeJobs++;
    this.jobs.splice(index, 1);

    try {
      this.emit('job:start', job);

      if (typeof fetch !== 'undefined') {
        const response = await fetch(job.url, {
          method: job.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Vitronis-Retry-Count': String(job.retryCount),
            'X-Vitronis-Job-Id': job.id,
            ...job.headers,
          },
          body: JSON.stringify(job.payload),
        });

        if (response.ok) {
          this.emit('job:success', job);
        } else {
          const errorText = await response.text().catch(() => `HTTP ${response.status}`);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } else {
        this.emit('job:success', job);
      }
    } catch (error: any) {
      job.lastError = error.message || 'Erro desconhecido';
      job.retryCount++;

      if (job.retryCount < job.maxRetries) {
        job.nextRetryAt = Date.now() + this.getBackoffDelay(job.retryCount);
        this.jobs.push(job);
        this.emit('job:retry', job);
      } else {
        this.deadLetter.push(job);
        this.emit('job:deadletter', job);
      }
    } finally {
      this.activeJobs--;
      this.processing = false;
      this.scheduleProcessing();
    }
  }

  getStats(): RetryQueueStats {
    return {
      totalJobs: this.jobs.length + this.deadLetter.length + this.activeJobs,
      pendingJobs: this.jobs.length,
      processingJobs: this.activeJobs,
      deadLetterJobs: this.deadLetter.length,
    };
  }

  getJobs(): RetryJob[] {
    return [...this.jobs];
  }

  getDeadLetterJobs(): RetryJob[] {
    return [...this.deadLetter];
  }

  clearDeadLetter(): void {
    this.deadLetter = [];
    this.emit('dlq:cleared');
  }

  requeueFromDeadLetter(jobId: string): boolean {
    const index = this.deadLetter.findIndex((j) => j.id === jobId);
    if (index === -1) return false;
    const job = this.deadLetter.splice(index, 1)[0];
    job.retryCount = 0;
    job.nextRetryAt = Date.now() + 1000;
    this.jobs.push(job);
    this.emit('job:requeued', job);
    this.scheduleProcessing();
    return true;
  }

  forceProcessAll(): void {
    for (const job of this.jobs) {
      job.nextRetryAt = Date.now();
    }
    this.scheduleProcessing();
  }
}

export const retryQueue = new RetryQueue();

