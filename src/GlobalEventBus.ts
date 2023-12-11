import { EventEmitter } from './EventEmitter';
import { GlobalOption, Option } from './Interfaces';
import { AsyncListener, Listener } from './Types';

class GlobalEventBus {
  private static instance: GlobalEventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
  }

  /**
   * Gets the singleton instance of the GlobalEventBus.
   * @returns The singleton instance of the GlobalEventBus.
   */
  static getInstance(): GlobalEventBus {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus();
    }

    return GlobalEventBus.instance;
  }

  /**
   * Sets global options for the EventEmitter.
   * @param options - Global options, such as the separator.
   */
  setGlobalOptions(options: GlobalOption): void {
    this.emitter.setGlobalOptions(options);
  }

  /**
   * Adds a listener for the specified event through the GlobalEventBus, with optional filtering, throttling, debouncing, and priority.
   * @param event - The event name to listen for.
   * @param listener - The listener function to be called when the event is emitted.
   * @param options - An optional object containing properties like `filter`, `throttle`, `debounce`, and `priority`.
   * @param options.filter - A filter function to determine whether to emit the event.
   * @param options.throttle - The time delay (in milliseconds) between allowed invocations of the listener.
   * @param options.debounce - The time delay (in milliseconds) before the listener is called after the last invocation.
   * @param options.priority - The priority of the listener, higher values execute first (default is 0).
   * @param options.separator - Separator used for parsing the event (if applicable, default is '.').
   */
  on(
    event: string,
    listener: Listener | AsyncListener,
    { filter, throttle, debounce, priority, separator }: Option = {}
  ): void {
    this.emitter.on(event, listener, { filter, throttle, debounce, priority, separator });
  }

  /**
   * Removes a previously added listener for the specified event through the GlobalEventBus.
   * @param event - The event name from which to remove the listener.
   * @param listener - The listener function to be removed.
   */
  off(event: string, listener: Listener | AsyncListener): void {
    this.emitter.off(event, listener);
  }

  /**
   * Emits the specified event through the GlobalEventBus, calling all associated listeners.
   * @param event - The event name to be emitted.
   * @param args - Additional arguments to be passed to the listeners.
   * @returns A promise that resolves when all listeners have been executed.
   */
  async emit(event: string, ...args: unknown[]): Promise<void> {
    try {
      await this.emitter.emit(event, ...args);
    } catch (error) {
      this.handleEventBusError(event, error as Error);
    }
  }

  /**
   * Handles errors that occur during the event emission process in the GlobalEventBus.
   * @param event - The name of the event that encountered an error during emission.
   * @param error - The error object representing the encountered error.
   */
  private handleEventBusError(event: string, error: Error): void {
    console.error(`Error in GlobalEventBus while emitting event ${event}:`, error);
    console.error(error.stack);
  }
}

export const globalEventBus = GlobalEventBus.getInstance();
