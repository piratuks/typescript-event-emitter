import { EventFilter, Listener } from './Types';

export interface Option {
  filter?: EventFilter;
  throttle?: number;
  debounce?: number;
  priority?: number;
}

export interface EventListener {
  listener: Listener;
  priority: number;
}

export interface EventNamespace {
  [event: string]: {
    listeners: EventListener[];
    throttled?: boolean;
    debounceTimeout?: number;
  };
}
