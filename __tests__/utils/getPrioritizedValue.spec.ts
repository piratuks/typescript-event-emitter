import { assert } from 'chai';
import { getPrioritizedValue } from '../../src/Utils';

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
