import { onMounted, onUnmounted } from 'vue';
import { Option } from '../../index';

export function useBaseEventSource<T = unknown>(
  source: {
    on: (event: string, listener: (eventName: string, payload: T) => void, options?: Option) => void;
    off: (event: string, listener: (eventName: string, payload: T) => void) => void;
  },
  event: string,
  handler: (payload: T) => void,
  options?: Option
) {
  const listener = (eventName: string, payload: T) => {
    if (eventName === event) {
      handler(payload);
    }
  };
  onMounted(() => {
    source.on(event, listener, options);
  });
  onUnmounted(() => {
    source.off(event, listener);
  });
}
