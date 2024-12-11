# typescript-event-emitter

## 2024-12-11, version 2.0.3

Introduction of new features

1. Custom separator per listener and Global configs:
   - ability to set custom separator per listener which would override global separator dedicated for listeners.
   - ability to change global separator which is used for listeners where separator is not provided.
2. Concurrency:
   - Limits the number of concurrent executions for listeners, ensuring efficient handling of multiple events at once.

## 2024-02-16, version 2.0.2

1. Republished 2.0.1 build as it was published without a build

## 2023-12-12, version 2.0.1

1. Package update/documentation update

## 2023-12-12, version 2.0.0

1. Custom separator per listener and Global configs

## 2023-12-11, version 1.0.9

Initial release with the following functionality

1. Throttling and Debouncing
2. Wildcard Listeners
3. Namespace Support
4. Priority Queue
5. Event Filtering
6. Async/Await Pattern
7. Global Event Bus Integration
8. Error Handling
