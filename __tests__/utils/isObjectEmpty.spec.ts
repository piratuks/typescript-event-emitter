import { assert } from 'chai';
import { isObjectEmpty } from '../../src/Utils';

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
