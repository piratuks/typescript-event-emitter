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
}

export interface EventListener {
  listener: Listener;
  priority: number;
  eventInfo: EventInfo;
}

export interface EventNamespace {
  [event: string]: {
    listeners: EventListener[];
    throttled?: boolean;
  };
}
