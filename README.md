# 📋 Kanban Board — Angular 17

A fully featured **Kanban Task Management Board** built with Angular 17, NgModule architecture, manual HTML5 drag-and-drop, IndexedDB persistence, and RxJS BehaviorSubject state management.

![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-Styles-CC6699?style=flat-square&logo=sass&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---
[🌐 Live Demo](https://https://kanban-board-ky.netlify.app/) &nbsp;•&nbsp;

## ✨ Features

- **3-column Kanban board** — Todo · In Progress · Done
- **Add / Edit / Delete tasks** with title, description, and priority
- **Drag & Drop** between columns — built with native HTML5 API (no libraries)
- **Priority colour-coding** — 🔴 High · 🟡 Medium · 🟢 Low
- **Filter by priority** across all columns
- **Undo last action** — 30-level deep history stack
- **IndexedDB persistence** — survives page refresh; falls back to localStorage
- **Duplicate title detection** — validated on save
- **Toast notifications** — feedback on every action
- **Responsive layout** — collapses to single column on mobile
- **Dark mode** — automatic via `prefers-color-scheme`

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18.13+ or 20+ |
| npm | 9+ |
| Angular CLI | 17.x |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yyav-dev/kanban-board-angular.git
cd kanban-board-angular

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

Open your browser at **http://localhost:4200**

---

## 🛠️ Setup From Scratch (Angular CLI)

If you want to recreate this project step by step:

```bash
# Install Angular CLI globally
npm install -g @angular/cli@17

# Scaffold the project
ng new kanban-board-angular \
  --routing=false \
  --style=scss \
  --standalone=false \
  --skip-tests \
  --skip-git

cd kanban-board-angular

# Generate services
ng generate service services/persistence
ng generate service services/kanban

# Generate components
ng generate component components/task-card   --skip-tests
ng generate component components/board-column --skip-tests
ng generate component components/task-modal   --skip-tests

# Create models folder
mkdir -p src/app/models
```

---

## 📁 Project Structure

```
kanban-board-angular/
├── src/
│   ├── app/
│   │   ├── models/
│   │   │   └── task.model.ts              # Task, Column interfaces + COLUMNS constant
│   │   ├── services/
│   │   │   ├── persistence.service.ts     # IndexedDB CRUD + localStorage fallback
│   │   │   └── kanban.service.ts          # BehaviorSubject state + undo stack
│   │   ├── components/
│   │   │   ├── task-card/                 # Draggable task card
│   │   │   │   ├── task-card.component.ts
│   │   │   │   ├── task-card.component.html
│   │   │   │   └── task-card.component.scss
│   │   │   ├── board-column/              # Drop-zone column
│   │   │   │   ├── board-column.component.ts
│   │   │   │   ├── board-column.component.html
│   │   │   │   └── board-column.component.scss
│   │   │   └── task-modal/                # Add / Edit modal
│   │   │       ├── task-modal.component.ts
│   │   │       ├── task-modal.component.html
│   │   │       └── task-modal.component.scss
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   └── app.module.ts                  # NgModule — declares all components
│   ├── styles.scss                        # Global CSS variables + dark mode
│   └── index.html
├── angular.json
├── tsconfig.json
└── package.json
```

---

## 🏗️ Architecture & Design Decisions

### State Management

`KanbanService` owns a single **`BehaviorSubject<Task[]>`** as the source of truth. All components observe via the `async` pipe — no manual subscriptions, no memory leaks.

```
BehaviorSubject<Task[]>
        │
        ├── tasks$        →  board renders via async pipe
        ├── filter$       →  column filtering (all / high / medium / low)
        └── toast$        →  notification feedback
```

Every mutation follows this pattern:

```
snapshot() → commit(.next()) → persist(IndexedDB)
```

### Drag & Drop

Implemented with the **native HTML5 Drag and Drop API** — zero third-party libraries.

| Event | Component | Purpose |
|-------|-----------|---------|
| `dragstart` | `TaskCardComponent` | Stores dragging task ref on service |
| `dragover` | `BoardColumnComponent` + `TaskCardComponent` | Highlights column, tracks insert index |
| `dragleave` | `BoardColumnComponent` | Clears drop highlight |
| `drop` | `BoardColumnComponent` | Calls `kanban.dropTask(colId, insertIdx)` |
| `dragend` | `TaskCardComponent` | Cleans up all drag state on cancel |

### Persistence

```
Primary  →  IndexedDB  (raw IDBObjectStore — no wrapper library)
Fallback →  localStorage  (automatic on any IDB error)
```

Single-task writes use `put()`. Column reorders use `putMany()` in one atomic transaction.

### Undo Stack

```ts
// Before every destructive action:
snapshot()  →  history.push(JSON.parse(JSON.stringify(tasks)))

// On undo:
history.pop()  →  commit(prev)  →  db.putMany(prev)
```

History is capped at **30 entries** to keep memory bounded.

---

## 🧩 Key Files Explained

### `task.model.ts`
Defines all shared types used across the app:
```ts
export type Priority = 'high' | 'medium' | 'low';
export type ColumnId  = 'todo' | 'inprogress' | 'done';

export interface Task {
  id: string;  title: string;  description: string;
  priority: Priority;  column: ColumnId;
  order: number;  createdAt: number;
}
```

### `app.module.ts`
NgModule — declares all four components and imports `FormsModule` (required for `ngModel` in the modal):
```ts
@NgModule({
  declarations: [AppComponent, BoardColumnComponent, TaskCardComponent, TaskModalComponent],
  imports: [BrowserModule, FormsModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### `kanban.service.ts`
Central state manager. Key public API:
```ts
tasks$   // Observable<Task[]>
filter$  // Observable<Priority | 'all'>
toast$   // Observable<string>

addTask(title, description, priority, column)
updateTask(id, title, description, priority)
deleteTask(id)
dropTask(targetCol, insertIdx)   // drag & drop
undo()
setFilter(f)
isDuplicate(title, excludeId?)
```

---

## ⚠️ Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| Empty task title | Validation error shown — save blocked |
| Duplicate task title | Detected across all columns — save blocked |
| Drag outside the board | `dragend` fires and resets all drag state safely |
| Drop onto same column, no reorder | No-op guard in `dropTask()` |
| Rapid drag/drop | Snapshot taken before each mutation — state stays consistent |
| IndexedDB unavailable | Automatic silent fallback to `localStorage` |

---

## 🖥️ Available Scripts

```bash
npm start          # Dev server → http://localhost:4200
npm run build      # Production build → dist/kanban-board-angular/
npm test           # Karma unit tests
npm run watch      # Build in watch mode
```

---

## 🗂️ Local Storage / IndexedDB

Data is stored under the key `kanban_tasks` in **IndexedDB** (database: `KanbanDB`).

To inspect in Chrome:

```
DevTools (F12) → Application → IndexedDB → KanbanDB → tasks
```

To clear all data via the browser console:

```js
indexedDB.deleteDatabase('KanbanDB');
localStorage.removeItem('kanban_tasks');
```

---

## 🔧 Troubleshooting

```
Error: Can't bind to 'ngModel' since it isn't a known property
→ Ensure FormsModule is listed in app.module.ts imports[]

Error: 'app-task-card' is not a known element
→ Ensure component is listed in app.module.ts declarations[]

Error: Cannot find module '../models/task.model'
→ Confirm file exists at src/app/models/task.model.ts

Error: NG0100 ExpressionChangedAfterItHasBeenChecked
→ Use the async pipe in templates instead of manual subscribe()
```

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | 17.x | Framework |
| `@angular/common` | 17.x | CommonModule, AsyncPipe |
| `@angular/forms` | 17.x | FormsModule / ngModel |
| `rxjs` | 7.x | BehaviorSubject, Observable |

> No drag-drop libraries. No UI component libraries. No extra state management packages.

---

## 🆚 Angular 17 vs Angular 18

This project uses **Angular 17 (NgModule architecture)**. Key differences from the Angular 18 standalone version:

| Feature | Angular 17 (this project) | Angular 18 |
|---------|--------------------------|------------|
| Component style | NgModule + declarations | `standalone: true` |
| Inputs | `@Input() task!: Task` | `task = input.required<Task>()` |
| Outputs | `@Output() e = new EventEmitter()` | `e = output<Task>()` |
| Template directives | `*ngIf` / `*ngFor` | `@if` / `@for` |
| Reactive state | `BehaviorSubject` + `async` pipe | `signal()` + `computed()` |
| Form reset | `ngOnChanges()` | `effect()` |

---

## 📄 License
## Author
** [Karthicyadhav](https://github.com/yyav-dev) **
MIT © 2024 — free to use, modify, and distribute.

