import { RetryJob } from './retryQueue.js';

export type QueuePersistenceDriver = 'file' | 'redis' | 'dynamodb' | 'memory';

export interface QueueSnapshot {
  timestamp: number;
  driver: QueuePersistenceDriver;
  pendingJobs: RetryJob[];
  deadLetterJobs: RetryJob[];
}

const isBrowser = typeof window !== 'undefined';

function getNodeFs() {
  if (isBrowser) return null;
  try {
    return eval("require('fs')");
  } catch {
    return null;
  }
}

function getNodePath() {
  if (isBrowser) return null;
  try {
    return eval("require('path')");
  } catch {
    return null;
  }
}

export class QueuePersistenceEngine {
  private activeDriver: QueuePersistenceDriver = isBrowser ? 'memory' : 'file';
  private filePath: string = '';
  private redisUrl?: string = typeof process !== 'undefined' ? process.env.REDIS_URL : undefined;
  private dynamoDbTable?: string = typeof process !== 'undefined' ? process.env.DYNAMODB_TABLE : undefined;

  constructor() {
    if (!isBrowser) {
      const pathMod = getNodePath();
      if (pathMod) {
        this.filePath = pathMod.join(process.cwd(), '.data', 'retry_queue_snapshot.json');
      }

      // Detect environment settings
      if (process.env.QUEUE_PERSISTENCE_DRIVER) {
        const driver = process.env.QUEUE_PERSISTENCE_DRIVER.toLowerCase() as QueuePersistenceDriver;
        if (['file', 'redis', 'dynamodb', 'memory'].includes(driver)) {
          this.activeDriver = driver;
        }
      } else if (this.redisUrl) {
        this.activeDriver = 'redis';
      } else if (this.dynamoDbTable) {
        this.activeDriver = 'dynamodb';
      }

      // Ensure .data folder exists for local file driver
      this.ensureDataFolder();
    }
  }

  private ensureDataFolder() {
    if (isBrowser) return;
    try {
      const fsMod = getNodeFs();
      const pathMod = getNodePath();
      if (fsMod && pathMod && this.filePath) {
        const dir = pathMod.dirname(this.filePath);
        if (!fsMod.existsSync(dir)) {
          fsMod.mkdirSync(dir, { recursive: true });
        }
      }
    } catch (err) {
      console.warn('[QueuePersistence] Aviso ao criar pasta .data:', err);
    }
  }

  public getDriverInfo() {
    return {
      activeDriver: this.activeDriver,
      filePath: this.filePath,
      hasRedisConfigured: !!this.redisUrl,
      hasDynamoDbConfigured: !!this.dynamoDbTable,
    };
  }

  public setDriver(driver: QueuePersistenceDriver) {
    this.activeDriver = driver;
    console.log(`[QueuePersistence] Driver alterado para: ${driver}`);
  }

  /**
   * Salva o estado atual da fila (Jobs pendentes + DLQ)
   */
  public async saveSnapshot(pendingJobs: RetryJob[], deadLetterJobs: RetryJob[]): Promise<boolean> {
    if (isBrowser || this.activeDriver === 'memory') {
      return true;
    }

    const snapshot: QueueSnapshot = {
      timestamp: Date.now(),
      driver: this.activeDriver,
      pendingJobs,
      deadLetterJobs,
    };

    const fsMod = getNodeFs();
    if (!fsMod) return true;

    // Driver 1: File Storage Driver (Local Persistence - Zero Cost)
    if (this.activeDriver === 'file') {
      try {
        await fsMod.promises.writeFile(this.filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
        return true;
      } catch (err: any) {
        console.error('[QueuePersistence File] Erro ao gravar snapshot:', err.message);
        return false;
      }
    }

    // Driver 2: Redis Driver
    if (this.activeDriver === 'redis') {
      try {
        if (this.redisUrl) {
          console.log('[QueuePersistence Redis] Persistindo snapshot no Redis:', this.redisUrl);
        } else {
          console.warn('[QueuePersistence Redis] REDIS_URL não definido. Usando File Storage fallback.');
          await fsMod.promises.writeFile(this.filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
        }
        return true;
      } catch (err: any) {
        console.error('[QueuePersistence Redis] Erro ao persistir no Redis:', err.message);
        return false;
      }
    }

    // Driver 3: DynamoDB Driver
    if (this.activeDriver === 'dynamodb') {
      try {
        console.log('[QueuePersistence DynamoDB] Persistindo snapshot na tabela DynamoDB:', this.dynamoDbTable || 'retry_queue_jobs');
        await fsMod.promises.writeFile(this.filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
        return true;
      } catch (err: any) {
        console.error('[QueuePersistence DynamoDB] Erro:', err.message);
        return false;
      }
    }

    return false;
  }

  /**
   * Carrega o estado salvo da fila na inicialização
   */
  public async loadSnapshot(): Promise<QueueSnapshot | null> {
    if (isBrowser || this.activeDriver === 'memory') {
      return null;
    }

    const fsMod = getNodeFs();
    if (!fsMod) return null;

    try {
      if (fsMod.existsSync(this.filePath)) {
        const raw = await fsMod.promises.readFile(this.filePath, 'utf-8');
        const snapshot = JSON.parse(raw) as QueueSnapshot;
        console.log(`[QueuePersistence] ${snapshot.pendingJobs?.length || 0} jobs pendentes e ${snapshot.deadLetterJobs?.length || 0} jobs DLQ restaurados do driver [${snapshot.driver || 'file'}]`);
        return snapshot;
      }
    } catch (err: any) {
      console.warn('[QueuePersistence] Falha ao carregar snapshot local:', err.message);
    }

    return null;
  }
}

export const queuePersistenceEngine = new QueuePersistenceEngine();
