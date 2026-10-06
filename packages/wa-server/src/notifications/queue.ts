import { v4 as uuid } from 'uuid';
import type { WhatsAppEngine } from '@mlhk/wa-core';

export interface NotificationItem {
  id: string;
  phone: string;
  message: string;
  type?: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  attempts: number;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export class NotificationQueue {
  private queue: NotificationItem[] = [];
  private engine: WhatsAppEngine;
  private isProcessing = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(engine: WhatsAppEngine) {
    this.engine = engine;
  }

  public enqueue(phone: string, message: string, type = 'general'): NotificationItem {
    const item: NotificationItem = {
      id: uuid(),
      phone: phone.replace(/[^0-9]/g, ''),
      message,
      type,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    };
    this.queue.push(item);
    return item;
  }

  public startProcessor(intervalMs = 5000): void {
    if (this.intervalTimer) return;
    this.intervalTimer = setInterval(() => this.processNextBatch(), intervalMs);
  }

  public stopProcessor(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public getQueue(): NotificationItem[] {
    return [...this.queue];
  }

  public getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending').length,
      sent: this.queue.filter(i => i.status === 'sent').length,
      failed: this.queue.filter(i => i.status === 'failed').length
    };
  }

  private async processNextBatch(batchSize = 3): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pending = this.queue
        .filter(i => i.status === 'pending')
        .slice(0, batchSize);

      for (const item of pending) {
        item.status = 'sending';
        item.attempts++;

        try {
          await this.engine.sendText(item.phone, item.message);
          item.status = 'sent';
          item.sentAt = new Date();
          // Rate-limiting delay between sends
          await new Promise(r => setTimeout(r, 1500));
        } catch (err: any) {
          if (item.attempts >= 3) {
            item.status = 'failed';
            item.error = err.message;
          } else {
            item.status = 'pending'; // retry next cycle
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
