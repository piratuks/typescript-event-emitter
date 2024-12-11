import { assert } from 'chai';
import { EventEmitter, EventFilter, defaultSeparator } from '../src';

interface Message {
  id: number;
  content: string;
  messageType: string;
  sender: string;
}

describe('EventEmitter', function () {
  it('should add a listener and emit an event', function (done) {
    const testData = 'Test data';
    let eventEmitted = false;
    const emitter = new EventEmitter();

    emitter.on('testEvent', (_eventname, data) => {
      assert.strictEqual(data, testData);
      eventEmitted = true;
      done();
    });

    const timeout = setTimeout(() => {
      if (!eventEmitted) {
        clearTimeout(timeout);
        done(new Error('Timeout: testEvent was not emitted.'));
      }
    }, 5000);

    emitter.emit('testEvent', testData);
  });

  it('should remove a listener', function (done) {
    let listenerInvoked = false;
    const emitter = new EventEmitter();

    const removeListener = () => {
      listenerInvoked = true;
    };

    emitter.on('removeListenerEvent', removeListener);
    emitter.off('removeListenerEvent', removeListener);
    emitter.emit('removeListenerEvent');

    setTimeout(() => {
      assert.strictEqual(listenerInvoked, false);
      done();
    }, 1000);
  });

  it('should execute listeners in priority order', async function () {
    const emitter = new EventEmitter();
    const result: string[] = [];

    emitter.on('priorityEvent', () => {
      result.push('Low Priority Listener');
    });
    emitter.on(
      'priorityEvent',
      () => {
        result.push('High Priority Listener');
      },
      { priority: 2 }
    );
    emitter.on(
      'priorityEvent',
      () => {
        result.push('Medium Priority Listener');
      },
      { priority: 1 }
    );

    await emitter.emit('priorityEvent');

    assert.deepEqual(result, ['High Priority Listener', 'Medium Priority Listener', 'Low Priority Listener']);
  });

  it('should execute wildcard listeners for everything', async function () {
    const emitter = new EventEmitter();

    const result: string[] = [];

    emitter.on('*', () => {
      result.push('Wildcard Everything Listener');
    });

    await emitter.emit('someEvent');
    await emitter.emit('namespace.someEvent');

    assert.equal(result.length, 2);
  });

  it('should execute wildcard listeners for namespace', async function () {
    const emitter = new EventEmitter();

    const result: string[] = [];

    emitter.on('namespace1.*', () => {
      result.push('Listener');
    });

    emitter.on('namespace2.*', () => {
      result.push('Listener');
    });

    emitter.on(
      'namespace3.*',
      () => {
        result.push('Listener');
      },
      { separator: ':' }
    );

    emitter.on(
      'namespace3:*',
      () => {
        result.push('Listener');
      },
      { separator: ':' }
    );

    await emitter.emit('other.event1');
    await emitter.emit('namespace1.event1');
    await emitter.emit('namespace1.event2');
    await emitter.emit('namespace3:event1');
    await emitter.emit('namespace3:event2');

    assert.equal(result.length, 4);
  });

  it('should execute wildcard listeners as namespace for event', async function () {
    const emitter = new EventEmitter();

    const result: string[] = [];

    emitter.on('*.someEvent', () => {
      result.push('Listener');
    });

    emitter.on('*.someOtherEvent', () => {
      result.push('Listener');
    });

    emitter.on(
      '*:someOtherEvent',
      () => {
        result.push('Listener');
      },
      { separator: ':' }
    );

    await emitter.emit('other.event1');
    await emitter.emit('other.someEvent');
    await emitter.emit('namespace1.event1');
    await emitter.emit('namespace1.someEvent');
    await emitter.emit('namespace1.event1');
    await emitter.emit('namespace1:someOtherEvent');

    assert.equal(result.length, 3);
  });

  it('should execute namespace for event', async function () {
    const emitter = new EventEmitter();

    const result: string[] = [];

    emitter.on('someEvent', () => {
      result.push('Listener');
    });

    emitter.on('namespace.someEvent', () => {
      result.push('Listener');
    });

    await emitter.emit('other.event');
    await emitter.emit('namespace.someEvent');
    await emitter.emit('namespace.event');

    assert.equal(result.length, 1);
  });

  it('should handle asynchronous event listeners using async/await', async function () {
    const emitter = new EventEmitter();
    let flag = false;

    emitter.on('asyncEvent', async () => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          flag = true;
          resolve();
        }, 100);
      });
    });

    await emitter.emit('asyncEvent');

    assert.equal(flag, true);
  });

  it('should handle errors thrown by listeners during emit', async function () {
    const emitter = new EventEmitter();

    emitter.on('errorEvent', () => {
      throw new Error('Listener Error');
    });

    console.error = () => {};

    try {
      await emitter.emit('errorEvent');
    } catch (error) {
      assert.strictEqual(error, 'Listener Error');
    }
  });

  it('should log errors thrown by listeners during emit', async function () {
    const emitter = new EventEmitter();

    const consoleError = console.error;

    let loggedError: string | undefined;
    console.error = (message: string) => {
      loggedError = message;
    };

    emitter.on('errorEvent', () => {
      throw new Error('Listener Error');
    });

    await emitter.emit('errorEvent');

    console.error = consoleError;

    assert.isTrue(loggedError?.includes('Listener Error'));
  });

  it('should not disrupt the event flow due to a listener error', async function () {
    const emitter = new EventEmitter();
    let firstListenerInvoked = false;
    let secondListenerInvoked = false;

    emitter.on('errorEvent', () => {
      throw new Error('Listener Error');
    });

    emitter.on('errorEvent', () => {
      firstListenerInvoked = true;
    });

    emitter.on('errorEvent', () => {
      secondListenerInvoked = true;
    });

    await emitter.emit('errorEvent');

    assert.isTrue(firstListenerInvoked);
    assert.isTrue(secondListenerInvoked);
  });

  it('should debounce the listener', async function () {
    const execute = async (): Promise<void> => {
      await Promise.all([emitter.emit('debounceEvent'), emitter.emit('debounceEvent'), emitter.emit('debounceEvent')]);

      await new Promise(resolve => setTimeout(resolve, 200));
    };

    const emitter = new EventEmitter();

    let callCount = 0;

    emitter.on(
      'debounceEvent',
      () => {
        callCount++;
      },
      { debounce: 100 }
    );

    await execute();

    assert.strictEqual(callCount, 1);

    await execute();

    assert.strictEqual(callCount, 2);
  });

  it('should throttle the listener', async function () {
    const emitter = new EventEmitter();

    let callCount = 0;

    emitter.on(
      'throttleEvent',
      () => {
        callCount++;
      },
      { throttle: 100 }
    );

    emitter.emit('throttleEvent');
    emitter.emit('throttleEvent');
    emitter.emit('throttleEvent');

    await new Promise(resolve => setTimeout(resolve, 200));

    assert.strictEqual(callCount, 1);
  });

  it('should filter events based on the provided filter function', async function () {
    const messagingEventEmitter = new EventEmitter();
    const currentUser = { username: 'example_user' };
    const notificationFilter: EventFilter = (eventName, namespace) => {
      if (namespace === 'dm') {
        return true;
      }
      if (eventName === 'notification') {
        return true;
      }
      if (namespace === 'mention' && currentUser.username === eventName) {
        return true;
      }

      return false;
    };

    const receivedNotifications: Message[] = [];

    messagingEventEmitter.on(
      '*',
      (_event, message: Message) => {
        receivedNotifications.push(message);
      },
      { filter: notificationFilter }
    );
    const directMessage: Message = { id: 1, content: 'Hello!', messageType: 'dm', sender: 'user123' };
    const generalNotification: Message = {
      id: 2,
      content: 'General update',
      messageType: 'announcement',
      sender: 'system'
    };
    const mentionNotification: Message = {
      id: 3,
      content: 'You were mentioned!',
      messageType: 'mention',
      sender: 'other_user'
    };
    const unrelatedEvent: Message = { id: 4, content: 'Irrelevant event', messageType: 'other', sender: 'unknown' };

    await Promise.all([
      messagingEventEmitter.emit('other.event', unrelatedEvent),
      messagingEventEmitter.emit('notification', generalNotification),
      messagingEventEmitter.emit('dm.newMessage', directMessage),
      messagingEventEmitter.emit('mention.example_user', mentionNotification)
    ]);
    await new Promise(resolve => setTimeout(resolve, 200));

    assert.equal(receivedNotifications.length, 3);
  });

  it('should set new global options', () => {
    const eventEmitter: EventEmitter = new EventEmitter({ separator: ':' });
    const newSeparator = '_';
    eventEmitter.setGlobalOptions({ separator: newSeparator });

    const listener = () => {};
    eventEmitter.on('testEvent', listener);

    const listeners = eventEmitter['eventNamespaces']['']['testEvent'].listeners;
    assert.strictEqual(listeners[0].eventInfo.separator, '_');
  });

  it('should set default global options', () => {
    const eventEmitter: EventEmitter = new EventEmitter({ separator: ':' });

    const listener = () => {};
    eventEmitter.on('testEvent', listener);

    const listeners = eventEmitter['eventNamespaces']['']['testEvent'].listeners;
    assert.strictEqual(listeners[0].eventInfo.separator, ':');
  });

  it('should use local separator in on, off, and emit if provided', () => {
    const eventEmitter: EventEmitter = new EventEmitter({ separator: ':' });

    eventEmitter.on('example_event', () => {}, { separator: '_' });
    const listeners = eventEmitter['eventNamespaces']['example']['event'].listeners;
    assert.strictEqual(listeners[0].eventInfo.separator, '_');
  });

  it('should use default separator if neither global nor local separator is provided', () => {
    const eventEmitter: EventEmitter = new EventEmitter();

    eventEmitter.on('example.event', () => {});
    const listeners = eventEmitter['eventNamespaces']['example']['event'].listeners;
    assert.strictEqual(listeners[0].eventInfo.separator, defaultSeparator);
  });

  it('should be present event info for each listener', done => {
    const eventEmitter: EventEmitter = new EventEmitter();

    let listenerInvoked0 = false;
    let listenerInvoked1 = false;
    let listenerInvoked2 = false;
    const removeListener0 = () => {
      listenerInvoked0 = true;
    };
    const removeListener1 = () => {
      listenerInvoked1 = true;
    };
    const removeListener2 = () => {
      listenerInvoked2 = true;
    };

    eventEmitter.on('example0.event', removeListener0);
    eventEmitter.on('example1_event', removeListener1, { separator: '_' });
    eventEmitter.on('example2:event', removeListener2, { separator: ':' });

    const listeners0 = eventEmitter['eventNamespaces']['example0']['event'].listeners;
    const listeners1 = eventEmitter['eventNamespaces']['example1']['event'].listeners;
    const listeners2 = eventEmitter['eventNamespaces']['example2']['event'].listeners;

    assert.strictEqual(listeners0[0].eventInfo.separator, defaultSeparator);
    assert.strictEqual(listeners1[0].eventInfo.separator, '_');
    assert.strictEqual(listeners2[0].eventInfo.separator, ':');

    eventEmitter.off('example0.event', removeListener0);
    eventEmitter.off('example1_event', removeListener1);
    eventEmitter.off('example2:event', removeListener2);

    eventEmitter.emit('example0.event');
    eventEmitter.emit('example1_event');
    eventEmitter.emit('example2:event');

    setTimeout(() => {
      assert.strictEqual(listenerInvoked0, false);
      assert.strictEqual(listenerInvoked1, false);
      assert.strictEqual(listenerInvoked2, false);
      done();
    }, 1000);
  });

  it('should handle concurrency correctly', async function () {
    const messages: string[] = [];

    const emitter = new EventEmitter();

    emitter.on(
      'data:received',
      async (eventName, data) => {
        messages.push(`Listener 1 started processing: ${data}`);
        await new Promise(resolve => setTimeout(resolve, 150));
        messages.push(`Listener 1 finished processing: ${data}`);
      },
      { concurrency: 2 }
    );

    emitter.on(
      'data:received',
      async (eventName, data) => {
        messages.push(`Listener 2 started processing: ${data}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        messages.push(`Listener 2 finished processing: ${data}`);
      },
      { concurrency: 1 }
    );

    await Promise.all([
      emitter.emit('data:received', 'Payload 1'),
      emitter.emit('data:received', 'Payload 2'),
      emitter.emit('data:received', 'Payload 3'),
      emitter.emit('data:received', 'Payload 4')
    ]);

    assert.deepEqual(
      messages,
      [
        'Listener 1 started processing: Payload 1',
        'Listener 2 started processing: Payload 1',
        'Listener 1 started processing: Payload 2',
        'Listener 1 finished processing: Payload 1',
        'Listener 1 started processing: Payload 3',
        'Listener 1 finished processing: Payload 2',
        'Listener 1 started processing: Payload 4',
        'Listener 2 finished processing: Payload 1',
        'Listener 2 started processing: Payload 2',
        'Listener 1 finished processing: Payload 3',
        'Listener 1 finished processing: Payload 4',
        'Listener 2 finished processing: Payload 2',
        'Listener 2 started processing: Payload 3',
        'Listener 2 finished processing: Payload 3',
        'Listener 2 started processing: Payload 4',
        'Listener 2 finished processing: Payload 4'
      ],
      'Messages are not in the expected order'
    );
  });
});
