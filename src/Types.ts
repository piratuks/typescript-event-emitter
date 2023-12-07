export type Listener = (...args: any[]) => void;
export type EventFilter = (event: string) => boolean;
export type ThrottledListener = (...args: any[]) => void;
export type AsyncListener = (...args: any[]) => Promise<void>;