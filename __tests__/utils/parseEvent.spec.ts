import { assert } from 'chai';
import { defaultSeparator } from '../../src';
import { parseEvent } from '../../src/Utils';

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
