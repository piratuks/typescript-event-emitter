import { insertSorted, isObjectEmpty, parseEvent } from '../src/Utils';
import chai = require('chai');

describe('parseEvent', () => {
  it('should correctly parse the event with a separator', () => {
    const event = 'namespace.eventName';
    const result = parseEvent(event);
    chai.assert.deepStrictEqual(result, ['namespace', 'eventName']);
  });

  it('should handle events without a namespace', () => {
    const event = 'eventName';
    const result = parseEvent(event);
    chai.assert.deepStrictEqual(result, ['', 'eventName']);
  });
});

describe('isObjectEmpty', () => {
  it('should return true for an empty object', () => {
    const obj = {};
    const result = isObjectEmpty(obj);
    chai.assert.strictEqual(result, true);
  });

  it('should return false for an object with properties', () => {
    const obj = { key: 'value' };
    const result = isObjectEmpty(obj);
    chai.assert.strictEqual(result, false);
  });

  it('should return true for an empty object with prototype properties', () => {
    const obj = Object.create(null);
    const result = isObjectEmpty(obj);
    chai.assert.strictEqual(result, true);
  });

  it('should return true for an object with prototype properties, but empty own properties', () => {
    const obj = Object.create({ key: 'value' });
    const result = isObjectEmpty(obj);
    chai.assert.strictEqual(result, true);
  });

  it('should return false for an object with own properties and prototype properties', () => {
    const obj = Object.create({ key: 'value' });
    obj.anotherKey = 'anotherValue';
    const result = isObjectEmpty(obj);
    chai.assert.strictEqual(result, false);
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
    chai.assert.deepStrictEqual(listeners, [listenerObject]);
  });

  it('should insert the listener at the beginning', () => {
    const listeners = [{ listener: anotherListener, priority: 2 }];
    const listenerObject = { listener: someListener, priority: 3 };
    insertSorted(listeners, listenerObject);
    chai.assert.deepStrictEqual(listeners, [listenerObject, { listener: anotherListener, priority: 2 }]);
  });

  it('should insert the listener in the middle', () => {
    const listeners = [
      { listener: listenerC, priority: 5 },
      { listener: listenerB, priority: 3 },
      { listener: listenerA, priority: 1 }
    ];
    const listenerObject = { listener: someListener, priority: 4 };
    insertSorted(listeners, listenerObject);

    chai.assert.deepStrictEqual(listeners, [
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
    chai.assert.deepStrictEqual(listeners, [listenerObject, { listener: anotherListener, priority: 2 }]);
  });

  it('should handle equal priorities by inserting at the end', () => {
    const listeners = [{ listener: listenerA, priority: 2 }];
    const listenerObject = { listener: someListener, priority: 2 };
    insertSorted(listeners, listenerObject);
    chai.assert.deepStrictEqual(listeners, [{ listener: listenerA, priority: 2 }, listenerObject]);
  });
});
