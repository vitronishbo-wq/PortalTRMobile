export interface WebhookDeliveryJob {
  id: string;
  url: string;
  payload: any;
  status: 'PENDING' | 'RETRYING' | 'SUCCESS' | 'DEAD_LETTER';
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: number;
  createdAt: number;
  lastError?: string;
  responseStatus?: number;
  history: Array<{
    timestamp: number;
    attempt: number;
    error?: string;
    status?: number;
  }>;
}

export class WebhookRetryQueueEngine {
  private static jobs: WebhookDeliveryJob[] = [
    {
      id: 'job-wh-001',
      url: 'https://minhaempresa.co.ao/api/pagamentos',
      payload: { event: 'SMS_BAI_RECEIVED', amount: '50000 Kz', sender: 'BAI' },
      status: 'SUCCESS',
      attempts: 1,
      maxAttempts: 5,
      nextAttemptAt: Date.now(),
      createdAt: Date.now() - 3600000,
      responseStatus: 200,
      history: [{ timestamp: Date.now() - 3600000, attempt: 1, status: 200 }]
    }
  ];

  private static initialDelayMs = 2000; // 2 seconds
  private static backoffFactor = 2;     // exponential multiplier x2
  private static maxAttempts = 5;       // up to 5 retries before Dead-Letter Queue

  /**
   * Schedules a webhook for delivery with automatic exponential backoff retry logic
   */
  static enqueueWebhook(url: string, payload: any): WebhookDeliveryJob {
    const job: WebhookDeliveryJob = {
      id: `wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      url,
      payload,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: WebhookRetryQueueEngine.maxAttempts,
      nextAttemptAt: Date.now(),
      createdAt: Date.now(),
      history: []
    };

    WebhookRetryQueueEngine.jobs.unshift(job);
    // Trigger async processing
    setTimeout(() => WebhookRetryQueueEngine.processJob(job), 10);
    return job;
  }

  /**
   * Processes a single job, retrying with exponential backoff if failed
   */
  static async processJob(job: WebhookDeliveryJob): Promise<WebhookDeliveryJob> {
    if (job.status === 'SUCCESS' || job.status === 'DEAD_LETTER') return job;

    job.attempts += 1;
    const now = Date.now();

    try {
      if (typeof fetch !== 'undefined') {
        const response = await fetch(job.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Vitronis-COS-WebhookWorker/2.4'
          },
          body: JSON.stringify(job.payload)
        });

        job.responseStatus = response.status;
        job.history.push({
          timestamp: now,
          attempt: job.attempts,
          status: response.status
        });

        if (response.ok) {
          job.status = 'SUCCESS';
          return job;
        } else {
          job.lastError = `HTTP Status ${response.status} ${response.statusText}`;
        }
      } else {
        // Simulated success for test mode
        job.status = 'SUCCESS';
        job.responseStatus = 200;
        job.history.push({ timestamp: now, attempt: job.attempts, status: 200 });
        return job;
      }
    } catch (err: any) {
      job.lastError = err.message || 'Network connection failed';
      job.history.push({
        timestamp: now,
        attempt: job.attempts,
        error: job.lastError
      });
    }

    // Handle Failure and Exponential Backoff calculation
    if (job.attempts < job.maxAttempts) {
      job.status = 'RETRYING';
      const delay = WebhookRetryQueueEngine.initialDelayMs * Math.pow(WebhookRetryQueueEngine.backoffFactor, job.attempts - 1);
      job.nextAttemptAt = now + delay;

      // Schedule next retry
      setTimeout(() => WebhookRetryQueueEngine.processJob(job), delay);
    } else {
      job.status = 'DEAD_LETTER';
    }

    return job;
  }

  static getJobs(): WebhookDeliveryJob[] {
    return [...WebhookRetryQueueEngine.jobs];
  }

  static retryDeadLetterJob(jobId: string): WebhookDeliveryJob | undefined {
    const job = WebhookRetryQueueEngine.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = 'PENDING';
      job.attempts = 0;
      job.nextAttemptAt = Date.now();
      WebhookRetryQueueEngine.processJob(job);
    }
    return job;
  }
}
