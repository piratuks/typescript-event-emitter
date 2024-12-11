import { defaultSeparator } from './Constants';
import { EventInfo, GlobalOption, Option } from './Interfaces';
import { ListenerManager } from './ListenerManager';
import { AsyncListener, Listener } from './Types';

export class EventEmitter {
  private listenerManager: ListenerManager;
  private globalOption: GlobalOption;

  /**
   * Creates an instance of EventEmitter.
   * @param globalOption - Global options for the class.
   * @param globalOption.separator - The separator used across all listeners unless listener contains custom separator.
   */
  constructor(globalOption: GlobalOption = { separator: defaultSeparator }) {
    this.globalOption = { ...globalOption };
    this.listenerManager = new ListenerManager();
  }

  /**
   * Sets global options for the EventEmitter.
   * @param options - Global options, such as the separator.
   */
  setGlobalOptions(options: GlobalOption): void {
    this.globalOption = { ...options };
  }

  /**
   * Retrieves the current global options set for the EventEmitter instance.
   *
   * @returns {GlobalOption} - The current global options object containing properties such as the separator used across all listeners.
   */
  getGlobalOptions(): GlobalOption {
    return this.globalOption;
  }

  /**
   * Retrieves the current instance of the `ListenerManager`.
   *
   * @returns {ListenerManager} The current instance of `ListenerManager`.
   */
  getListenerManager(): ListenerManager {
    return this.listenerManager;
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
    this.listenerManager.addListener(this, event, listener, option);
  }

  /**
   * Removes a previously added listener for the specified event.
   * @param event - The event name, possibly with a namespace.
   * @param listener - The listener function to be removed.
   */
  off(event: string, listener: Listener | AsyncListener): void {
    this.listenerManager.removeListener(this, event, listener);
  }

  /**
   * Emits the specified event, calling all associated listeners.
   * @param event - The event name, possibly with a namespace.
   * @param args - Additional arguments to be passed to the listeners.
   * @returns A promise that resolves when all listeners have been executed.
   */
  async emit(event: string, ...args: unknown[]): Promise<void> {
    await this.listenerManager.executeListeners(this, event, args);
  }

  /**
   * Lists all event subscriptions, including event names and listener count.
   *
   * @returns {Array<{ event: string, listenerCount: number }>} - An array of objects, each containing event name and count of listeners.
   */
  subscriptions(): Array<{ event: string; listenerCount: number }> {
    return this.listenerManager.listSubscriptions();
  }

  /**
   * Inspects a specific event subscription, showing details of listeners.
   *
   * @param event - The event name, possibly with a namespace (e.g., 'namespace.eventName').
   * @returns {Array<Object>} - An array of objects, each containing listener details (id, priority, concurrency, eventInfo, listener).
   */
  inspectSubscription(
    event: string
  ): Array<{ id: string; eventInfo: EventInfo; listener: Listener; priority: number; concurrency: number }> {
    return this.listenerManager.inspectSubscription(event);
  }

  /**
   * Remove a subscription from the ListenerManager.
   *
   * @param event - The event name which can include a namespace (e.g., 'namespace.eventName').
   * @param listenerId - The unique identifier of the listener to be removed.
   */
  removeSubscription(event: string, listenerId: string): void {
    this.listenerManager.removeSubscription(event, listenerId);
  }
}
