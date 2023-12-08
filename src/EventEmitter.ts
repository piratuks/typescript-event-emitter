import { EventNamespace, Option } from './Interfaces';
import { AsyncListener, EventFilter, Listener, ThrottledListener } from './Types';

export class EventEmitter {
  private wildcardListeners: { listener: ThrottledListener | AsyncListener; throttled?: boolean }[] = [];
  private eventNamespaces: Record<string, EventNamespace> = {};
  private eventFilters: EventFilter[] = [];

  on(event: string, listener: Listener | AsyncListener, { filter, throttle, debounce, priority }: Option = {}): void {
    const [namespace, eventName] = this.parseEvent(event);

    const throttledListener =
      throttle !== undefined
        ? this.throttle(listener, throttle)
        : debounce !== undefined
          ? this.debounce(listener, debounce)
          : listener;

    const listenerObject = { listener: throttledListener, priority: priority || 0 };
    if (!namespace && eventName === '*') {
      this.wildcardListeners.push({ listener: throttledListener, throttled: throttle !== undefined });
    } else {
      if (!this.eventNamespaces[namespace]) {
        this.eventNamespaces[namespace] = {};
      }
      if (!this.eventNamespaces[namespace][eventName]) {
        this.eventNamespaces[namespace][eventName] = { listeners: [] };
      }

      this.eventNamespaces[namespace][eventName].listeners.push(listenerObject);
      this.eventNamespaces[namespace][eventName].listeners.sort((a, b) => b.priority - a.priority);
      this.eventNamespaces[namespace][eventName].throttled = throttle !== undefined;
    }

    if (filter) {
      this.eventFilters.push(filter);
    }
  }

  off(event: string, listener: Listener | AsyncListener): void {
    const [namespace, eventName] = this.parseEvent(event);

    if (!namespace && eventName === '*') {
      this.wildcardListeners = this.wildcardListeners.filter(l => l.listener !== listener);
    } else if (this.eventNamespaces[namespace] && this.eventNamespaces[namespace][eventName]) {
      this.eventNamespaces[namespace][eventName].listeners = this.eventNamespaces[namespace][
        eventName
      ].listeners.filter(l => l.listener !== listener);
    }
  }

  async emit(event: string, ...args: any[]): Promise<void> {
    const [namespace, eventName] = this.parseEvent(event);

    const shouldEmit = this.eventFilters.length === 0 || this.eventFilters.some(filter => filter(eventName));
    if (shouldEmit) {
      this.wildcardListeners.sort((a, b) => (b.throttled ? 1 : 0) - (a.throttled ? 1 : 0));
      await this.executeListeners(this.wildcardListeners, eventName, args);

      if (this.eventNamespaces[namespace]) {
        if (this.eventNamespaces[namespace][eventName]) {
          this.eventNamespaces[namespace][eventName].listeners.sort((a, b) => b.priority - a.priority);
          await this.executeListeners(this.eventNamespaces[namespace][eventName].listeners, eventName, args);
        }
        if (this.eventNamespaces[namespace]['*']) {
          this.eventNamespaces[namespace]['*'].listeners.sort((a, b) => b.priority - a.priority);
          await this.executeListeners(this.eventNamespaces[namespace]['*'].listeners, '*', args);
        }
      }
    }
  }

  private async executeListeners(
    listeners: { listener: ThrottledListener | AsyncListener; throttled?: boolean }[],
    eventName: string,
    args: any[]
  ): Promise<void> {
    for (const { listener, throttled } of listeners) {
      try {
        if (throttled) {
          await (listener as ThrottledListener)(eventName, ...args);
        } else {
          await (listener as AsyncListener)(...args);
        }
      } catch (error) {
        this.handleListenerError(eventName, listener, error);
      }
    }
  }

  private handleListenerError(eventName: string, _listener: ThrottledListener | AsyncListener, error: any): void {
    console.error(`Error in listener for event ${eventName}:`, error);
    console.error(error.stack);
  }

  private parseEvent(event: string): [string, string] {
    const parts = event.split('.');
    const namespace = parts.length > 1 ? parts[0] : '';
    const eventName = parts[parts.length - 1];
    return [namespace, eventName];
  }

  private throttle(fn: Listener | AsyncListener, delay: number): ThrottledListener | AsyncListener {
    let lastCallTime = 0;

    return async function (...args: any[]): Promise<void> {
      const now = Date.now();
      if (now - lastCallTime >= delay) {
        lastCallTime = now;
        await (fn as AsyncListener)(...args);
      }
    };
  }

  private debounce(fn: Listener | AsyncListener, delay: number): ThrottledListener | AsyncListener {
    let timeout: NodeJS.Timeout;

    return async function (...args: any[]): Promise<void> {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await (fn as AsyncListener)(...args);
      }, delay);
    };
  }
}
