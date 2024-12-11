import { assert } from 'chai';
import { globalEventBus, GlobalOption, Listener } from '../src';
import { ListenerManager } from '../src/ListenerManager';
import { Option } from './../src/Interfaces';

describe('GlobalEventBus', () => {
  it('should return the same instance on subsequent calls', () => {
    const instance1 = globalEventBus;
    const instance2 = globalEventBus;
    assert.strictEqual(instance1, instance2, 'Instances should be the same');
  });

  it('should set and get global options', () => {
    const options: GlobalOption = { separator: ',' };
    globalEventBus.setGlobalOptions(options);
    const retrievedOptions = globalEventBus.getGlobalOptions();
    assert.deepEqual(retrievedOptions, options, 'Global options should match');
  });

  it('should return a ListenerManager instance', () => {
    const listenerManager = globalEventBus.getListenerManager();
    assert.instanceOf(listenerManager, ListenerManager, 'Should return a ListenerManager instance');
  });

  it('should add a listener for an event', () => {
    const event = 'testEvent';
    const listener: Listener = () => {};
    globalEventBus.on(event, listener);
    const subscriptions = globalEventBus.subscriptions();
    assert.isTrue(
      subscriptions.some(sub => sub.event === event),
      'Listener should be added to event'
    );
    globalEventBus.off(event, listener);
  });

  it('should remove a listener from an event', () => {
    const event = 'testEvent';
    const listener: Listener = () => {};
    globalEventBus.on(event, listener);
    globalEventBus.off(event, listener);
    const subscriptions = globalEventBus.subscriptions();

    assert.isFalse(
      subscriptions.some(sub => sub.event === event),
      'Listener should be removed from event'
    );
  });

  it('should emit an event and call the listener', async () => {
    const event = 'testEvent';
    let called = false;
    const listener: Listener = () => {
      called = true;
    };
    globalEventBus.on(event, listener);
    await globalEventBus.emit(event);
    assert.isTrue(called, 'Listener should be called when event is emitted');
    globalEventBus.off(event, listener);
  });

  it('should apply options like throttle, debounce, and priority', () => {
    const event = 'testEvent';
    const listener: Listener = () => {};
    const options: Option = { throttle: 100, debounce: 100, priority: 1 };
    globalEventBus.on(event, listener, options);
    const subscription = globalEventBus.inspectSubscription(event)[0];
    assert.strictEqual(subscription.priority, options.priority, 'Priority should match');
    globalEventBus.off(event, listener);
  });

  it('should handle errors during emission', async () => {
    const event = 'testEvent';
    const listener: Listener = () => {
      throw new Error('Listener Error');
    };

    const consoleError = console.error;

    const loggedError: string[] = [];
    console.error = (message: string) => {
      loggedError.push(message);
    };

    globalEventBus.on(event, listener);

    await globalEventBus.emit(event);

    console.error = consoleError;

    assert.isTrue(loggedError.some((item: string) => item.indexOf('Listener Error') > -1));

    globalEventBus.off(event, listener);
  });
});
