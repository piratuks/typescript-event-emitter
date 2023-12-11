import { assert } from 'chai';
import { EventNamespace } from '../src';
import { defaultSeparator } from '../src/Constants';
import { findEventInfo, getPrioritizedValue, insertSorted, isObjectEmpty, parseEvent } from '../src/Utils';

describe('parseEvent', () => {
  it('should correctly parse the event with a separator', () => {
    const event = 'namespace.eventName';
    const result = parseEvent(event, defaultSeparator);
    assert.deepStrictEqual(result, ['namespace', 'eventName']);
  });

  it('should handle events without a namespace', () => {
    const event = 'eventName';
    const result = parseEvent(event, defaultSeparator);
    assert.deepStrictEqual(result, ['', 'eventName']);
  });

  it('should correctly parse the event with a custom separator', () => {
    const event = 'namespace----eventName';
    const result = parseEvent(event, '----');
    assert.deepStrictEqual(result, ['namespace', 'eventName']);
  });
});

describe('isObjectEmpty', () => {
  it('should return true for an empty object', () => {
    const obj = {};
    const result = isObjectEmpty(obj);
    assert.strictEqual(result, true);
  });

  it('should return false for an object with properties', () => {
    const obj = { key: 'value' };
    const result = isObjectEmpty(obj);
    assert.strictEqual(result, false);
  });

  it('should return true for an empty object with prototype properties', () => {
    const obj = Object.create(null);
    const result = isObjectEmpty(obj);
    assert.strictEqual(result, true);
  });

  it('should return true for an object with prototype properties, but empty own properties', () => {
    const obj = Object.create({ key: 'value' });
    const result = isObjectEmpty(obj);
    assert.strictEqual(result, true);
  });

  it('should return false for an object with own properties and prototype properties', () => {
    const obj = Object.create({ key: 'value' });
    obj.anotherKey = 'anotherValue';
    const result = isObjectEmpty(obj);
    assert.strictEqual(result, false);
  });
});

describe('insertSorted', () => {
  const someListener = () => {};
  const anotherListener = () => {};
  const listenerA = () => {};
  const listenerB = () => {};
  const listenerC = () => {};

  it('should insert the listener in an empty array', () => {
    const listeners: {
      listener: () => void;
      priority: number;
    }[] = [];
    const listenerObject = { listener: someListener, priority: 1 };
    insertSorted(listeners, listenerObject);
    assert.deepStrictEqual(listeners, [listenerObject]);
  });

  it('should insert the listener at the beginning', () => {
    const listeners = [{ listener: anotherListener, priority: 2 }];
    const listenerObject = { listener: someListener, priority: 3 };
    insertSorted(listeners, listenerObject);
    assert.deepStrictEqual(listeners, [listenerObject, { listener: anotherListener, priority: 2 }]);
  });

  it('should insert the listener in the middle', () => {
    const listeners = [
      { listener: listenerC, priority: 5 },
      { listener: listenerB, priority: 3 },
      { listener: listenerA, priority: 1 }
    ];
    const listenerObject = { listener: someListener, priority: 4 };
    insertSorted(listeners, listenerObject);

    assert.deepStrictEqual(listeners, [
      { listener: listenerC, priority: 5 },
      { listener: someListener, priority: 4 },
      { listener: listenerB, priority: 3 },
      { listener: listenerA, priority: 1 }
    ]);
  });

  it('should insert the listener at the start', () => {
    const listeners = [{ listener: anotherListener, priority: 2 }];
    const listenerObject = { listener: someListener, priority: 3 };
    insertSorted(listeners, listenerObject);
    assert.deepStrictEqual(listeners, [listenerObject, { listener: anotherListener, priority: 2 }]);
  });

  it('should handle equal priorities by inserting at the end', () => {
    const listeners = [{ listener: listenerA, priority: 2 }];
    const listenerObject = { listener: someListener, priority: 2 };
    insertSorted(listeners, listenerObject);
    assert.deepStrictEqual(listeners, [{ listener: listenerA, priority: 2 }, listenerObject]);
  });
});

describe('getPrioritizedValue', () => {
  it('should return the new value if provided', () => {
    const defaultVal = ':';
    const newVal = ',';

    const result = getPrioritizedValue(defaultVal, newVal);

    assert.strictEqual(result, newVal);
  });

  it('should return the default value if new value is undefined', () => {
    const defaultVal = ':';
    const newVal: string | undefined = undefined;

    const result = getPrioritizedValue(defaultVal, newVal);

    assert.strictEqual(result, defaultVal);
  });

  it('should return the default value if new value is an empty string', () => {
    const defaultVal = ':';
    const newVal = '';

    const result = getPrioritizedValue(defaultVal, newVal);

    assert.strictEqual(result, defaultVal);
  });
});

describe('findEventInfo', () => {
  const eventNamespaces: Record<string, EventNamespace> = {
    namespace1: {
      event1: {
        listeners: [{ listener: () => {}, eventInfo: { separator: '|', event: 'namespace1.event1' }, priority: 0 }]
      },
      event2: {
        listeners: [{ listener: () => {}, eventInfo: { separator: ',', event: 'namespace1.event2' }, priority: 0 }]
      }
    },
    namespace2: {
      event3: {
        listeners: [{ listener: () => {}, eventInfo: { separator: ',', event: 'namespace2.event3' }, priority: 0 }]
      }
    }
  };

  it('should find event information when a listener matches the provided event', () => {
    const result = findEventInfo('namespace1.event1', eventNamespaces);
    assert.deepStrictEqual(result, '|');
  });

  it('should use the default separator when no matching listener is found', () => {
    const result = findEventInfo('event4', eventNamespaces);
    assert.deepStrictEqual(result, defaultSeparator);
  });

  it('should find event information in different namespaces', () => {
    const result = findEventInfo('namespace2.event3', eventNamespaces);
    assert.deepStrictEqual(result, ',');
  });
});
