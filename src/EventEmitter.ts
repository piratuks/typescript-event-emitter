import { wildCard } from './Constants';
import { EventNamespace, Option } from './Interfaces';
import { AsyncListener, EventFilter, Listener, ThrottledListener } from './Types';
import { insertSorted, isObjectEmpty, parseEvent } from './Utils';

export class EventEmitter {
  private eventNamespaces: Record<string, EventNamespace> = {};
  private eventFilters: EventFilter[] = [];
  private readonly wildCardNamespace = '';

  /**
   * Adds a listener for the specified event, optionally applying filters, throttling, debouncing, and setting priority.
   * @param event - The event name, possibly with a namespace.
   * @param listener - The function to be called when the event is emitted.
   * @param options - An optional object containing properties like `filter`, `throttle`, `debounce`, and `priority`.
   * @param options.filter - A filter function to determine whether to emit the event.
   * @param options.throttle - The time delay (in milliseconds) for throttling the listener's execution.
   * @param options.debounce - The time delay (in milliseconds) for debouncing the listener's execution.
   * @param options.priority - The priority of the listener, higher values execute first (default is 0).
   */
  on(event: string, listener: Listener | AsyncListener, { filter, throttle, debounce, priority }: Option = {}): void {
    const [namespace, eventName] = parseEvent(event);

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

    insertSorted(this.eventNamespaces[namespace][eventName].listeners, listenerObject);
    this.eventNamespaces[namespace][eventName].throttled = throttle !== undefined;

    if (filter) {
      this.eventFilters.push(filter);
    }
  }

  /**
   * Removes a previously added listener for the specified event.
   * @param event - The event name, possibly with a namespace.
   * @param listener - The listener function to be removed.
   */
  off(event: string, listener: Listener | AsyncListener): void {
    const [namespace, eventName] = parseEvent(event);

    const namespaceObject = this.eventNamespaces[namespace];
    if (namespaceObject && namespaceObject[eventName]) {
      const listeners = namespaceObject[eventName].listeners;
      const index = listeners.findIndex(l => l.listener === listener);

      if (index !== -1) {
        listeners.splice(index, 1);

        if (!listeners.length) {
          delete namespaceObject[eventName];
        }

        if (isObjectEmpty(namespaceObject)) {
          delete this.eventNamespaces[namespace];
        }
      }
    }
  }

  /**
   * Emits the specified event, calling all associated listeners.
   * @param event - The event name, possibly with a namespace.
   * @param args - Additional arguments to be passed to the listeners.
   * @returns A promise that resolves when all listeners have been executed.
   */
  async emit(event: string, ...args: any[]): Promise<void> {
    const [namespace, eventName] = parseEvent(event);

    const shouldEmit = this.eventFilters.length === 0 || this.eventFilters.some(filter => filter(eventName, namespace));
    if (shouldEmit) {
      await Promise.all([
        this.executeSpecificListeners(this.wildCardNamespace, wildCard, eventName, args),
        this.wildCardNamespace !== namespace && this.executeSpecificListeners(namespace, wildCard, eventName, args),
        this.executeSpecificListeners(wildCard, eventName, eventName, args),
        this.executeSpecificListeners(namespace, eventName, eventName, args)
      ]);
    }
  }

  /**
   * Executes specific listeners for the given namespace, event, and wildcard combination.
   * @param namespace - The namespace for which listeners should be executed.
   * @param checkEventName - The event name or wildcard to check for listeners.
   * @param eventName - The actual event name for emitting.
   * @param args - Additional arguments to be passed to the listeners.
   * @returns A promise that resolves when all specific listeners have been executed.
   */
  private async executeSpecificListeners(
    namespace: string,
    checkEventName: string,
    eventName: string,
    args: any[]
  ): Promise<void> {
    const specificListeners = this.eventNamespaces[namespace]?.[checkEventName]?.listeners ?? [];
    const isThrottled = this.eventNamespaces[namespace]?.[checkEventName]?.throttled ?? false;

    for (const { listener } of specificListeners) {
      try {
        if (isThrottled) {
          await (listener as ThrottledListener)(eventName, ...args);
        } else {
          await (listener as AsyncListener)(eventName, ...args);
        }
      } catch (error) {
        this.handleListenerError(eventName, error);
      }
    }
  }

  /**
   * Handles errors that occur during the execution of a listener.
   * @param eventName - The name of the event for which the listener encountered an error.
   * @param error - The error object representing the encountered error.
   */
  private handleListenerError(eventName: string, error: any): void {
    console.error(`Error in listener for event ${eventName}:`, error);
    console.error(error.stack);
  }

  /**
   * Creates a throttled version of the given listener function, ensuring it is called at most once within a specified time interval.
   * @param fn - The listener function to be throttled.
   * @param delay - The time delay (in milliseconds) between allowed invocations of the throttled function.
   * @param eventName - The name of the event associated with the listener.
   * @returns A throttled listener function.
   */
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

  /**
   * Creates a debounced version of the given listener function, ensuring it is called after a specified delay with no new invocations.
   * @param fn - The listener function to be debounced.
   * @param delay - The time delay (in milliseconds) before the debounced function is called after the last invocation.
   * @param eventName - The name of the event associated with the listener.
   * @returns A debounced listener function.
   */
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
