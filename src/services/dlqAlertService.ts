import { RetryJob } from './retryQueue.js';

export interface DLQAlertConfig {
  enabled: boolean;
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  customWebhookUrl?: string;
  notifyOnSSE: boolean;
  minRetryThreshold: number; // Only alert if retryCount >= threshold
}

export interface DLQAlertLog {
  id: string;
  timestamp: number;
  jobId: string;
  url: string;
  lastError: string;
  channelsSent: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export class DLQAlertService {
  private config: DLQAlertConfig = {
    enabled: true,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    customWebhookUrl: process.env.CUSTOM_DLQ_WEBHOOK_URL || '',
    notifyOnSSE: true,
    minRetryThreshold: 1,
  };

  private alertLogs: DLQAlertLog[] = [];

  constructor() {
    // If env vars exist on boot, log readiness
    if (this.config.slackWebhookUrl) {
      console.log('[DLQ Alert Service] Slack Webhook configurado via SLACK_WEBHOOK_URL');
    }
    if (this.config.discordWebhookUrl) {
      console.log('[DLQ Alert Service] Discord Webhook configurado via DISCORD_WEBHOOK_URL');
    }
  }

  public getConfig(): DLQAlertConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<DLQAlertConfig>): DLQAlertConfig {
    this.config = { ...this.config, ...newConfig };
    return this.getConfig();
  }

  public getAlertLogs(): DLQAlertLog[] {
    return [...this.alertLogs];
  }

  /**
   * Dispara alerta quando um Job entra na Dead Letter Queue (DLQ)
   */
  public async handleDLQEvent(job: RetryJob, sseBroadcaster?: (data: any) => void): Promise<DLQAlertLog> {
    const timestamp = Date.now();
    const channelsSent: string[] = [];
    let successCount = 0;
    let totalTargets = 0;

    // 1. Alert via Slack
    if (this.config.enabled && this.config.slackWebhookUrl) {
      totalTargets++;
      try {
        const slackPayload = {
          text: `🚨 *[PortalTRMobile DLQ Alert]* Job movido para Dead Letter Queue!`,
          attachments: [
            {
              color: '#ef4444',
              title: `Falha Crítica no Job ${job.id}`,
              fields: [
                { title: 'URL Destino', value: job.url, short: false },
                { title: 'Tentativas Realizadas', value: `${job.retryCount}/${job.maxRetries}`, short: true },
                { title: 'Evento ID', value: job.eventId || 'N/A', short: true },
                { title: 'Workspace', value: job.workspaceId || 'Default', short: true },
                { title: 'Erro Detalhado', value: job.lastError || 'Desconhecido', short: false },
              ],
              footer: 'PortalTRMobile DLQ Auto-Notification Engine',
              ts: Math.floor(timestamp / 1000),
            },
          ],
        };

        const res = await fetch(this.config.slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload),
        });

        if (res.ok) {
          channelsSent.push('Slack');
          successCount++;
        } else {
          console.error(`[DLQ Alert] Falha ao enviar para o Slack. HTTP ${res.status}`);
        }
      } catch (err: any) {
        console.error('[DLQ Alert] Erro na requisição Slack Webhook:', err.message);
      }
    }

    // 2. Alert via Discord
    if (this.config.enabled && this.config.discordWebhookUrl) {
      totalTargets++;
      try {
        const discordPayload = {
          username: 'PortalTRMobile DLQ Bot',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
          embeds: [
            {
              title: '🚨 DLQ ALERT: Job Falhou Permanentemente',
              description: `O job \`${job.id}\` atingiu o limite de retentativas e foi enviado para a Dead Letter Queue.`,
              color: 15548997, // Red
              fields: [
                { name: 'URL Destino', value: `\`${job.url}\``, inline: false },
                { name: 'Tentativas', value: `${job.retryCount}/${job.maxRetries}`, inline: true },
                { name: 'Workspace', value: job.workspaceId || 'ws-angola', inline: true },
                { name: 'Último Erro', value: `\`\`\`${job.lastError || 'N/A'}\`\`\``, inline: false },
              ],
              timestamp: new Date(timestamp).toISOString(),
            },
          ],
        };

        const res = await fetch(this.config.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload),
        });

        if (res.ok) {
          channelsSent.push('Discord');
          successCount++;
        }
      } catch (err: any) {
        console.error('[DLQ Alert] Erro na requisição Discord Webhook:', err.message);
      }
    }

    // 3. Alert via Custom Webhook
    if (this.config.enabled && this.config.customWebhookUrl) {
      totalTargets++;
      try {
        const res = await fetch(this.config.customWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'DLQ_JOB_ADDED',
            timestamp,
            job,
          }),
        });
        if (res.ok) {
          channelsSent.push('CustomWebhook');
          successCount++;
        }
      } catch (err: any) {
        console.error('[DLQ Alert] Erro no Custom Webhook:', err.message);
      }
    }

    // 4. SSE Stream Broadcast
    if (this.config.notifyOnSSE) {
      channelsSent.push('SSEStream');
      if (sseBroadcaster) {
        sseBroadcaster({
          topic: 'DLQ_ALERT',
          timestamp,
          data: {
            alertType: 'JOB_MOVED_TO_DLQ',
            jobId: job.id,
            url: job.url,
            retryCount: job.retryCount,
            lastError: job.lastError,
            channelsNotified: channelsSent,
          },
        });
      }
    }

    let status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
    if (totalTargets > 0 && successCount === 0) {
      status = 'FAILED';
    } else if (totalTargets > 0 && successCount < totalTargets) {
      status = 'PARTIAL';
    }

    const logItem: DLQAlertLog = {
      id: `dlq-alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      jobId: job.id,
      url: job.url,
      lastError: job.lastError || 'Desconhecido',
      channelsSent,
      status,
    };

    this.alertLogs = [logItem, ...this.alertLogs.slice(0, 49)];
    return logItem;
  }

  /**
   * Dispara alerta de teste
   */
  public async sendTestAlert(): Promise<DLQAlertLog> {
    const mockJob: RetryJob = {
      id: `test-job-${Math.floor(Math.random() * 9000 + 1000)}`,
      url: 'https://api.empresa.co.ao/v1/webhook/receiver',
      payload: { test: true, amount: 50000, currency: 'AOA' },
      headers: {},
      retryCount: 5,
      maxRetries: 5,
      nextRetryAt: Date.now(),
      lastError: 'HTTP 503 Service Unavailable: Conexão recusada pelo servidor remoto após 5 retentativas.',
      workspaceId: 'ws-angola-dev',
      eventId: 'evt-test-8819',
    };

    return this.handleDLQEvent(mockJob);
  }
}

export const dlqAlertService = new DLQAlertService();
