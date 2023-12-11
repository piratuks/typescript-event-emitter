import { assert } from 'chai';
import { globalEventBus } from '../src';

describe('GlobalEventBus', function () {
  it('should add a listener and emit an event', function (done) {
    const testData = 'Test data';
    let eventEmitted = false;

    globalEventBus.on('testEvent', (_eventName, data) => {
      assert.strictEqual(data, testData);
      eventEmitted = true;
      done();
    });

    const timeout = setTimeout(() => {
      if (!eventEmitted) {
        clearTimeout(timeout);
        done(new Error('Timeout: testEvent was not emitted.'));
      }
    }, 4000);

    globalEventBus.emit('testEvent', testData);
  });

  it('should remove a listener', function (done) {
    let listenerInvoked = false;

    const removeListener = () => {
      listenerInvoked = true;
    };

    globalEventBus.on('removeListenerEvent', removeListener);
    globalEventBus.off('removeListenerEvent', removeListener);
    globalEventBus.emit('removeListenerEvent');

    setTimeout(() => {
      assert.strictEqual(listenerInvoked, false);
      done();
    }, 1000);
  });
});
