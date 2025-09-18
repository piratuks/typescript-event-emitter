import { globalEventBus, Option } from '../../index';
import { useBaseEventSource } from './BaseEventHook';

export function useGlobalEventBus<T = unknown>(
  event: string,
  handler: (payload: T) => void,
  options?: Option,
  deps: any[] = []
) {
  useBaseEventSource(globalEventBus, event, handler, options, deps);
}

export { globalEventBus };
