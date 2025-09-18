import { globalEventBus, Option } from '../../index';
import { useBaseEventSource } from './BaseEventComposable';

export function useGlobalEventBus<T = unknown>(event: string, handler: (payload: T) => void, options?: Option) {
  useBaseEventSource(globalEventBus, event, handler, options);
}

export { globalEventBus };
