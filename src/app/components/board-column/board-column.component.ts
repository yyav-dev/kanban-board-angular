import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { Task, Column, ColumnId } from '../../models/task.model';
import { KanbanService } from '../../services/kanban.service';

@Component({
  selector: 'app-board-column',
  templateUrl: './board-column.component.html',
  styleUrls: ['./board-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardColumnComponent {
  @Input() column!: Column;
  @Input() tasks: Task[] = [];
  @Input() count = 0;
  @Output() addRequest  = new EventEmitter<ColumnId>();
  @Output() editRequest = new EventEmitter<Task>();

  constructor(private kanban: KanbanService) {}

  get isDragOver(): boolean {
    return this.kanban.dragOverCol === this.column.id;
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    this.kanban.dragOverCol = this.column.id;
  }

  onDragLeave(): void {
    // Only clear if leaving the column itself (not a child)
    this.kanban.dragOverCol = null;
  }

  async onDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    const idx = this.kanban.dragOverIdx;
    this.kanban.dragOverCol = null;
    this.kanban.dragOverIdx = null;
    await this.kanban.dropTask(this.column.id, idx);
  }

  onAddTask(): void { this.addRequest.emit(this.column.id); }
  onEditTask(task: Task): void { this.editRequest.emit(task); }

  trackById(_: number, task: Task): string { return task.id; }
}
