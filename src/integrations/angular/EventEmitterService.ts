import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventEmitter } from '../../EventEmitter';
import { Option } from './../../index';
import { BaseEventService } from './BaseEventService';

@Injectable({ providedIn: 'root' })
export class EventEmitterService extends BaseEventService {
  constructor(private emitter: EventEmitter) {
    super();
  }
  fromEvent<T = unknown>(event: string, options?: Option): Observable<T> {
    return this.fromEventSource(this.emitter, event, options);
  }
  get instance() {
    return this.emitter;
  }
}
