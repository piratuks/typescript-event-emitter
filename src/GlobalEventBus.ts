import { EventEmitter } from "./EventEmitter";
import { Listener, AsyncListener } from "./Types";
import { Option } from "./Interfaces";

class GlobalEventBus {
    private static instance: GlobalEventBus;
    private emitter: EventEmitter;
  
    private constructor() {
      this.emitter = new EventEmitter();
    }
  
    static getInstance(): GlobalEventBus {
      if (!GlobalEventBus.instance) {
        GlobalEventBus.instance = new GlobalEventBus();
      }
  
      return GlobalEventBus.instance;
    }
  
    on(event: string, listener: Listener | AsyncListener, { filter, throttle, debounce, priority }: Option = {}): void {
      this.emitter.on(event, listener, { filter, throttle, debounce, priority });
    }
  
    off(event: string, listener: Listener | AsyncListener): void {
      this.emitter.off(event, listener);
    }
  
    async emit(event: string, ...args: any[]): Promise<void> {
      await this.emitter.emit(event, ...args);
    }
  }
  
export const globalEventBus = GlobalEventBus.getInstance();
