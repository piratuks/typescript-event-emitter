import { EventEmitter, EventFilter } from '../src';
import chai = require('chai');
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
      chai.assert.strictEqual(data, testData);
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
      chai.assert.strictEqual(listenerInvoked, false);
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
        result.push('Medium Priority Listener');
      },
      { priority: 2 }
    );
    emitter.on(
      'priorityEvent',
      () => {
        result.push('High Priority Listener');
      },
      { priority: 1 }
    );

    await emitter.emit('priorityEvent');

    chai.assert.deepEqual(result, ['Medium Priority Listener', 'High Priority Listener', 'Low Priority Listener']);
  });

  it('should execute wildcard listeners for everything', async function () {
    const emitter = new EventEmitter();

    const result: string[] = [];

    emitter.on('*', () => {
      result.push('Wildcard Everything Listener');
    });

    await emitter.emit('someEvent');
    await emitter.emit('namespace.someEvent');

    chai.assert.equal(result.length, 2);
  });

  it('should execute wildcard listeners for namespace', async function () {
    const emitter = new EventEmitter();

    const result: string[] = [];

    emitter.on('namespace1.*', () => {
      result.push('Wildcard Namespace Listener');
    });

    emitter.on('namespace2.*', () => {
      result.push('Wildcard Namespace Listener');
    });

    await emitter.emit('other.event1');
    await emitter.emit('namespace1.event1');
    await emitter.emit('namespace1.event2');

    chai.assert.equal(result.length, 2);
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

    chai.assert.equal(flag, true);
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
      chai.assert.strictEqual(error, 'Listener Error');
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

    chai.assert.isTrue(loggedError?.includes('Listener Error'));
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

    chai.assert.isTrue(firstListenerInvoked);
    chai.assert.isTrue(secondListenerInvoked);
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

    chai.assert.strictEqual(callCount, 1);

    await execute();

    chai.assert.strictEqual(callCount, 2);
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

    chai.assert.strictEqual(callCount, 1);
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

    chai.assert.equal(receivedNotifications.length, 3);
  });
});
