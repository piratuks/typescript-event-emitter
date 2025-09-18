import { EventEmitter } from '../../EventEmitter';
import { Option } from '../../index';
import { useBaseEventSource } from './BaseEventHook';

export function useEventEmitter<T = unknown>(
  emitter: EventEmitter,
  event: string,
  handler: (payload: T) => void,
  options?: Option,
  deps: any[] = []
) {
  useBaseEventSource(emitter, event, handler, options, deps);
}

export { EventEmitter };
