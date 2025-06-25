import { v4 as uuidv4 } from 'uuid';
import { defaultWildCard } from './Constants';
import { EventEmitter } from './EventEmitter';
import { EventHistory, EventInfo, EventNamespace, Option } from './Interfaces';
import { AsyncListener, EventFilter, Listener, ThrottledListener } from './Types';
import { findEventInfo, getPrioritizedValue, insertSorted, isObjectEmpty, parseEvent } from './Utils';

export class ListenerManager {
  private eventNamespaces: Record<string, EventNamespace> = {};
  private readonly wildCardNamespace = '';
  private eventFilters: EventFilter[] = [];
  private executingListeners: Record<string, number> = {};
  private listenerQueue: Array<{
    listener: Listener;
    id: string;
    concurrency: number;
    isThrottled: boolean;
    eventName: string;
    args: unknown[];
  }> = [];
  private eventHistory: Array<EventHistory> = [];

  /**
   * Retrieves the event history based on a specific event name.
   *
   * @param event - The name of the event to filter by. This can include a namespace (e.g., 'namespace.eventName').
   * @returns {Array<{ event: string, listenerId: string, timestamp: number, args: unknown[] }>}
   * - An array of objects that match the specified event name, each containing the event name, listener ID, timestamp, and arguments.
   */
  public getSpecificEventHistory(event: string): Array<EventHistory> {
    return this.eventHistory.filter(history => {
      let matches = true;

      if (event) {
        matches = matches && history.event === event;
      }

      return matches;
    });
  }

  /**
   * Retrieves all recorded event histories.
   *
   * @returns {Array<{ event: string, listenerId: string, timestamp: number, args: unknown[] }>}
   * - An array of objects, each containing the event name, listener ID, timestamp, and the arguments passed to the listener.
   */
  public getAllEventHistory(): Array<EventHistory> {
    return this.eventHistory;
  }

  /**
   * @param emitter - The `EventEmitter` instance where the listener is being added.
   * @param event - The event name which can include a namespace (e.g., 'namespace.eventName').
   * @param listener - The listener function to be called when the event is emitted.
   *                  This can be either a `Listener` (synchronous function) or `AsyncListener` (asynchronous function).
   * @param option - An object containing various configuration options for the listener.
   * @param option.filter - Optional. A filter function to determine whether the listener should be executed.
   * @param option.throttle - Optional. Throttle configuration. Can be a number (delay in ms) or an object with { delay, leading, trailing }.
   *                          If specified, the listener will only be called at most once within the given time window.
   *                          - leading: If true, triggers on the leading edge. Default: true.
   *                          - trailing: If true, triggers on the trailing edge. Default: true.
   * @param option.debounce - Optional. Debounce configuration. Can be a number (delay in ms) or an object with { delay, leading, trailing }.
   *                          If specified, the listener will be delayed and only called after the delay has passed since the last event.
   *                          - leading: If true, triggers on the leading edge. Default: false.
   *                          - trailing: If true, triggers on the trailing edge. Default: true.
   * @param option.priority - Optional. Priority of the listener. Higher values execute first. Default is 0.
   * @param option.concurrency - Optional. Maximum number of listeners executed in parallel. Default is unlimited.
   * @param option.separator - Optional. Custom separator used for parsing the event. Default is the global separator.
   */
  addListener(emitter: EventEmitter, event: string, listener: Listener | AsyncListener, option: Option): void {
    const { filter, throttle, debounce, priority, concurrency, separator }: Option = option;
    const usedSeparator = getPrioritizedValue(emitter.getGlobalOptions().separator, separator);
    const eventInfo = { separator: usedSeparator, event };

    const [namespace, eventName] = parseEvent(event, usedSeparator);

    let throttledListener: Listener | AsyncListener;
    if (throttle !== undefined) {
      let delay: number,
        leading = true,
        trailing = true;
      if (typeof throttle === 'number') {
        delay = throttle;
      } else {
        delay = throttle.delay;
        if (typeof throttle.leading === 'boolean') leading = throttle.leading;
        if (typeof throttle.trailing === 'boolean') trailing = throttle.trailing;
      }
      throttledListener = this.throttle(listener, delay, leading, trailing);
    } else if (debounce !== undefined) {
      let delay: number,
        leading = false,
        trailing = true;
      if (typeof debounce === 'number') {
        delay = debounce;
      } else {
        delay = debounce.delay;
        if (typeof debounce.leading === 'boolean') leading = debounce.leading;
        if (typeof debounce.trailing === 'boolean') trailing = debounce.trailing;
      }
      throttledListener = this.debounce(listener, delay, leading, trailing);
    } else {
      throttledListener = listener;
    }

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
   * @param _emitter - The `EventEmitter` instance. This parameter is unused in this method, as we only need access to the event namespace.
   * @param event - The event name which can include a namespace (e.g., 'namespace.eventName').
   * @param listener - The listener function to be removed from the specified event.
   */
  removeListener(_emitter: EventEmitter, event: string, listener: Listener): void {
    this.removeSubscriptionOrListener(event, listener);
  }

  /**
   * @param _emitter - The `EventEmitter` instance. This parameter is unused in this method, as we only need access to the event namespaces.
   * @param event - The event name which can include a namespace (e.g., 'namespace.eventName').
   * @param args - Additional arguments to be passed to the listeners when they are invoked.
   *
   * This method processes and executes listeners for specific namespaces and wildcard combinations.
   */
  async executeListeners(_emitter: EventEmitter, event: string, args: unknown[]): Promise<void> {
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
   * Lists all event subscriptions, including event names and listener count.
   *
   * @returns {Array<{ event: string, listenerCount: number }>} - An array of objects, each containing event name and count of listeners.
   */
  listSubscriptions(): Array<{ event: string; listenerCount: number }> {
    const subscriptions: Array<{ event: string; listenerCount: number }> = [];

    for (const namespace in this.eventNamespaces) {
      for (const eventName in this.eventNamespaces[namespace]) {
        subscriptions.push({
          event: namespace ? `${namespace}.${eventName}` : eventName,
          listenerCount: this.eventNamespaces[namespace][eventName].listeners.length
        });
      }
    }

    return subscriptions;
  }

  /**
   * Inspects a specific event subscription, showing details of listeners.
   *
   * @param event - The event name, possibly with a namespace (e.g., 'namespace.eventName').
   * @returns {Array<Object>} - An array of objects, each containing listener details (id, priority, concurrency, eventInfo, listener).
   */
  inspectSubscription(event: string): Array<{
    id: string;
    eventInfo: EventInfo;
    listener: Listener;
    priority: number;
    concurrency: number;
  }> {
    const separator = findEventInfo(event, this.eventNamespaces);
    const [namespace, eventName] = parseEvent(event, separator);

    const listeners = this.eventNamespaces[namespace]?.[eventName]?.listeners ?? [];

    return listeners.map(listener => ({
      id: listener.id,
      priority: listener.priority,
      concurrency: listener.concurrency,
      eventInfo: listener.eventInfo,
      listener: listener.listener
    }));
  }

  /**
   * Remove a subscription from the ListenerManager.
   *
   * @param event - The event name which can include a namespace (e.g., 'namespace.eventName').
   * @param listenerId - The unique identifier of the listener to be removed.
   */
  removeSubscription(event: string, listenerId: string): void {
    this.removeSubscriptionOrListener(event, listenerId);
  }

  /**
   * Records an event occurrence in the history log.
   *
   * @param event - The name of the event that was emitted, which can include a namespace (e.g., 'namespace.eventName').
   * @param listenerId - The unique identifier of the listener that was invoked.
   * @param args - The arguments that were passed to the listener when it was invoked.
   */
  private recordEventHistory(event: string, listenerId: string, args: unknown[]): void {
    this.eventHistory.push({
      event,
      listenerId: listenerId,
      timestamp: Date.now(),
      args
    });
  }

  /**
   * Remove a subscription or listener from the ListenerManager.
   *
   * @param event - The event name which can include a namespace (e.g., 'namespace.eventName').
   * @param listenerOrId - The unique identifier of the listener to be removed, or the listener function itself.
   */
  private removeSubscriptionOrListener(event: string, listenerOrId: string | Listener): void {
    const separator = findEventInfo(event, this.eventNamespaces);

    const [namespace, eventName] = parseEvent(event, separator);

    const namespaceObject = this.eventNamespaces[namespace];
    if (namespaceObject && namespaceObject[eventName]) {
      const listeners = namespaceObject[eventName].listeners;
      let index = -1;
      if (typeof listenerOrId === 'string') {
        index = listeners.findIndex(l => l.id === listenerOrId);
      } else {
        index = listeners.findIndex(l => l.listener === listenerOrId);
      }

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

        this.recordEventHistory(eventName, id, args);
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
   * Supports leading/trailing edge control.
   * @param fn - The listener function to be throttled.
   * @param delay - The time delay (in milliseconds) between allowed invocations of the throttled function.
   * @param leading - If true, triggers on the leading edge.
   * @param trailing - If true, triggers on the trailing edge.
   * @returns A throttled listener function.
   */
  private throttle(
    fn: Listener | AsyncListener,
    delay: number,
    leading = true,
    trailing = true
  ): ThrottledListener | AsyncListener {
    let timeout: NodeJS.Timeout | null = null;
    let lastCallTime = 0;
    let lastArgs: unknown[] | null = null;
    let lastEventName: string | null = null;

    const trailingCall = async () => {
      timeout = null;
      lastCallTime = Date.now();
      if (trailing && lastEventName && lastArgs) {
        await (fn as AsyncListener)(lastEventName, ...lastArgs);
      }
    };

    return async (eventName: string, ...args: unknown[]): Promise<void> => {
      const now = Date.now();
      lastArgs = args;
      lastEventName = eventName;

      const callNow = leading && now - lastCallTime >= delay;

      if (callNow) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        lastCallTime = now;
        await (fn as AsyncListener)(eventName, ...args);
      } else if (!timeout && trailing) {
        const remaining = delay - (now - lastCallTime);
        timeout = setTimeout(trailingCall, remaining > 0 ? remaining : 0);
      }
    };
  }

  /**
   * Creates a debounced version of the given listener function, ensuring it is called after a specified delay with no new invocations.
   * Supports leading/trailing edge control.
   * @param fn - The listener function to be debounced.
   * @param delay - The time delay (in milliseconds) before the debounced function is called after the last invocation.
   * @param leading - If true, triggers on the leading edge.
   * @param trailing - If true, triggers on the trailing edge.
   * @returns A debounced listener function.
   */
  private debounce(
    fn: Listener | AsyncListener,
    delay: number,
    leading = false,
    trailing = true
  ): ThrottledListener | AsyncListener {
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: unknown[] | null = null;
    let lastEventName: string | null = null;
    let called = false;

    return async (eventName: string, ...args: unknown[]): Promise<void> => {
      if (timeout) clearTimeout(timeout);
      lastArgs = args;
      lastEventName = eventName;
      if (leading && !called) {
        called = true;
        await (fn as AsyncListener)(eventName, ...args);
      }
      timeout = setTimeout(async () => {
        called = false;
        if (trailing) {
          if (lastEventName) await (fn as AsyncListener)(lastEventName, ...(lastArgs || []));
        }
        lastArgs = null;
        lastEventName = null;
      }, delay);
    };
  }
}
