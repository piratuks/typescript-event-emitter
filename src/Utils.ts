import { defaultSeparator, defaultWildCard } from './Constants';
import { EventListener, EventNamespace } from './Interfaces';
import { AsyncListener, ThrottledListener } from './Types';

/**
 * Splits the given event string into namespace and event name parts.
 * @param {string} event - The event string to parse.
 * @param {string} separator - The separator used to split the event string.
 * @returns A tuple containing the namespace and event name.
 */
export const parseEvent = (event: string, separator: string): [string, string] => {
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

/**
 * Gets the prioritized value, favoring a new value over a default value.
 * If a new value is provided and not empty, it is returned; otherwise, the default value is used.
 * @param defaultValue - The default value.
 * @param newValue - The potentially new value.
 * @returns The prioritized value.
 */
export const getPrioritizedValue = (defaultVal: string, newVal: string | undefined): string => {
  if (newVal) return newVal;

  return defaultVal;
};

/**
 * Finds information about a specific event, including its separator and event name,
 * within the provided event namespaces.
 *
 * @param event - The name of the event for which information is to be retrieved.
 * @param eventNamespaces - A record containing namespaces and their associated events and listeners.
 * @returns separator from event information.
 */
export const findEventInfo = (event: string, eventNamespaces: Record<string, EventNamespace>): string => {
  const findSeparatorInListeners = (listeners: EventListener[], condition: (l: EventListener) => boolean) => {
    const foundListener = listeners.find(condition);
    return foundListener?.eventInfo.separator || null;
  };

  const findSeparatorForEvent = (namespace: string, eventName: string, isWildcard: boolean) => {
    const listeners = eventNamespaces[namespace]?.[eventName]?.listeners;
    return listeners
      ? isWildcard
        ? findSeparatorInListeners(listeners, l => event.startsWith(namespace))
        : findSeparatorInListeners(listeners, l => l.eventInfo.event === event) ||
          (namespace === defaultWildCard
            ? findSeparatorInListeners(listeners, l => event.endsWith(`${l.eventInfo.separator}${eventName}`))
            : null)
      : null;
  };

  for (const [namespace, events] of Object.entries(eventNamespaces)) {
    for (const [eventName, _] of Object.entries(events)) {
      const isWildcard = eventName === defaultWildCard;
      const separator = findSeparatorForEvent(namespace, eventName, isWildcard);

      if (separator) {
        return separator;
      }
    }
  }

  return defaultSeparator;
};
