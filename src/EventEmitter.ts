import { v4 as uuidv4 } from 'uuid';
import { defaultSeparator, defaultWildCard } from './Constants';
import { EventNamespace, GlobalOption, Option } from './Interfaces';
import { AsyncListener, EventFilter, Listener, ThrottledListener } from './Types';
import { findEventInfo, getPrioritizedValue, insertSorted, isObjectEmpty, parseEvent } from './Utils';

export class EventEmitter {
  private eventNamespaces: Record<string, EventNamespace> = {};
  private eventFilters: EventFilter[] = [];
  private readonly wildCardNamespace = '';
  private globalOption: GlobalOption;
  private executingListeners: Record<string, number> = {};
  private listenerQueue: Array<{
    listener: Listener;
    id: string;
    concurrency: number;
    isThrottled: boolean;
    eventName: string;
    args: unknown[];
  }> = [];

  /**
   * Creates an instance of EventEmitter.
   * @param globalOption - Global options for the class.
   * @param globalOption.separator - The separator used across all listeners unless listener contains custom separator.
   */
  constructor(globalOption: GlobalOption = { separator: defaultSeparator }) {
    this.globalOption = { ...globalOption };
  }

  /**
   * Sets global options for the EventEmitter.
   * @param options - Global options, such as the separator.
   */
  setGlobalOptions(options: GlobalOption): void {
    this.globalOption = { ...options };
  }

  /**
   * Adds a listener for the specified event, optionally applying filters, throttling, debouncing, and setting priority.
   * @param event - The event name, possibly with a namespace.
   * @param listener - The function to be called when the event is emitted.
   * @param options - An optional object containing properties like `filter`, `throttle`, `debounce`, and `priority`.
   * @param options.filter - A filter function to determine whether to emit the event.
   * @param options.throttle - The time delay (in milliseconds) for throttling the listener's execution.
   * @param options.debounce - The time delay (in milliseconds) for debouncing the listener's execution.
   * @param options.priority - The priority of the listener, higher values execute first (default is 0).
   * @param options.concurrency - Maximum number of listeners executed in parallel (default is unlimited).
   * @param options.separator - Separator used for parsing the event (if applicable, default is '.').
   */
  on(event: string, listener: Listener | AsyncListener, option: Option = {}): void {
    const { filter, throttle, debounce, priority, concurrency, separator }: Option = option;
    const usedSeparator = getPrioritizedValue(this.globalOption.separator, separator);
    const eventInfo = { separator: usedSeparator, event };

    const [namespace, eventName] = parseEvent(event, usedSeparator);

    const throttledListener =
      throttle !== undefined
        ? this.throttle(listener, throttle, eventName)
        : debounce !== undefined
          ? this.debounce(listener, debounce, eventName)
          : listener;

    const listenerObject = {
      listener: throttledListener,
      priority: priority ?? 0,
      eventInfo,
      concurrency: concurrency ?? Infinity,
      id: uuidv4()
    };

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
    const separator = findEventInfo(event, this.eventNamespaces);

    const [namespace, eventName] = parseEvent(event, separator);

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
  async emit(event: string, ...args: unknown[]): Promise<void> {
    const separator = findEventInfo(event, this.eventNamespaces);

    const [namespace, eventName] = parseEvent(event, separator);

    const shouldEmit = this.eventFilters.length === 0 || this.eventFilters.some(filter => filter(eventName, namespace));
    if (shouldEmit) {
      await Promise.all([
        this.executeSpecificListeners(this.wildCardNamespace, defaultWildCard, eventName, separator, args),
        this.wildCardNamespace !== namespace &&
          this.executeSpecificListeners(namespace, defaultWildCard, eventName, separator, args),
        this.executeSpecificListeners(defaultWildCard, eventName, eventName, separator, args),
        this.executeSpecificListeners(namespace, eventName, eventName, separator, args)
      ]);
    }
  }

  /**
   * Executes specific listeners for the given namespace, event, and wildcard combination.
   * @param namespace - The namespace for which listeners should be executed.
   * @param checkEventName - The event name or wildcard to check for listeners.
   * @param eventName - The actual event name for emitting.
   * @param separator - Separator used for parsing the event (if applicable, default is '.').
   * @param args - Additional arguments to be passed to the listeners.
   * @returns A promise that resolves when all specific listeners have been executed.
   */
  private async executeSpecificListeners(
    namespace: string,
    checkEventName: string,
    eventName: string,
    separator: string,
    args: unknown[]
  ): Promise<void> {
    const specificListeners = this.eventNamespaces[namespace]?.[checkEventName]?.listeners ?? [];
    const isThrottled = this.eventNamespaces[namespace]?.[checkEventName]?.throttled ?? false;

    const listenerPromises = specificListeners
      .filter(({ eventInfo }) => eventInfo.separator === separator)
      .map(async ({ listener, concurrency, id }) => {
        await this.processListener(listener, id, concurrency, isThrottled, eventName, args);
      });

    await Promise.all(listenerPromises);
  }

  /**
   * Executes a listener with concurrency control and handles queuing if the concurrency limit is reached.
   *
   * @param listener - The listener function to execute, either throttled or async.
   * @param id - The unique identifier for the listener to track execution.
   * @param concurrency - The maximum number of concurrent executions allowed for this listener.
   * @param isThrottled - A flag indicating whether the listener is throttled.
   * @param eventName - The name of the event being emitted.
   * @param args - The arguments to pass to the listener function.
   */
  private processListener = async (
    listener: Listener,
    id: string,
    concurrency: number,
    isThrottled: boolean,
    eventName: string,
    args: unknown[]
  ) => {
    const executingCount = this.executingListeners[id] || 0;
    if (executingCount < concurrency) {
      this.executingListeners[id] = executingCount + 1;
      try {
        if (isThrottled) {
          await (listener as ThrottledListener)(eventName, ...args);
        } else {
          await (listener as AsyncListener)(eventName, ...args);
        }
      } catch (error) {
        this.handleListenerError(eventName, error as Error);
      } finally {
        this.executingListeners[id]--;
        await this.dequeueNextListener(id);
      }
    } else {
      this.listenerQueue.push({ listener, id, concurrency, isThrottled, eventName, args });
    }
  };

  /**
   * Dequeues and processes the next listener from the listener queue.
   *
   * @param id - The ID of the listener to be dequeued.
   * @returns {Promise<void>} A promise that resolves once the listener has been processed.
   */
  private async dequeueNextListener(id: string): Promise<void> {
    const nextTaskIndex = this.listenerQueue.findIndex(task => task.id === id);
    if (nextTaskIndex !== -1) {
      const [nextTask] = this.listenerQueue.splice(nextTaskIndex, 1);

      await this.processListener(
        nextTask.listener,
        nextTask.id,
        nextTask.concurrency,
        nextTask.isThrottled,
        nextTask.eventName,
        nextTask.args
      );
    }
  }

  /**
   * Handles errors that occur during the execution of a listener.
   * @param eventName - The name of the event for which the listener encountered an error.
   * @param error - The error object representing the encountered error.
   */
  private handleListenerError(eventName: string, error: Error): void {
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

    return async function (...args: unknown[]): Promise<void> {
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

    return async function (...args: unknown[]): Promise<void> {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await (fn as AsyncListener)(eventName, ...args);
      }, delay);
    };
  }
}
