# 📋 Personal Task Manager — Full Stack Submission

A full-stack task management application built as the Storewise internship assignment.
**Frontend**: React + Vite · **Backend**: FastAPI (Python) + SQLite

---

## 🗂 Project Structure

```
taskmanager/
├── frontend/          # React + Vite app (Assignment 1)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── components/
│   │       ├── TaskCard.jsx
│   │       ├── TaskModal.jsx
│   │       └── CreateTaskModal.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── backend/           # FastAPI app (Assignment 2)
    ├── app/
    │   ├── main.py
    │   ├── models.py
    │   ├── database.py
    │   └── tasks_logic.py
    └── requirements.txt
```

---

## 🚀 Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
cd app
uvicorn main:app --reload
```

API runs at: **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

App runs at: **http://localhost:5173**

> The frontend proxies API calls to `localhost:8000` via Vite's proxy config.
> It also works **offline** — falls back to localStorage if the backend is unreachable.

---

## ✅ Frontend — All Tasks Completed

### Level 1

| # | Task | Status |
|---|------|--------|
| 1.1 | Card grid layout (miniature cards in columns) | ✅ |
| 1.2 | Update Task (edit existing content) | ✅ |
| 1.3 | Delete Task (removed from board + persistence) | ✅ |
| 2 | View/Edit Task Details in modal effect | ✅ |
| 3 | Task Status Management (Pending / In Progress / Complete) | ✅ |
| 4 | Task Persistence (localStorage, survives page refresh) | ✅ |
| 5 | Bug Fix: rapid "Add Task" count mismatch → functional update used | ✅ |
| 6 | Dynamic Header with current date from `/date` API | ✅ |
| 7.1 | Hover states on all interactive elements | ✅ |
| 7.2 | Responsive design (grid auto-fill) | ✅ |
| 7.3 | Extra UI: status filter, search, stats bar, priority labels | ✅ |

### Level 2

| # | Task | Status |
|---|------|--------|
| 1 | Task name input at creation time | ✅ |
| 2 | TaskCard has NO internal state (no useState/useReducer) | ✅ |
| 3 | Clone Task button with dropdown of all tasks | ✅ |

---

## ✅ Backend — All Questions Implemented

| Q | Description | Endpoint | File |
|---|-------------|----------|------|
| 1 | CRUD: Get all, Create, Delete | `GET/POST /tasks`, `DELETE /tasks/{id}` | `main.py` |
| 2 | Group tasks by parent_id, sorted by created_at DESC | `GET /tasks/grouped/by-parent` | `tasks_logic.py` |
| 3 | Tasks due today/tomorrow with priority=1 | `GET /tasks/filter/urgent` | `tasks_logic.py` |
| 4 | Parent tasks with no children | `GET /tasks/filter/childless-parents` | `tasks_logic.py` |
| 5 | Count siblings of a task | `GET /tasks/{id}/siblings/count` | `tasks_logic.py` |
| 6 | Fuzzy search on task names (fuzzywuzzy) | `GET /tasks/search/fuzzy?query=...` | `tasks_logic.py` |
| 7 | Subtask relationship between two tasks | `GET /tasks/relationship/subtask?task_id_a=&task_id_b=` | `tasks_logic.py` |
| 8 | Raw SQL: tasks Aug 26–Sep 9 2024, exclude completed/Sundays | `GET /tasks/filter/sql-advanced` | `main.py` |
| 9 | Async task execution simulation with thread pool | `POST /tasks/simulate/execute?worker_threads=3` | `tasks_logic.py` |

---

## 🔑 Key Design Decisions

- **Bug Fix (Q5)**: The rapid-click bug was caused by stale closure over `tasks` state. Fixed using functional state updates: `setTasks(prev => [...prev, newTask])` which always operates on the latest state.
- **TaskCard stateless (Level 2 Q2)**: TaskCard receives all data as props and uses zero hooks internally. Status changes are bubbled up via `onStatusChange` callback.
- **Persistence**: Tasks are synced to the backend on every mutation. A localStorage cache ensures the UI remains functional even when the backend is offline.
- **CORS**: Backend is configured to accept requests from any origin during development.
