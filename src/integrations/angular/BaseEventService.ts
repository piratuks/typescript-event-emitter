import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { Option } from './../../index';

interface EventSource {
  on(event: string, listener: (eventName: string, payload: any) => void, options?: Option): void;
  off(event: string, listener: (eventName: string, payload: any) => void): void;
}

@Injectable()
export class BaseEventService implements OnDestroy {
  protected subscriptions: Array<() => void> = [];

  protected fromEventSource<T = unknown>(source: EventSource, event: string, options?: Option): Observable<T> {
    return new Observable<T>((subscriber: Subscriber<T>) => {
      const handler = (eventName: string, payload: T) => {
        if (eventName === event) {
          subscriber.next(payload);
        }
      };
      source.on(event, handler, options);
      const unsubscribe = () => source.off(event, handler);
      this.subscriptions.push(unsubscribe);
      return unsubscribe;
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }
}
