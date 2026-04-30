import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Task, Column, ColumnId, Priority, COLUMNS } from './models/task.model';
import { KanbanService } from './services/kanban.service';
import { ModalConfig } from './components/task-modal/task-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  readonly columns: Column[] = COLUMNS;

  tasks$!: Observable<Task[]>;
  filter$!: Observable<Priority | 'all'>;
  toast$!: Observable<string>;

  modalConfig: ModalConfig | null = null;

  constructor(public kanban: KanbanService) {}

  async ngOnInit(): Promise<void> {
    this.tasks$  = this.kanban.tasks$;
    this.filter$ = this.kanban.filter$;
    this.toast$  = this.kanban.toast$;
    await this.kanban.load();
  }

  tasksForCol(tasks: Task[], colId: ColumnId): Task[] {
    return this.kanban.tasksForColumn(colId);
  }

  countForCol(colId: ColumnId): number {
    return this.kanban.countForColumn(colId);
  }

  setFilter(f: Priority | 'all'): void { this.kanban.setFilter(f); }

  openAdd(colId: ColumnId): void {
    this.modalConfig = { mode: 'add', column: colId };
  }

  openEdit(task: Task): void {
    this.modalConfig = { mode: 'edit', task };
  }

  closeModal(): void { this.modalConfig = null; }

  async undo(): Promise<void> { await this.kanban.undo(); }

  canUndo(): boolean { return this.kanban.canUndo(); }
}
