import { separator } from './Constants';
import { AsyncListener, ThrottledListener } from './Types';

/**
 * Splits the given event string into namespace and event name parts.
 * @param event - The event string to parse.
 * @returns A tuple containing the namespace and event name.
 */
export const parseEvent = (event: string): [string, string] => {
  const parts = event.split(separator);
  const namespace = parts.length > 1 ? parts[0] : '';
  const eventName = parts[parts.length - 1];
  return [namespace, eventName];
};

/**
 * Inserts a listener object into a sorted array based on priority.
 * @param listeners - The array of listener objects to insert into.
 * @param listenerObject - The listener object to be inserted, containing the listener function and its priority.
 */
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

/**
 * Checks if the provided object is empty (has no own enumerable properties).
 * @param obj - The object to check for emptiness.
 * @returns `true` if the object is empty; otherwise, `false`.
 */
export const isObjectEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};
