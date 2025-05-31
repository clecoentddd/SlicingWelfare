import { StoredEvent } from "./genericTypes";
import { useState, useEffect } from "react";

type Callback = () => void;

export class DBEventList {
  private events: StoredEvent[] = [];
  private listeners: Set<Callback> = new Set();

  append(eventOrEvents: StoredEvent | StoredEvent[]) {
    if (Array.isArray(eventOrEvents)) {
      this.events.push(...eventOrEvents);
    } else {
      this.events.push(eventOrEvents);
    }
    this.emit();
  }

  list(): StoredEvent[] {
    return [...this.events];
  }

  clear() {
    this.events = [];
    this.emit();
  }

  subscribe(callback: Callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit() {
    this.listeners.forEach(cb => cb());
  }
}

export const DBEvents = new DBEventList();

export function useDB<T>(db: { list: () => T[]; subscribe: (cb: () => void) => () => void }): T[] {
  const [data, setData] = useState<T[]>(db.list());

  useEffect(() => {
    const update = () => setData(db.list());
    const unsubscribe = db.subscribe(update);
    return unsubscribe;
  }, [db]);

  return data;
}
