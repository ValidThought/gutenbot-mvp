import type { AnalyticsEvent } from '@/types';

const ANALYTICS_STORAGE_KEY = 'gutenbot-analytics';
const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 30000;

class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private batchTimer: number | null = null;
  private deviceInfo: AnalyticsEvent['deviceInfo'];

  constructor() {
    this.deviceInfo = this.getDeviceInfo();
  }

  private getDeviceInfo(): AnalyticsEvent['deviceInfo'] {
    if (typeof navigator === 'undefined') return undefined;

    return {
      userAgent: navigator.userAgent,
      memory: (navigator as any).deviceMemory,
      cores: navigator.hardwareConcurrency,
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
    };
  }

  track(event: Omit<AnalyticsEvent, 'timestamp' | 'deviceInfo'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      deviceInfo: this.deviceInfo,
    };

    this.events.push(fullEvent);
    console.log('[Analytics]', fullEvent.category, fullEvent.action, fullEvent.metadata);

    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.batchTimer) return;

    this.batchTimer = window.setTimeout(() => {
      this.flush();
    }, BATCH_TIMEOUT) as unknown as number;
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    await this.sendEvents(eventsToSend);
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      const payload = {
        events,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
      };

      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      console.log(`[Analytics] Sent ${events.length} events`);
    } catch (error) {
      console.warn('[Analytics] Failed to send events:', error);
      await this.storeLocally(events);
    }
  }

  private async storeLocally(events: AnalyticsEvent[]): Promise<void> {
    try {
      const stored = await this.getStoredEvents();
      const updated = [...stored, ...events];

      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));

      const size = JSON.stringify(updated).length;
      if (size > 500000) {
        const trimmed = updated.slice(-100);
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(trimmed));
      }
    } catch (error) {
      console.warn('[Analytics] Failed to store events locally:', error);
    }
  }

  private async getStoredEvents(): Promise<AnalyticsEvent[]> {
    try {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('gutenbot-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('gutenbot-session-id', sessionId);
    }
    return sessionId;
  }

  async clearStored(): Promise<void> {
    try {
      localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    } catch (error) {
      console.warn('[Analytics] Failed to clear storage:', error);
    }
  }

  async sendPendingEvents(): Promise<void> {
    const stored = await this.getStoredEvents();
    if (stored.length > 0) {
      await this.sendEvents(stored);
      localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    }
  }
}

export const analyticsManager = new AnalyticsManager();

export const trackLoaderStart = (): void => {
  analyticsManager.track({
    category: 'loader',
    action: 'loader.start',
    metadata: {},
  });
};

export const trackLoaderSuccess = (loadTime: number, wasCached: boolean): void => {
  analyticsManager.track({
    category: 'loader',
    action: 'loader.success',
    metadata: { loadTime, wasCached },
  });
};

export const trackLoaderFail = (error: string, attempt: number): void => {
  analyticsManager.track({
    category: 'loader',
    action: 'loader.fail',
    metadata: { error, attempt },
  });
};

export const trackScannerDetection = (
  found: boolean,
  latency: number,
  resolution: string
): void => {
  analyticsManager.track({
    category: 'scanner',
    action: 'scanner.detection',
    metadata: { found, latency, resolution },
  });
};

export const trackScannerCapture = (
  blurScore: number,
  wasWarped: boolean
): void => {
  analyticsManager.track({
    category: 'scanner',
    action: 'scanner.capture',
    metadata: { blurScore, wasWarped },
  });
};

export const trackScannerError = (error: string): void => {
  analyticsManager.track({
    category: 'scanner',
    action: 'scanner.error',
    metadata: { error },
  });
};

export const trackPerformanceMemory = (used: number, peak: number): void => {
  analyticsManager.track({
    category: 'performance',
    action: 'perf.memory',
    metadata: { used, peak },
  });
};

export const trackPerformanceFrame = (processingTime: number, frameNumber: number): void => {
  analyticsManager.track({
    category: 'performance',
    action: 'perf.frame',
    metadata: { processingTime, frameNumber },
  });
};

export const trackError = (error: Error, context: string): void => {
  analyticsManager.track({
    category: 'error',
    action: 'error.occurred',
    metadata: { message: error.message, stack: error.stack, context },
  });
};
