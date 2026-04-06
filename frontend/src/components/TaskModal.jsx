import { useState, useEffect } from 'react'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Complete']

export default function TaskModal({ task, allTasks, onClose, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    name: task.name || '',
    description: task.description || '',
    due_date: task.due_date ? task.due_date.split('T')[0] : '',
    priority: task.priority ?? 5,
    status: task.status || 'Pending',
    parent_id: task.parent_id ?? '',
    duration: task.duration ?? 60,
  })
  const [saving, setSaving] = useState(false)

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...form,
      priority: Number(form.priority),
      duration: Number(form.duration),
      parent_id: form.parent_id === '' ? null : Number(form.parent_id),
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    }
    await onUpdate(payload)
    setSaving(false)
  }

  const otherTasks = allTasks.filter(t => t.id !== task.id)

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
          borderRadius: 16, padding: 28, width: '100%', maxWidth: 540,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }`}</style>

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Task</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 22, lineHeight: 1, borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={labelStyle}>
            Task Name
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Task name..." />
          </label>

          <label style={labelStyle}>
            Description
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description..." />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              Status
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
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
              <option value="">None</option>
              {otherTasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'space-between' }}>
          <button onClick={onDelete} style={{
            background: 'none', border: '1.5px solid var(--danger)',
            color: 'var(--danger)', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,111,111,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >🗑 Delete</button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              background: 'var(--surface2)', border: '1.5px solid var(--border)',
              color: 'var(--text)', padding: '10px 18px', borderRadius: 8, fontSize: 13,
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{
              background: saving ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), #9b91f9)',
              border: 'none', color: saving ? 'var(--text-muted)' : '#fff',
              padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              opacity: !form.name.trim() ? 0.5 : 1,
            }}>
              {saving ? 'Saving…' : '✓ Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'flex', flexDirection: 'column', gap: 6,
  fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.4px',
}
