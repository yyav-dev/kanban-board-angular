import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task, ColumnId, Priority } from '../models/task.model';
import { PersistenceService } from './persistence.service';

@Injectable({ providedIn: 'root' })
export class KanbanService {
  // ── State ────────────────────────────────────────────────────────────────
  private _tasks$ = new BehaviorSubject<Task[]>([]);
  tasks$ = this._tasks$.asObservable();

  private _filter$ = new BehaviorSubject<Priority | 'all'>('all');
  filter$ = this._filter$.asObservable();

  private _toast$ = new BehaviorSubject<string>('');
  toast$ = this._toast$.asObservable();

  /** Drag state shared across components */
  draggingTask: Task | null = null;
  dragOverCol: ColumnId | null = null;
  dragOverIdx: number | null = null;

  /** Undo history — deep copies of tasks array (max 30) */
  private history: Task[][] = [];

  private toastTimer: any;
  private idCounter = Date.now();

  constructor(private db: PersistenceService) {}

  // ── Init ──────────────────────────────────────────────────────────────────
  async load(): Promise<void> {
    const tasks = await this.db.getAll();
    const sorted = tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this._tasks$.next(sorted);
    this.db.setFallback(sorted);
  }

  // ── Selectors ─────────────────────────────────────────────────────────────
  get tasks(): Task[] { return this._tasks$.getValue(); }
  get filter(): Priority | 'all' { return this._filter$.getValue(); }

  tasksForColumn(colId: ColumnId): Task[] {
    const all = this.tasks.filter(t => t.column === colId);
    const f = this.filter;
    const filtered = f === 'all' ? all : all.filter(t => t.priority === f);
    return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  countForColumn(colId: ColumnId): number {
    return this.tasks.filter(t => t.column === colId).length;
  }

  canUndo(): boolean { return this.history.length > 0; }

  // ── Mutations ─────────────────────────────────────────────────────────────
  setFilter(f: Priority | 'all'): void { this._filter$.next(f); }

  async addTask(title: string, description: string, priority: Priority, column: ColumnId): Promise<void> {
    this.snapshot();
    const colTasks = this.tasks.filter(t => t.column === column);
    const maxOrder = colTasks.length ? Math.max(...colTasks.map(t => t.order ?? 0)) : 0;
    const task: Task = {
      id: 'task_' + (this.idCounter++),
      title: title.trim(),
      description,
      priority,
      column,
      order: maxOrder + 1,
      createdAt: Date.now(),
    };
    const next = [...this.tasks, task];
    this.commit(next);
    await this.db.put(task);
    this.toast('Task added');
  }

  async updateTask(id: string, title: string, description: string, priority: Priority): Promise<void> {
    this.snapshot();
    const next = this.tasks.map(t =>
      t.id === id ? { ...t, title: title.trim(), description, priority } : t
    );
    this.commit(next);
    const updated = next.find(t => t.id === id)!;
    await this.db.put(updated);
    this.toast('Task updated');
  }

  async deleteTask(id: string): Promise<void> {
    this.snapshot();
    const next = this.tasks.filter(t => t.id !== id);
    this.commit(next);
    await this.db.delete(id);
    this.toast('Task deleted');
  }

  /**
   * Move dragging task to a column, inserting at a specific index.
   * Recalculates `order` for the whole column to stay consistent.
   */
  async dropTask(targetCol: ColumnId, insertIdx: number | null): Promise<void> {
    if (!this.draggingTask) return;
    const task = this.tasks.find(t => t.id === this.draggingTask!.id);
    if (!task) return;

    // No-op: same column, no explicit reorder target
    if (task.column === targetCol && insertIdx === null) return;

    this.snapshot();

    // Mutate column and rebuild order
    const updated: Task = { ...task, column: targetCol };
    let colList = this.tasks
      .filter(t => t.column === targetCol && t.id !== task.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (insertIdx !== null && insertIdx >= 0) {
      colList.splice(insertIdx, 0, updated);
    } else {
      colList.push(updated);
    }

    colList = colList.map((t, i) => ({ ...t, order: i + 1 }));

    const next = this.tasks
      .filter(t => t.column !== targetCol || t.id === task.id)
      .map(t => (t.column === targetCol ? undefined : t))
      .filter((t): t is Task => !!t)
      .concat(colList);

    // Rebuild full list replacing affected column
    const allOther = this.tasks.filter(t => t.column !== targetCol);
    this.commit([...allOther, ...colList]);

    await this.db.putMany(colList);
    this.toast('Task moved');
  }

  async undo(): Promise<void> {
    if (!this.history.length) return;
    const prev = this.history.pop()!;
    this.commit(prev);
    await this.db.putMany(prev);
    this.toast('Action undone');
  }

  // ── Validation helpers ────────────────────────────────────────────────────
  isDuplicate(title: string, excludeId?: string): boolean {
    return this.tasks.some(t =>
      t.title.trim().toLowerCase() === title.trim().toLowerCase() &&
      t.id !== excludeId
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private snapshot(): void {
    this.history.push(JSON.parse(JSON.stringify(this.tasks)));
    if (this.history.length > 30) this.history.shift();
  }

  private commit(tasks: Task[]): void {
    this._tasks$.next(tasks);
    this.db.setFallback(tasks);
  }

  private toast(msg: string): void {
    this._toast$.next(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this._toast$.next(''), 2400);
  }
}
