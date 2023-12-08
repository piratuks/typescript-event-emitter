export type Listener = (eventName: string, ...args: any[]) => void;
export type EventFilter = (eventName: string, namespace: string) => boolean;
export type ThrottledListener = (eventName: string, ...args: any[]) => void;
export type AsyncListener = (eventName: string, ...args: any[]) => Promise<void>;
