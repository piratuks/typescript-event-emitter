import { useEffect, useRef } from 'react';
import { Option } from '../../index';

export function useBaseEventSource<T = unknown>(
  source: {
    on: (event: string, listener: (eventName: string, payload: T) => void, options?: Option) => void;
    off: (event: string, listener: (eventName: string, payload: T) => void) => void;
  },
  event: string,
  handler: (payload: T) => void,
  options?: Option,
  deps: any[] = []
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (eventName: string, payload: T) => {
      if (eventName === event) {
        handlerRef.current(payload);
      }
    };
    source.on(event, listener, options);
    return () => {
      source.off(event, listener);
    };
  }, [source, event, options, ...deps]);
}
