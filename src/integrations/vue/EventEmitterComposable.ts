import { EventEmitter } from '../../EventEmitter';
import { Option } from '../../index';
import { useBaseEventSource } from './BaseEventComposable';

export function useEventEmitter<T = unknown>(
  emitter: EventEmitter,
  event: string,
  handler: (payload: T) => void,
  options?: Option
) {
  useBaseEventSource(emitter, event, handler, options);
}

export { EventEmitter };
