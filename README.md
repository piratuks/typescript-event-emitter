# typescript-event-emitter

Versatile and feature-rich TypeScript library for event management, providing a solid foundation for building event-driven applications in TypeScript.

| \*  | Version   | Supported          |
| --- | --------- | ------------------ |
| npm | >= 7.24.0 | :white_check_mark: |

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
    - the integration with a global event bus enhances the modularity and usability of the event system.
8.  Error Handling:
    - logging errors to the console.
9.  Custom separator per listener and Global configs:
    - ability to set custom separator per listener which would override global separator dedicated for listeners.
    - ability to change global separator which is used for listeners where separator is not provided.
10. Concurrency:
    - Limits the number of concurrent executions for listeners, ensuring efficient handling of multiple events at once.

## installation

```bash
$ npm install --save typescript-event-emitter
```

## usage

After installation, the only thing you need to do is require the module:

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

So basically for the given example, the listener will be executed after 300 millisecond delay

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

```bash
  const emitter = new EventEmitter();
  emitter.on('*', () => { // listener will be executed for both emits, wildcard listens to anything
    console.log("Executed")
  });
  emitter.emit('someEvent');
  emitter.emit('namespace.someEvent');
```

```bash
  const emitter = new EventEmitter();
  emitter.on('namespace1.*', () => { // listener will be executed 2 times, wildcard for namespace listens to anything within that namespace
    console.log("Executed 1")
  });

  emitter.on('namespace2.*', () => { // listener will not be executed
    console.log("Executed 2")
  });

  emitter.emit('other.event1');
  emitter.emit('namespace1.event1');
  emitter.emit('namespace1.event2');
```

```bash
  const emitter = new EventEmitter();
  emitter.on('*.someEvent', () => { // wildcard listeners as namespace for event
     console.log("Executed")
  });

  emitter.emit('other.event1'); // No match, no listener executed
  emitter.emit('other.someEvent'); // Matches the pattern, listener executed
  emitter.emit('namespace1.event1'); // No match, no listener executed
  emitter.emit('namespace1.someEvent'); // Matches the pattern, listener executed
```

### Namespace

```bash
  const emitter = new EventEmitter();

  emitter.on('someEvent', () => {
    console.log('Listener');
  });

  emitter.on('namespace.someEvent', () => {
    console.log('Listener');
  });

  emitter.emit('other.event'); // No match, no listener executed
  emitter.emit('namespace.someEvent'); // Matches the pattern, listener executed
  emitter.emit('namespace.event'); // No match, no listener executed
```

### Priority Queue

```bash
  const emitter = new EventEmitter();
  //last to be executed
  emitter.on('priorityEvent', () => {
      console.log('Low Priority Listener');
  });
  //first to be executed
  emitter.on(
    'priorityEvent',
    () => {
      console.log('High Priority Listener');
    },
    { priority: 2 }
  );
  //second to be executed
  emitter.on(
    'priorityEvent',
    () => {
      console.log('Medium Priority Listener');
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
  const unrelatedEvent: Message = { id: 4, content: 'Irrelevant event', messageType: 'other', sender: 'unknown' };

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
  console.log(flag); // will be true
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
```

```bash
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

  emitter.emit('errorEvent'); //all 3 will be fired and event flow won't be disrupted
```

### Global Event Bus

The global event bus is a singleton that contains an instance of an event emitter. Functionality/features, etc is just a centralized mechanism for communication across different parts of an application.

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

### Custom separator per listener and Global configs

```bash
  const eventEmitter: EventEmitter = new EventEmitter({ separator: ':' }); // setting global separator if not provided it will revert to default "."

  eventEmitter.on("namespace:someEvent", () => {});
```

```bash
  const eventEmitter: EventEmitter = new EventEmitter(); // default separator '.'
  eventEmitter.setGlobalOptions({ separator: "-" }); // sets global separator which can be provided via constructor aswell

  eventEmitter.on("namespace-someEvent", () => {});
  eventEmitter.off("namespace-someEvent");

  eventEmitter.on("namespace:someEvent1", () => {}, { separator: ":" }); // listener separator will be ':'
  eventEmitter.off("namespace:someEvent1");

  eventEmitter.on("namespace:someEvent2", () => {}, { separator: ":" }); // listener separator will be ':'
  eventEmitter.on("namespace-someEvent3", () => {}); // listener separator will be '-' as it was set via setGlobalOptions

  eventEmitter.off("namespace:someEvent2");
  eventEmitter.off("namespace-someEvent3");
```

```bash
  const eventEmitter: EventEmitter = new EventEmitter({ separator: ':' }); // setting global separator if not provided it will revert to default "."

  globalEventBus.setGlobalOptions({ separator: "-" }); // sets global separator
  globalEventBus.on("namespace:someEvent", () => {}, { separator: ":" });  // listener separator will be ':'
```

### Concurrency

```bash

  // Step 1: Create an instance of EventEmitter
  const emitter = new EventEmitter();

  // Step 2: Add event listeners
  emitter.on('data:received', async (eventName, data) => {
    console.log(`Listener 1 started processing: ${data}`);
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate processing time
    console.log(`Listener 1 finished processing: ${data}`);
  }, { concurrency: 2 });  // Limit this listener to 2 concurrent executions

  emitter.on('data:received', async (eventName, data) => {
    console.log(`Listener 2 started processing: ${data}`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
    console.log(`Listener 2 finished processing: ${data}`);
  }, { concurrency: 1 });  // Limit this listener to 1 concurrent execution

  emitter.on('data:received', async (eventName, data) => {
    console.log(`Listener 3 started processing: ${data}`);
    await new Promise(resolve => setTimeout(resolve, 250)); // Simulate processing time
    console.log(`Listener 3 finished processing: ${data}`);
  }, { concurrency: 3 });  // Limit this listener to 3 concurrent executions

  // Step 3: Emit an event
  console.log('Emitting event: data:received');
  await Promise.all([
    emitter.emit('data:received', 'Payload 1'),
    emitter.emit('data:received', 'Payload 2'),
    emitter.emit('data:received', 'Payload 3'),
    emitter.emit('data:received', 'Payload 4'),
  ]);

  // Output
  // Emitting event: data:received
  // Listener 1 started processing: Payload 1
  // Listener 2 started processing: Payload 1
  // Listener 3 started processing: Payload 1
  // Listener 1 started processing: Payload 2
  // Listener 3 started processing: Payload 2
  // Listener 3 started processing: Payload 3
  // Listener 1 finished processing: Payload 1
  // Listener 1 started processing: Payload 3
  // Listener 1 finished processing: Payload 2
  // Listener 1 started processing: Payload 4
  // Listener 2 finished processing: Payload 1
  // Listener 2 started processing: Payload 2
  // Listener 3 finished processing: Payload 1
  // Listener 3 started processing: Payload 4
  // Listener 3 finished processing: Payload 2
  // Listener 3 finished processing: Payload 3
  // Listener 1 finished processing: Payload 3
  // Listener 1 finished processing: Payload 4
  // Listener 2 finished processing: Payload 2
  // Listener 2 started processing: Payload 3
  // Listener 3 finished processing: Payload 4
  // Listener 2 finished processing: Payload 3
  // Listener 2 started processing: Payload 4
  // Listener 2 finished processing: Payload 4

```

## Tests

This module is well-tested. You can run:

`npm run test` to run the tests under Node.js.
<br/>
`npm run test:nyc` to run the tests under Node.js and get the coverage

Tests are not included in the npm package. If you want to play with them, you must clone the GitHub repository.

## contributing

Please read our [Contribution Guidelines](CONTRIBUTING.md) before contributing to this project.

## security

Please read our [SECURITY REPORTS](SECURITY.md)

## license

[MIT](LICENSE)
