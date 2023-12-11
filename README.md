# typescript-event-emitter

Versatile and feature-rich TypeScript library for event management, providing a solid foundation for building event-driven applications in TypeScript.

# main features

1.  Throttling and Debouncing:
    - flexibility for handling events in scenarios where rapid or frequent triggering needs to be controlled.
2.  Wildcard Listeners:
    - supporting wildcard listeners with the '\*' namespace, allowing global event handling.
3.  Namespace Support:
    - namespace support is a great way to organize and manage different types of events within your system.
4.  Priority Queue:
    - prioritizing listeners based on a priority value ensures that critical listeners can be given precedence, offering more control over event execution order.
5.  Event Filtering:
    - the ability to filter events based on registered filters provides a mechanism for selectively emitting events.
6.  Async/Await Pattern:
    - leveraging async/await for asynchronous operations ensures that it can handle asynchronous listeners gracefully.
7.  Global Event Bus Integration:
    - the integration with a global event bus enhances the modularity and usability of event system.
8.  Error Handling:
    - logging errors to the console.

## installation

```bash
$ npm install --save typescript-event-emitter
```

## usage

After installation the only thing you need to do is require the module:

```bash
import { EventEmitter } from 'typescript-event-emitter';
```

or

```bash
const { EventEmitter } = require('typescript-event-emitter');
```

And you're ready to create your own EventEmitter instances.

### Base usage

```bash
  const emitter = new EventEmitter();
  let context = { test: 'Some metada' }

  const onEventNameEmitted = (eventname:string, data:any) => {
      console.log(data === context) // true
      console.log(eventname === 'event-name') // true
  };

  emitter.on('event-name', onEventNameEmitted);  // adds listener
  emitter.emit('event-name', context); // emits listener
```

### Remove listener

```bash
  const emitter = new EventEmitter();

  const onEventNameEmitted = (eventname:string, data:any) => {
      console.log(eventname,data )
  };

  emitter.on('event-name', onEventNameEmitted);// adds listener
  emitter.off('event-name', onEventNameEmitted); // removes listener
```

### Throttling

1. First emit:

- The 'throttleEvent' is emitted.
- The throttled listener is executed immediately, and callCount becomes 1.

2. Second emit (within the 100-millisecond throttle delay):

- The 'throttleEvent' is emitted again.
- This emit is ignored because throttling prevents the listener from being executed within the 100-millisecond throttle period.

3. Third emit (within the 100-millisecond throttle delay):

- The 'throttleEvent' is emitted once more.
- This emit is also ignored due to throttling.

```bash
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
```

### Debouncing

1. First emit:

- The 'debounceEvent' is emitted.
- The debounced listener is called but not immediately executed due to the debounce delay.
- The debounced function is scheduled to be executed after 100 milliseconds.

2. Second emit (within the debounce delay):

- The 'debounceEvent' is emitted.
- The debounced listener is called again, but the previous scheduled execution is canceled, and a new one is scheduled for 100 milliseconds from the latest emit.

3. Third emit (within the debounce delay):

- The 'debounceEvent' is emitted.
- The debounced listener is called once more, canceling the previous scheduled execution again and scheduling a new one for 100 milliseconds from this emit.

So basically for the given example listener will be executed after 300 millisecond delay

```bash
  const emitter = new EventEmitter();
  let callCount = 0;
  emitter.on(
    'debounceEvent',
    () => {
      callCount++;
    },
    { debounce: 100 }
  );
  emitter.emit('debounceEvent');
  emitter.emit('debounceEvent');
  emitter.emit('debounceEvent');
```

### Wildcard

### Namespace

### Priority Queue

```bash
  const emitter = new EventEmitter();
  //last to be executed
  emitter.on('priorityEvent', () => {
      result.push('Low Priority Listener');
  });
  //first to be executed
  emitter.on(
    'priorityEvent',
    () => {
      result.push('High Priority Listener');
    },
    { priority: 2 }
  );
  //second to be executed
  emitter.on(
    'priorityEvent',
    () => {
      result.push('Medium Priority Listener');
    },
    { priority: 1 }
  );

  emitter.emit('priorityEvent');
```

### Event Filtering

```bash
  interface Message {
    id: number;
    content: string;
    messageType: string;
    sender: string;
  }

  const emitter = new EventEmitter();
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
    emitter.on(
    '*',
    (_event, message: Message) => {
      receivedNotifications.push(message);  //array will have: directMessage, generalNotification, mentionNotification objects
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
  const unrelatedEvent: Message = { id: 4, content: 'Irrelevant event', messageType: 'other' sender: 'unknown' };

  emitter.emit('other.event', unrelatedEvent),
  emitter.emit('notification', generalNotification),
  emitter.emit('dm.newMessage', directMessage),
  emitter.emit('mention.example_user', mentionNotification)
```

### Async/Await Pattern

```bash
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
  console.log(flat===true) // will be true
```

### Error Handling

```bash
  const emitter = new EventEmitter();
  emitter.on('errorEvent', () => {
    throw new Error('Listener Error');
  });
  try {
    await emitter.emit('errorEvent');
  } catch (error) {
    console.log(error) // will be 'Listener Error'
  }


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

  emitter.emit('errorEvent'); //all 3 will be fired and event flow wont be disrupted
```

### Global Event Bus

Global event bus is a singleton which contains instance of event emitter. Functionality/features and etc same it is just a centralized mechanism for communication across different parts of an application.

```bash
import { globalEventBus } from 'typescript-event-emitter';
```

or

```bash
const { globalEventBus } = require('typescript-event-emitter');
```

```bash
  let context = { test: 'Some metada' }

  const onEventNameEmitted = (eventname:string, data:any) => {
      console.log(data === context) // true
      console.log(eventname === 'event-name') // true
  };

  globalEventBus.on('event-name', onEventNameEmitted);  // adds listener
  globalEventBus.emit('event-name', context); // emits listener

```

### Tests and benchmarks

This module is well tested. You can run:

`npm test` to run the tests under Node.js.
`test:nyc` to run the tests under Node.js and get the coverage

Tests and benchmarks are not included in the npm package. If you want to play
with them you have to clone the GitHub repository. Note that you will have to run an additional `npm i` in the benchmarks folder before `npm run benchmark`.

## contributing

Please read our [Contribution Guidelines](CONTRIBUTING.md) before contributing to this project.

## security

Please read our [SECURITY REPORTS](SECURITY.md)

## license

[MIT](LICENSE)

```

```
