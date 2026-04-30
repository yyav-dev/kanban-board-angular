export type Priority = 'high' | 'medium' | 'low';
export type ColumnId = 'todo' | 'inprogress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  column: ColumnId;
  order: number;
  createdAt: number;
}

export interface Column {
  id: ColumnId;
  label: string;
  dot: string;
  countBg: string;
  countColor: string;
}

export const COLUMNS: Column[] = [
  { id: 'todo',       label: 'Todo',        dot: '#378ADD', countBg: '#E6F1FB', countColor: '#0C447C' },
  { id: 'inprogress', label: 'In Progress', dot: '#EF9F27', countBg: '#FAEEDA', countColor: '#633806' },
  { id: 'done',       label: 'Done',        dot: '#639922', countBg: '#EAF3DE', countColor: '#173404' },
];
