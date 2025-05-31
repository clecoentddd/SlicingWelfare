// src/slices/shared/useDB.ts
"use client";

import { useState, useEffect } from "react";
import { openDB } from 'idb';
import { StoredEvent } from "./genericTypes";
import { openEventDB } from "./openEventDB";

async function getAllEvents() {
    const db = await openEventDB(); 

  return await db.getAll('events');
}

export function useDB<T extends StoredEvent>(): T[] {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const events = await getAllEvents();
        setData(events as T[]);
      } catch (error) {
        console.error("Failed to fetch data from IndexedDB:", error);
      }
    };

    fetchData();
  }, []);

  return data;
}
