export type Listener = (...args: any[]) => void;
export type EventFilter = (eventName: string, namespace: string) => boolean;
export type ThrottledListener = (...args: any[]) => void;
export type AsyncListener = (...args: any[]) => Promise<void>;
