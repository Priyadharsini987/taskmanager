import { useState, useEffect, useCallback, useRef } from 'react'
import TaskCard from './components/TaskCard'
import TaskModal from './components/TaskModal'
import CreateTaskModal from './components/CreateTaskModal'

const API = 'http://localhost:8000'

const STATUS_COLORS = {
  'Pending': 'var(--pending)',
  'In Progress': 'var(--inprogress)',
  'Complete': 'var(--complete)',
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [currentDate, setCurrentDate] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCloneDropdown, setShowCloneDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const cloneRef = useRef(null)

  // Fetch tasks from backend (with localStorage fallback)
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tasks`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
        localStorage.setItem('tasks_cache', JSON.stringify(data))
      }
    } catch {
      // Backend offline — use localStorage persistence
      const cached = localStorage.getItem('tasks_cache')
      if (cached) setTasks(JSON.parse(cached))
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch current date from backend
  useEffect(() => {
    fetch(`${API}/date`)
      .then(r => r.json())
      .then(d => setCurrentDate(d.date))
      .catch(() => setCurrentDate(new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })))
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Close clone dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (cloneRef.current && !cloneRef.current.contains(e.target)) {
        setShowCloneDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Task CRUD ──────────────────────────────
  const createTask = async (taskData) => {
    try {
      const res = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      if (res.ok) {
        const newTask = await res.json()
        setTasks(prev => {
          const updated = [...prev, newTask]
          localStorage.setItem('tasks_cache', JSON.stringify(updated))
          return updated
        })
        return newTask
      }
    } catch {
      // Offline mode — local only
      const newTask = {
        id: Date.now(),
        ...taskData,
        created_at: new Date().toISOString(),
      }
      setTasks(prev => {
        const updated = [...prev, newTask]
        localStorage.setItem('tasks_cache', JSON.stringify(updated))
        return updated
      })
      return newTask
    }
  }

  const updateTask = async (id, updates) => {
    try {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const updated = await res.json()
        setTasks(prev => {
          const arr = prev.map(t => t.id === id ? updated : t)
          localStorage.setItem('tasks_cache', JSON.stringify(arr))
          return arr
        })
        if (selectedTask?.id === id) setSelectedTask(updated)
        return updated
      }
    } catch {
      setTasks(prev => {
        const arr = prev.map(t => t.id === id ? { ...t, ...updates } : t)
        localStorage.setItem('tasks_cache', JSON.stringify(arr))
        return arr
      })
    }
  }

  const deleteTask = async (id) => {
    try {
      await fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
    } catch {}
    setTasks(prev => {
      const arr = prev.filter(t => t.id !== id)
      localStorage.setItem('tasks_cache', JSON.stringify(arr))
      return arr
    })
    if (selectedTask?.id === id) setSelectedTask(null)
  }

  // ── Clone Task (Level 2 Q3) ────────────────
  const cloneTask = async (sourceTask) => {
    const cloned = {
      name: `${sourceTask.name} (Copy)`,
      description: sourceTask.description,
      due_date: sourceTask.due_date,
      priority: sourceTask.priority,
      status: sourceTask.status,
      parent_id: sourceTask.parent_id,
      duration: sourceTask.duration,
    }
    await createTask(cloned)
    setShowCloneDropdown(false)
  }

  // ── Filtered tasks ────────────────────────
  const filteredTasks = tasks.filter(t => {
    const matchStatus = filterStatus === 'All' || t.status === filterStatus
    const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne', fontWeight: 800, fontSize: 16
          }}>T</div>
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>TaskBoard</h1>
        </div>
        {currentDate && (
          <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 300 }}>
            {currentDate}
          </span>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Clone Task button (Level 2 Q3) */}
          <div ref={cloneRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowCloneDropdown(v => !v)} style={{
              background: 'var(--surface2)', border: '1.5px solid var(--border)',
              color: 'var(--text)', padding: '8px 16px', borderRadius: 8, fontSize: 13,
              fontWeight: 500,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              ⧉ Clone Task
            </button>
            {showCloneDropdown && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, minWidth: 220,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, overflow: 'hidden', zIndex: 200,
                boxShadow: 'var(--shadow)',
              }}>
                {tasks.length === 0
                  ? <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>No tasks to clone</div>
                  : tasks.map(t => (
                    <button key={t.id} onClick={() => cloneTask(t)} style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 16px', background: 'none', border: 'none',
                      color: 'var(--text)', fontSize: 13, borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >{t.name}</button>
                  ))
                }
              </div>
            )}
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{
            background: 'linear-gradient(135deg, var(--accent), #9b91f9)',
            border: 'none', color: '#fff', padding: '8px 18px',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            + Create Task
          </button>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div style={{
        display: 'flex', gap: 12, padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        overflowX: 'auto',
      }}>
        {[
          { label: 'Total', count: tasks.length, color: 'var(--accent)' },
          { label: 'Pending', count: statusCounts['Pending'] || 0, color: 'var(--pending)' },
          { label: 'In Progress', count: statusCounts['In Progress'] || 0, color: 'var(--inprogress)' },
          { label: 'Complete', count: statusCounts['Complete'] || 0, color: 'var(--complete)' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 18px', display: 'flex',
            alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: stat.color, display: 'inline-block',
            }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne', color: stat.color }}>
              {stat.count}
            </span>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{
        display: 'flex', gap: 10, padding: '16px 32px',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <input
          placeholder="🔍 Search tasks..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Pending', 'In Progress', 'Complete'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: filterStatus === s ? 'var(--accent)' : 'var(--surface2)',
              border: filterStatus === s ? 'none' : '1px solid var(--border)',
              color: filterStatus === s ? '#fff' : 'var(--text-muted)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* ── Task Grid ── */}
      <main style={{ padding: '0 32px 40px', flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            Loading tasks…
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              {tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match your filters.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => setSelectedTask(task)}
                onDelete={() => deleteTask(task.id)}
                onStatusChange={(status) => updateTask(task.id, { status })}
                allTasks={tasks}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateTaskModal
          allTasks={tasks}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            await createTask(data)
            setShowCreateModal(false)
          }}
        />
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          allTasks={tasks}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (updates) => {
            await updateTask(selectedTask.id, updates)
          }}
          onDelete={async () => {
            await deleteTask(selectedTask.id)
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}
