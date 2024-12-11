import { assert } from 'chai';
import { v4 as uuidv4 } from 'uuid';
import { EventNamespace, defaultSeparator } from '../../src';
import { findEventInfo } from '../../src/Utils';

describe('findEventInfo', () => {
  const eventNamespaces: Record<string, EventNamespace> = {
    namespace1: {
      event1: {
        listeners: [
          {
            listener: () => {},
            eventInfo: { separator: '|', event: 'namespace1.event1' },
            priority: 0,
            concurrency: 10,
            id: uuidv4()
          }
        ]
      },
      event2: {
        listeners: [
          {
            listener: () => {},
            eventInfo: { separator: ',', event: 'namespace1.event2' },
            priority: 0,
            concurrency: 10,
            id: uuidv4()
          }
        ]
      }
    },
    namespace2: {
      event3: {
        listeners: [
          {
            listener: () => {},
            eventInfo: { separator: ',', event: 'namespace2.event3' },
            priority: 0,
            concurrency: 10,
            id: uuidv4()
          }
        ]
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
