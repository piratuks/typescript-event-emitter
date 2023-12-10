import { separator } from './Constants';
import { AsyncListener, ThrottledListener } from './Types';

export const parseEvent = (event: string): [string, string] => {
  const parts = event.split(separator);
  const namespace = parts.length > 1 ? parts[0] : '';
  const eventName = parts[parts.length - 1];
  return [namespace, eventName];
};

export const insertSorted = (
  listeners: { listener: ThrottledListener | AsyncListener; priority: number }[],
  listenerObject: { listener: ThrottledListener | AsyncListener; priority: number }
): void => {
  const index = listeners.findIndex(l => listenerObject.priority > l.priority);
  if (index === -1) {
    listeners.push(listenerObject);
  } else {
    listeners.splice(index, 0, listenerObject);
  }
};

export const isObjectEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};
