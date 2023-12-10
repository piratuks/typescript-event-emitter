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
$ npm install --save typescrpt-event-emitter
```

## usage

After installation the only thing you need to do is require the module:

```bash
import { EventEmitter } from 'typescrpt-event-emitter';
```

or

```bash
var EventEmitter = require('typescrpt-event-emitter');
```

And you're ready to create your own EventEmitter instances.

### Base

```bash
  const emitter = new EventEmitter();
  let context = { test: 'Some metada' }

  const onEventNameEmitted = (eventname:string, data:any) => {
      console.log(data === context) // true
  };

  emitter.on('event-name', onEventNameEmitted);
  emitter.off('event-name', onEventNameEmitted); // removes listener
```

### Throttling

### Debouncing

### Wildcard

### Namespace

### Priority Queue

### Event Filtering

### Async/Await Pattern

### Error Handling

### Global Event Bus

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
