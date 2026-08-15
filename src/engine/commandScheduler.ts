// src/engine/commandScheduler.ts — Agendador de Comandos Temporizados (COS Command Scheduler)
// Diretriz 35: Execução imediata (*#SYNC#), agendada (*#SYNC:AT=23:00#) e periódica (*#BACKUP:EVERY=24H#)

export type ScheduledTaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ScheduledCommandTask {
  taskId: string;
  command: string;
  args: string[];
  params: Record<string, string>;
  status: ScheduledTaskStatus;
  scheduledType: 'IMMEDIATE' | 'AT_TIME' | 'INTERVAL';
  targetTimestamp?: number;
  intervalMs?: number;
  lastExecutedAt?: number;
  nextExecutionAt?: number;
  resultMessage?: string;
  createdAt: number;
  createdBy: string;
}

export class CommandScheduler {
  private static readonly STORAGE_KEY = 'portal_cos_scheduled_tasks';
  private static activeTimers: Map<string, any> = new Map();

  public static getTasks(): ScheduledCommandTask[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  private static saveTasks(tasks: ScheduledCommandTask[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  }

  /**
   * Agenda ou enfileira um comando
   */
  public static schedule(
    command: string,
    args: string[],
    params: Record<string, string>,
    executorFn: (task: ScheduledCommandTask) => Promise<{ success: boolean; message: string }>
  ): { scheduled: boolean; taskId: string; message: string; isImmediate: boolean } {
    const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    // 1. Verifica parâmetro AT=HH:MM ou AT=TIMESTAMP
    if (params.AT) {
      const atVal = params.AT.trim();
      let targetTime = now;

      if (atVal.includes(':')) {
        const [hours, minutes] = atVal.split(':').map(Number);
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        if (d.getTime() <= now) {
          d.setDate(d.getDate() + 1); // Agendado para o dia seguinte
        }
        targetTime = d.getTime();
      } else {
        targetTime = Number(atVal) || (now + 60000);
      }

      const delay = Math.max(0, targetTime - now);
      const task: ScheduledCommandTask = {
        taskId,
        command,
        args,
        params,
        status: 'PENDING',
        scheduledType: 'AT_TIME',
        targetTimestamp: targetTime,
        nextExecutionAt: targetTime,
        createdAt: now,
        createdBy: 'cos_scheduler'
      };

      const tasks = this.getTasks();
      tasks.unshift(task);
      this.saveTasks(tasks);

      const timer = setTimeout(async () => {
        await this.runTask(taskId, executorFn);
      }, delay);
      this.activeTimers.set(taskId, timer);

      return {
        scheduled: true,
        taskId,
        message: `Comando agendado para execução às ${new Date(targetTime).toLocaleTimeString('pt-AO')} (ID: ${taskId})`,
        isImmediate: false
      };
    }

    // 2. Verifica parâmetro EVERY=24H / EVERY=1H / EVERY=30M
    if (params.EVERY) {
      const everyVal = params.EVERY.trim().toUpperCase();
      let intervalMs = 3600000; // 1h default

      if (everyVal.endsWith('H')) {
        intervalMs = (parseFloat(everyVal) || 1) * 3600000;
      } else if (everyVal.endsWith('M')) {
        intervalMs = (parseFloat(everyVal) || 1) * 60000;
      } else if (everyVal.endsWith('S')) {
        intervalMs = (parseFloat(everyVal) || 1) * 1000;
      }

      const task: ScheduledCommandTask = {
        taskId,
        command,
        args,
        params,
        status: 'PENDING',
        scheduledType: 'INTERVAL',
        intervalMs,
        nextExecutionAt: now + intervalMs,
        createdAt: now,
        createdBy: 'cos_scheduler'
      };

      const tasks = this.getTasks();
      tasks.unshift(task);
      this.saveTasks(tasks);

      const timer = setInterval(async () => {
        await this.runTask(taskId, executorFn);
      }, intervalMs);
      this.activeTimers.set(taskId, timer);

      return {
        scheduled: true,
        taskId,
        message: `Comando configurado para execução periódica a cada ${everyVal} (ID: ${taskId})`,
        isImmediate: false
      };
    }

    // 3. Execução imediata
    return {
      scheduled: false,
      taskId,
      message: 'Execução imediata',
      isImmediate: true
    };
  }

  private static async runTask(
    taskId: string,
    executorFn: (task: ScheduledCommandTask) => Promise<{ success: boolean; message: string }>
  ): Promise<void> {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.taskId === taskId);
    if (!task || task.status === 'CANCELLED') return;

    task.status = 'RUNNING';
    task.lastExecutedAt = Date.now();
    this.saveTasks(tasks);

    try {
      const res = await executorFn(task);
      task.status = res.success ? 'COMPLETED' : 'FAILED';
      task.resultMessage = res.message;
      if (task.scheduledType === 'INTERVAL' && task.intervalMs) {
        task.nextExecutionAt = Date.now() + task.intervalMs;
        task.status = 'PENDING'; // Continua ativo
      }
    } catch (err: any) {
      task.status = 'FAILED';
      task.resultMessage = err?.message || 'Falha na execução agendada';
    }

    this.saveTasks(tasks);
  }

  public static cancelTask(taskId: string): boolean {
    const timer = this.activeTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
      this.activeTimers.delete(taskId);
    }
    const tasks = this.getTasks();
    const task = tasks.find(t => t.taskId === taskId);
    if (task) {
      task.status = 'CANCELLED';
      this.saveTasks(tasks);
      return true;
    }
    return false;
  }
}
