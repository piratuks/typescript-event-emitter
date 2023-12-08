import { EventNamespace, Option } from './Interfaces';
import { AsyncListener, EventFilter, Listener, ThrottledListener } from './Types';

export class EventEmitter {
  private eventNamespaces: Record<string, EventNamespace> = {};
  private eventFilters: EventFilter[] = [];
  private readonly wildCard = '*';
  private readonly wildCardNamespace = '';

  on(event: string, listener: Listener | AsyncListener, { filter, throttle, debounce, priority }: Option = {}): void {
    const [namespace, eventName] = this.parseEvent(event);

    const throttledListener =
      throttle !== undefined
        ? this.throttle(listener, throttle, eventName)
        : debounce !== undefined
          ? this.debounce(listener, debounce, eventName)
          : listener;

    const listenerObject = { listener: throttledListener, priority: priority ?? 0 };

    if (!this.eventNamespaces[namespace]) {
      this.eventNamespaces[namespace] = {};
    }
    if (!this.eventNamespaces[namespace][eventName]) {
      this.eventNamespaces[namespace][eventName] = { listeners: [] };
    }

    this.insertSorted(this.eventNamespaces[namespace][eventName].listeners, listenerObject);
    this.eventNamespaces[namespace][eventName].throttled = throttle !== undefined;

    if (filter) {
      this.eventFilters.push(filter);
    }
  }

  off(event: string, listener: Listener | AsyncListener): void {
    const [namespace, eventName] = this.parseEvent(event);

    const namespaceObject = this.eventNamespaces[namespace];
    if (namespaceObject && namespaceObject[eventName]) {
      const listeners = namespaceObject[eventName].listeners;
      const index = listeners.findIndex(l => l.listener === listener);

      if (index !== -1) {
        listeners.splice(index, 1);

        if (!listeners.length) {
          delete namespaceObject[eventName];
        }

        if (this.isObjectEmpty(namespaceObject)) {
          delete this.eventNamespaces[namespace];
        }
      }
    }
  }

  async emit(event: string, ...args: any[]): Promise<void> {
    const [namespace, eventName] = this.parseEvent(event);

    const shouldEmit = this.eventFilters.length === 0 || this.eventFilters.some(filter => filter(eventName, namespace));
    if (shouldEmit) {
      await Promise.all([
        this.executeSpecificListeners(this.wildCardNamespace, this.wildCard, eventName, args),
        this.wildCardNamespace !== namespace &&
          this.executeSpecificListeners(namespace, this.wildCard, eventName, args),
        this.executeSpecificListeners(this.wildCard, eventName, eventName, args),
        this.executeSpecificListeners(namespace, eventName, eventName, args)
      ]);
    }
  }

  private async executeSpecificListeners(
    namespace: string,
    checkEventName: string,
    eventName: string,
    args: any[]
  ): Promise<void> {
    const specificListeners = this.eventNamespaces[namespace]?.[checkEventName]?.listeners ?? [];
    const isThrottled = this.eventNamespaces[namespace]?.[checkEventName]?.throttled ?? false;

    await this.executeListeners(specificListeners, isThrottled, eventName, args);
  }

  private insertSorted(
    listeners: { listener: ThrottledListener | AsyncListener; priority: number }[],
    listenerObject: { listener: ThrottledListener | AsyncListener; priority: number }
  ): void {
    const index = listeners.findIndex(l => listenerObject.priority > l.priority);
    if (index === -1) {
      listeners.push(listenerObject);
    } else {
      listeners.splice(index, 0, listenerObject);
    }
  }

  private isObjectEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }

  private async executeListeners(
    listeners: { listener: ThrottledListener | AsyncListener }[],
    isThrottled: boolean,
    eventName: string,
    args: any[]
  ): Promise<void> {
    for (const { listener } of listeners) {
      try {
        if (isThrottled) {
          await (listener as ThrottledListener)(eventName, ...args);
        } else {
          await (listener as AsyncListener)(eventName, ...args);
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

  private throttle(fn: Listener | AsyncListener, delay: number, eventName: string): ThrottledListener | AsyncListener {
    let lastCallTime = 0;

    return async function (...args: any[]): Promise<void> {
      const now = Date.now();
      if (now - lastCallTime >= delay) {
        lastCallTime = now;
        await (fn as AsyncListener)(eventName, ...args);
      }
    };
  }

  private debounce(fn: Listener | AsyncListener, delay: number, eventName: string): ThrottledListener | AsyncListener {
    let timeout: NodeJS.Timeout;

    return async function (...args: any[]): Promise<void> {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await (fn as AsyncListener)(eventName, ...args);
      }, delay);
    };
  }
}
