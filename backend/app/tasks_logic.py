"""
tasks_logic.py — All logic functions for the Task Manager assignment.
Implements Q2–Q7, Q9 (Q1 and Q8 are handled in main.py).
"""

from datetime import datetime, date, timedelta
from collections import defaultdict
from sqlalchemy.orm import Session
from fuzzywuzzy import fuzz
import threading
import time

from app.models import Task


# ──────────────────────────────────────────────
# Q2: Group tasks by parent_id, sorted by created_at DESC
# ──────────────────────────────────────────────
def group_tasks_by_parent(tasks: list[Task]) -> dict:
    """
    Returns a dict where keys are parent_id (None = root tasks)
    and values are lists of tasks sorted by created_at descending.
    """
    grouped = defaultdict(list)
    for task in tasks:
        grouped[task.parent_id].append(task)

    # Sort each group by created_at descending
    for key in grouped:
        grouped[key].sort(key=lambda t: t.created_at or datetime.min, reverse=True)

    return dict(grouped)


# ──────────────────────────────────────────────
# Q3: Tasks due today or tomorrow with priority == 1
# ──────────────────────────────────────────────
def get_urgent_tasks(tasks: list[Task]) -> list[Task]:
    """Returns tasks due today or tomorrow with priority == 1."""
    today = date.today()
    tomorrow = today + timedelta(days=1)
    result = []
    for task in tasks:
        if task.priority == 1 and task.due_date is not None:
            task_date = task.due_date.date() if isinstance(task.due_date, datetime) else task.due_date
            if task_date in (today, tomorrow):
                result.append(task)
    return result


# ──────────────────────────────────────────────
# Q4: Parent tasks with no children
# ──────────────────────────────────────────────
def get_childless_parent_tasks(tasks: list[Task]) -> list[Task]:
    """Returns tasks that have a parent_id of None (root tasks) AND have no children."""
    child_parent_ids = {t.parent_id for t in tasks if t.parent_id is not None}
    return [t for t in tasks if t.parent_id is None and t.id not in child_parent_ids]


# ──────────────────────────────────────────────
# Q5: Count siblings of a task (tasks sharing same parent_id)
# ──────────────────────────────────────────────
def count_siblings(tasks: list[Task], task_id: int) -> int:
    """
    Returns the number of sibling tasks (tasks that share the same parent_id),
    NOT counting the task itself.
    """
    target = next((t for t in tasks if t.id == task_id), None)
    if target is None:
        return 0
    # Tasks with same parent_id, excluding itself
    siblings = [t for t in tasks if t.parent_id == target.parent_id and t.id != task_id]
    return len(siblings)


# ──────────────────────────────────────────────
# Q6: Fuzzy search on task names
# ──────────────────────────────────────────────
def fuzzy_search_tasks(tasks: list[Task], query: str, threshold: int = 60) -> list[Task]:
    """
    Returns tasks whose names are similar to the query string.
    Uses fuzzywuzzy token_sort_ratio; threshold is 0–100.
    """
    results = []
    for task in tasks:
        score = fuzz.token_sort_ratio(query.lower(), task.name.lower())
        if score >= threshold:
            results.append((score, task))
    results.sort(key=lambda x: x[0], reverse=True)
    return [task for _, task in results]


# ──────────────────────────────────────────────
# Q7: Given two task IDs, determine subtask relationship
# ──────────────────────────────────────────────
def find_subtask_relationship(tasks: list[Task], task_id_a: int, task_id_b: int) -> str:
    """
    Determines if task A is a subtask of B, B is a subtask of A, or NONE.
    Returns: "A_IS_SUBTASK_OF_B", "B_IS_SUBTASK_OF_A", or "NONE"
    """
    # Build parent lookup: id -> parent_id
    parent_map = {t.id: t.parent_id for t in tasks}

    def is_ancestor(ancestor_id: int, descendant_id: int) -> bool:
        """Returns True if ancestor_id is an ancestor of descendant_id."""
        current = parent_map.get(descendant_id)
        visited = set()
        while current is not None:
            if current in visited:
                break  # Cycle protection
            visited.add(current)
            if current == ancestor_id:
                return True
            current = parent_map.get(current)
        return False

    if is_ancestor(task_id_a, task_id_b):
        return "B_IS_SUBTASK_OF_A"
    elif is_ancestor(task_id_b, task_id_a):
        return "A_IS_SUBTASK_OF_B"
    else:
        return "NONE"


# ──────────────────────────────────────────────
# Q9: Async task execution simulation with worker threads
# ──────────────────────────────────────────────
def simulate_task_execution(tasks: list[Task], worker_threads: int) -> dict:
    """
    Simulates executing tasks asynchronously using a thread pool.
    Each task takes duration/10 seconds.
    Returns a dict with execution log and total time.
    """
    results = []
    results_lock = threading.Lock()
    semaphore = threading.Semaphore(worker_threads)

    def execute_task(task):
        semaphore.acquire()
        start = time.time()
        sleep_time = (task.duration or 10) / 10
        time.sleep(sleep_time)
        end = time.time()
        with results_lock:
            results.append({
                "task_id": task.id,
                "task_name": task.name,
                "duration_seconds": round(end - start, 2),
                "status": "completed"
            })
        semaphore.release()

    threads = []
    overall_start = time.time()

    for task in tasks:
        t = threading.Thread(target=execute_task, args=(task,))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    total_time = round(time.time() - overall_start, 2)

    return {
        "worker_threads": worker_threads,
        "tasks_executed": len(results),
        "total_time_seconds": total_time,
        "execution_log": results
    }
