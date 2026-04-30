import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges
} from '@angular/core';
import { Task, ColumnId, Priority } from '../../models/task.model';
import { KanbanService } from '../../services/kanban.service';

export interface ModalConfig {
  mode: 'add' | 'edit';
  column?: ColumnId;
  task?: Task;
}

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss'],
})
export class TaskModalComponent implements OnChanges {
  @Input()  config: ModalConfig | null = null;
  @Output() close = new EventEmitter<void>();

  title       = '';
  description = '';
  priority: Priority = 'medium';

  titleError = '';

  constructor(private kanban: KanbanService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      if (this.config.mode === 'edit' && this.config.task) {
        const t = this.config.task;
        this.title       = t.title;
        this.description = t.description || '';
        this.priority    = t.priority;
      } else {
        this.title       = '';
        this.description = '';
        this.priority    = 'medium';
      }
      this.titleError = '';
    }
  }

  setPriority(p: Priority): void { this.priority = p; }

  async onSave(): Promise<void> {
    // Validate: non-empty title
    if (!this.title.trim()) {
      this.titleError = 'Title is required.';
      return;
    }

    // Validate: no duplicates
    const excludeId = this.config?.task?.id;
    if (this.kanban.isDuplicate(this.title, excludeId)) {
      this.titleError = 'A task with this title already exists.';
      return;
    }

    if (this.config?.mode === 'edit' && this.config.task) {
      await this.kanban.updateTask(
        this.config.task.id, this.title, this.description, this.priority
      );
    } else if (this.config?.column) {
      await this.kanban.addTask(
        this.title, this.description, this.priority, this.config.column
      );
    }

    this.close.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close.emit();
    if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLInputElement) this.onSave();
  }
}
