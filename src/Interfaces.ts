import { EventFilter, Listener } from './Types';

export interface GlobalOption {
  separator: string;
}

export interface EventInfo {
  separator: string;
  event: string;
}

export interface Option {
  filter?: EventFilter;
  throttle?: number;
  debounce?: number;
  priority?: number;
  separator?: string;
  concurrency?: number;
}

export interface EventListener {
  listener: Listener;
  priority: number;
  eventInfo: EventInfo;
  concurrency: number;
  id: string;
}

export interface EventNamespace {
  [event: string]: {
    listeners: EventListener[];
    throttled?: boolean;
  };
}
