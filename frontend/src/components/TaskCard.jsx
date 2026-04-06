/**
 * TaskCard — Level 2 Q2 compliant: NO internal state (useState/useReducer).
 * All data passed as props from parent.
 */

const STATUS_COLORS = {
  'Pending': 'var(--pending)',
  'In Progress': 'var(--inprogress)',
  'Complete': 'var(--complete)',
}

const PRIORITY_LABELS = {
  1: { label: '🔴 P1', color: '#f76f6f' },
  2: { label: '🟠 P2', color: '#f7a26f' },
  3: { label: '🟡 P3', color: '#f7e06f' },
  4: { label: '🔵 P4', color: '#6fb0f7' },
  5: { label: '⚪ P5', color: '#8b90a0' },
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, allTasks }) {
  const parentTask = task.parent_id ? allTasks.find(t => t.id === task.parent_id) : null
  const statusColor = STATUS_COLORS[task.status] || 'var(--text-muted)'
  const priorityInfo = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS[5]

  const formatDate = (d) => {
    if (!d) return null
    const dt = new Date(d)
    if (isNaN(dt)) return null
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Complete'

  return (
    <div
      onClick={onEdit}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,111,247,0.15)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Color accent strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: statusColor, opacity: 0.7,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
        <h3 style={{
          fontSize: 14, fontWeight: 600, fontFamily: 'Syne',
          lineHeight: 1.4, flex: 1,
          textDecoration: task.status === 'Complete' ? 'line-through' : 'none',
          color: task.status === 'Complete' ? 'var(--text-muted)' : 'var(--text)',
        }}>{task.name}</h3>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 16, padding: '0 2px', lineHeight: 1, borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={e => { e.stopPropagation(); e.currentTarget.style.color = 'var(--text-muted)' }}
          title="Delete task"
        >×</button>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{
          fontSize: 12, color: 'var(--text-muted)', marginTop: 6,
          lineHeight: 1.5, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{task.description}</p>
      )}

      {/* Parent */}
      {parentTask && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          ↳ <span style={{ color: 'var(--accent)' }}>{parentTask.name}</span>
        </div>
      )}

      {/* Tags row */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status badge */}
        <select
          value={task.status}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); onStatusChange(e.target.value) }}
          style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 20,
            background: statusColor + '22', border: `1px solid ${statusColor}55`,
            color: statusColor, width: 'auto', fontWeight: 500,
          }}
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Complete">Complete</option>
        </select>

        {/* Priority */}
        <span style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 20,
          background: 'var(--surface2)', color: priorityInfo.color,
          border: '1px solid var(--border)',
        }}>{priorityInfo.label}</span>
      </div>

      {/* Footer */}
      {task.due_date && (
        <div style={{
          marginTop: 10, fontSize: 11,
          color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {isOverdue ? '⚠️' : '📅'} {formatDate(task.due_date)}
          {isOverdue && <span style={{ color: 'var(--danger)' }}>· Overdue</span>}
        </div>
      )}
    </div>
  )
}
