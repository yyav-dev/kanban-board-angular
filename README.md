# Kanban Board — Angular

A feature-complete Kanban board built with **Angular**, manual HTML5 drag-and-drop, IndexedDB persistence, and full state management via RxJS `BehaviorSubject`.

---

## 🚀 Quick Start

```bash
# Install Angular CLI (if not installed)
npm install -g @angular/cli

# Install dependencies
npm install

# Run the app
npm start

# Open in browser
http://localhost:4200
```

> Requires Node.js >= 18 and npm >= 9

---

## 📁 Project Structure

```
src/app/
├── models/
│   └── task.model.ts
├── services/
│   ├── persistence.service.ts
│   └── kanban.service.ts
└── components/
    ├── task-card/
    ├── board-column/
    └── task-modal/
```

---

## 🧠 Architecture

### State Management

* Single source of truth using:

```ts
BehaviorSubject<Task[]>
```

* All updates go through service methods:

  * Add
  * Edit
  * Delete
  * Move

* Uses immutable updates + `.next()`

* Components use:

```html
async pipe
```

➡ No manual subscriptions
➡ No memory leaks

---

### 🎯 Drag & Drop (No Library)

Native HTML5 API:

```
dragstart → store task
dragover  → track position
drop      → update state
dragend   → cleanup
```

---

### 💾 Persistence

* Primary: **IndexedDB**
* Fallback: **localStorage**

Handled via `PersistenceService`

---

### 🔄 Undo Feature

* Stores up to **30 states**
* Each action snapshots previous state

---

## ⚠️ Edge Cases

* Empty title → blocked
* Duplicate title → blocked
* Outside drop → safely reset
* Rapid drag → handled via snapshots

---

## ✨ Features

* Priority badges (High / Medium / Low)
* Filter by priority
* Undo last action
* Responsive layout

---

## 📜 Scripts

| Command       | Description          |
| ------------- | -------------------- |
| npm install   | Install dependencies |
| npm start     | Start dev server     |
| ng serve      | Alternative start    |
| npm run build | Production build     |
| npm test      | Run tests            |

---

## 🛠 Tech Stack

* Angular 17
* TypeScript
* RxJS
* IndexedDB
* HTML5 Drag & Drop

---