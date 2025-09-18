import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { globalEventBus, Option } from './../../index';
import { BaseEventService } from './BaseEventService';

interface GlobalEventBusPublicAPI {
  emit: typeof globalEventBus.emit;
  getAllEventHistory: typeof globalEventBus.getAllEventHistory;
  getGlobalOptions: typeof globalEventBus.getGlobalOptions;
  getListenerManager: typeof globalEventBus.getListenerManager;
  getSpecificEventHistory: typeof globalEventBus.getSpecificEventHistory;
  inspectSubscription: typeof globalEventBus.inspectSubscription;
  removeSubscription: typeof globalEventBus.removeSubscription;
  setGlobalOptions: typeof globalEventBus.setGlobalOptions;
  subscriptions: typeof globalEventBus.subscriptions;
  on: typeof globalEventBus.on;
  off: typeof globalEventBus.off;
}

@Injectable({ providedIn: 'root' })
export class GlobalEventBusService extends BaseEventService {
  fromEvent<T = unknown>(event: string, options?: Option): Observable<T> {
    return this.fromEventSource(globalEventBus, event, options);
  }
  get instance(): GlobalEventBusPublicAPI {
    return globalEventBus as GlobalEventBusPublicAPI;
  }
}
