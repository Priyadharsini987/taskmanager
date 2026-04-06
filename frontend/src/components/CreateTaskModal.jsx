import { useState, useEffect, useRef } from 'react'

export default function CreateTaskModal({ allTasks, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    due_date: '',
    priority: 5,
    status: 'Pending',
    parent_id: '',
    duration: 60,
  })
  const [creating, setCreating] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setCreating(true)
    const payload = {
      ...form,
      priority: Number(form.priority),
      duration: Number(form.duration),
      parent_id: form.parent_id === '' ? null : Number(form.parent_id),
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    }
    await onCreate(payload)
    setCreating(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleCreate()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }`}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Create New Task</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 22, lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={labelStyle}>
            Task Name *
            <input
              ref={nameRef}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={handleKey}
              placeholder="What needs to be done?"
            />
          </label>

          <label style={labelStyle}>
            Description
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Add details..."
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              Status
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Complete</option>
              </select>
            </label>

            <label style={labelStyle}>
              Priority (1=High)
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {[1,2,3,4,5].map(p => <option key={p} value={p}>Priority {p}</option>)}
              </select>
            </label>

            <label style={labelStyle}>
              Due Date
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </label>

            <label style={labelStyle}>
              Duration (min)
              <input type="number" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </label>
          </div>

          <label style={labelStyle}>
            Parent Task
            <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}>
              <option value="">None (root task)</option>
              {allTasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'var(--surface2)', border: '1.5px solid var(--border)',
            color: 'var(--text)', padding: '10px 18px', borderRadius: 8, fontSize: 13,
          }}>Cancel</button>
          <button
            onClick={handleCreate}
            disabled={creating || !form.name.trim()}
            style={{
              background: creating || !form.name.trim() ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), #9b91f9)',
              border: 'none',
              color: creating || !form.name.trim() ? 'var(--text-muted)' : '#fff',
              padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              opacity: !form.name.trim() ? 0.5 : 1,
            }}
          >{creating ? 'Creating…' : '+ Create Task'}</button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'flex', flexDirection: 'column', gap: 6,
  fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.4px',
}
