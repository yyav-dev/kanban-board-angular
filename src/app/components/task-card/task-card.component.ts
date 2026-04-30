import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { Task } from '../../models/task.model';
import { KanbanService } from '../../services/kanban.service';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() index!: number;
  @Output() editRequest = new EventEmitter<Task>();

  constructor(private kanban: KanbanService) {}

  onDragStart(e: DragEvent): void {
    this.kanban.draggingTask = this.task;
    e.dataTransfer!.effectAllowed = 'move';
    // Small delay so browser captures ghost before opacity changes
    setTimeout(() => (e.target as HTMLElement).classList.add('dragging'), 0);
  }

  onDragEnd(e: DragEvent): void {
    (e.target as HTMLElement).classList.remove('dragging');
    this.kanban.draggingTask = null;
    this.kanban.dragOverCol = null;
    this.kanban.dragOverIdx = null;
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.kanban.dragOverIdx = this.index;
  }

  async onDelete(): Promise<void> {
    await this.kanban.deleteTask(this.task.id);
  }

  onEdit(): void {
    this.editRequest.emit(this.task);
  }
}
