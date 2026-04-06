"""
main.py — FastAPI Task Manager Backend
Implements all assignment API endpoints (Q1–Q9).
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import engine, get_db
from app.models import Base, Task
from app.tasks_logic import (
    group_tasks_by_parent,
    get_urgent_tasks,
    get_childless_parent_tasks,
    count_siblings,
    fuzzy_search_tasks,
    find_subtask_relationship,
    simulate_task_execution,
)

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API", version="1.0.0")

# CORS — allow frontend on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────

class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    due_date: Optional[datetime] = None
    priority: Optional[int] = 5
    status: Optional[str] = "Pending"
    parent_id: Optional[int] = None
    duration: Optional[int] = 60

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    parent_id: Optional[int] = None
    duration: Optional[int] = None


# ─────────────────────────────────────────────
# Q1: Basic CRUD
# ─────────────────────────────────────────────

@app.get("/tasks", summary="Get all tasks")
def get_all_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return tasks


@app.post("/tasks", summary="Create a task")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.get("/tasks/{task_id}", summary="Get a single task")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.put("/tasks/{task_id}", summary="Update a task")
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@app.delete("/tasks/{task_id}", summary="Delete a task")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": f"Task {task_id} deleted successfully"}


# ─────────────────────────────────────────────
# Q2: Group by parent_id, sorted by created_at DESC
# ─────────────────────────────────────────────

@app.get("/tasks/grouped/by-parent", summary="Q2: Tasks grouped by parent_id")
def tasks_grouped_by_parent(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    grouped = group_tasks_by_parent(tasks)
    # Convert keys to strings for JSON serialization (None -> "null")
    return {str(k): v for k, v in grouped.items()}


# ─────────────────────────────────────────────
# Q3: Urgent tasks (due today/tomorrow, priority=1)
# ─────────────────────────────────────────────

@app.get("/tasks/filter/urgent", summary="Q3: Tasks due today/tomorrow with priority 1")
def urgent_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return get_urgent_tasks(tasks)


# ─────────────────────────────────────────────
# Q4: Parent tasks with no children
# ─────────────────────────────────────────────

@app.get("/tasks/filter/childless-parents", summary="Q4: Root tasks with no children")
def childless_parents(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return get_childless_parent_tasks(tasks)


# ─────────────────────────────────────────────
# Q5: Count siblings of a task
# ─────────────────────────────────────────────

@app.get("/tasks/{task_id}/siblings/count", summary="Q5: Count task siblings")
def task_sibling_count(task_id: int, db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    sibling_count = count_siblings(tasks, task_id)
    return {"task_id": task_id, "sibling_count": sibling_count}


# ─────────────────────────────────────────────
# Q6: Fuzzy search
# ─────────────────────────────────────────────

@app.get("/tasks/search/fuzzy", summary="Q6: Fuzzy search tasks by name")
def fuzzy_search(query: str, threshold: int = 60, db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    results = fuzzy_search_tasks(tasks, query, threshold)
    return results


# ─────────────────────────────────────────────
# Q7: Subtask relationship between two tasks
# ─────────────────────────────────────────────

@app.get("/tasks/relationship/subtask", summary="Q7: Check subtask relationship")
def subtask_relationship(task_id_a: int, task_id_b: int, db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    result = find_subtask_relationship(tasks, task_id_a, task_id_b)
    return {"task_id_a": task_id_a, "task_id_b": task_id_b, "relationship": result}


# ─────────────────────────────────────────────
# Q8: Raw SQL query — tasks between Aug 26–Sep 9 2024,
#     optional exclude completed, optional exclude Sundays
# ─────────────────────────────────────────────

@app.get("/tasks/filter/sql-advanced", summary="Q8: SQL filtered tasks")
def sql_filtered_tasks(
    exclude_completed: bool = True,
    exclude_sundays: bool = True,
    db: Session = Depends(get_db),
):
    base_sql = """
        SELECT *
        FROM tasks
        WHERE created_at BETWEEN '2024-08-26' AND '2024-09-09'
    """
    if exclude_completed:
        base_sql += " AND status != 'Complete'"
    if exclude_sundays:
        # SQLite: strftime('%w', ...) returns '0' for Sunday
        base_sql += " AND strftime('%w', created_at) != '0'"

    result = db.execute(text(base_sql))
    columns = result.keys()
    rows = [dict(zip(columns, row)) for row in result.fetchall()]
    return rows


# ─────────────────────────────────────────────
# Q9: Simulate async task execution
# ─────────────────────────────────────────────

@app.post("/tasks/simulate/execute", summary="Q9: Simulate async task execution")
def simulate_execution(worker_threads: int = 3, db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    if not tasks:
        raise HTTPException(status_code=404, detail="No tasks found to simulate")
    result = simulate_task_execution(tasks, worker_threads)
    return result


# ─────────────────────────────────────────────
# Date endpoint (used by frontend header)
# ─────────────────────────────────────────────

@app.get("/date", summary="Get current date")
def get_current_date():
    return {"date": datetime.now().strftime("%A, %B %d, %Y")}
