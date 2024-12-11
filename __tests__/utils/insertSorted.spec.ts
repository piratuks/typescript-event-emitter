import { assert } from 'chai';
import { insertSorted } from '../../src/Utils';

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
