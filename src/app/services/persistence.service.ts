import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';

const DB_NAME = 'KanbanDB';
const DB_VERSION = 1;
const STORE = 'tasks';

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private db: IDBDatabase | null = null;

  /** Opens (or creates) the IndexedDB database. */
  openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** Load all tasks from IndexedDB. Falls back to localStorage. */
  async getAll(): Promise<Task[]> {
    try {
      if (!this.db) await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result as Task[]);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.loadFromLocalStorage();
    }
  }

  /** Upsert a single task. */
  async put(task: Task): Promise<void> {
    try {
      if (!this.db) await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(task);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      this.saveToLocalStorage();
    }
  }

  /** Upsert multiple tasks in one transaction. */
  async putMany(tasks: Task[]): Promise<void> {
    try {
      if (!this.db) await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        tasks.forEach(t => store.put(t));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      this.saveToLocalStorage();
    }
  }

  /** Delete a task by id. */
  async delete(id: string): Promise<void> {
    try {
      if (!this.db) await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = this.db!.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      this.saveToLocalStorage();
    }
  }

  // ── localStorage fallback ──────────────────────────────────────────────────

  private _fallbackTasks: Task[] = [];

  setFallback(tasks: Task[]) { this._fallbackTasks = tasks; }

  private loadFromLocalStorage(): Task[] {
    try {
      const raw = localStorage.getItem('kanban_tasks');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('kanban_tasks', JSON.stringify(this._fallbackTasks));
  }
}
