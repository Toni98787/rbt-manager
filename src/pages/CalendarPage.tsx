import { useMemo, useState } from 'react';
import { useAppStore, useCurrentUser } from '../store/useAppStore';
import { Modal } from '../components/common/Modal';
import { fmtDateTime, uid } from '../lib/dates';
import type { CalendarEvent, EventType } from '../types';

const typeColors: Record<EventType, string> = {
  staff_schedule: '#c9a227',
  customer_pickup: '#22c55e',
  supplier_delivery: '#38bdf8',
  business_task: '#f97316',
  personal_note: '#a78bfa',
};

const blank = (): CalendarEvent => ({
  id: uid('ev'),
  title: '',
  type: 'business_task',
  color: typeColors.business_task,
  start: new Date().toISOString(),
  priority: 'medium',
  status: 'planned',
});

export function CalendarPage() {
  const events = useAppStore((s) => s.events);
  const staff = useAppStore((s) => s.staff);
  const upsertEvent = useAppStore((s) => s.upsertEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const user = useCurrentUser();
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const visible = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
    if (!user || user.role === 'owner') return sorted;
    return sorted.filter(
      (e) => !e.staffId || e.staffId === user.id || e.type !== 'personal_note',
    );
  }, [events, user]);

  return (
    <div className="stack">
      <div className="spread wrap">
        <div>
          <h1>Calendar</h1>
          <p className="muted">
            Schedules, pickups, deliveries, tasks, and notes — with notifications.
          </p>
        </div>
        <button className="btn primary" onClick={() => setEditing(blank())}>
          Add event
        </button>
      </div>

      <div className="panel" style={{ padding: 14 }}>
        <h3>Notifications</h3>
        <div className="stack" style={{ marginTop: 8 }}>
          {notifications.length === 0 ? (
            <div className="muted">No notifications</div>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <div key={n.id} className="spread">
                <div>
                  <div style={{ fontWeight: 700, opacity: n.read ? 0.65 : 1 }}>{n.title}</div>
                  <div className="tiny muted">{n.body}</div>
                </div>
                {!n.read ? (
                  <button className="btn ghost" onClick={() => markRead(n.id)}>
                    Mark read
                  </button>
                ) : (
                  <span className="tiny muted">Read</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel" style={{ padding: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Event</th>
              <th>Type</th>
              <th>Staff</th>
              <th>Priority</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr key={e.id}>
                <td>{fmtDateTime(e.start)}</td>
                <td>
                  <div className="row">
                    <span className="color-swatch" style={{ background: e.color, width: 12, height: 12 }} />
                    {e.title}
                  </div>
                </td>
                <td>{e.type.replaceAll('_', ' ')}</td>
                <td>{staff.find((s) => s.id === e.staffId)?.name || '—'}</td>
                <td>{e.priority}</td>
                <td>{e.status}</td>
                <td>
                  <button className="btn ghost" onClick={() => setEditing(e)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} title="Event" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="stack">
            <div className="grid-2">
              <div className="field">
                <label>Title</label>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={editing.type}
                  onChange={(e) => {
                    const type = e.target.value as EventType;
                    setEditing({ ...editing, type, color: typeColors[type] });
                  }}
                >
                  {Object.keys(typeColors).map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Start</label>
                <input
                  type="datetime-local"
                  value={editing.start.slice(0, 16)}
                  onChange={(e) =>
                    setEditing({ ...editing, start: new Date(e.target.value).toISOString() })
                  }
                />
              </div>
              <div className="field">
                <label>Staff assigned</label>
                <select
                  value={editing.staffId || ''}
                  onChange={(e) => setEditing({ ...editing, staffId: e.target.value || undefined })}
                >
                  <option value="">Anyone / shop</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select
                  value={editing.priority}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      priority: e.target.value as CalendarEvent['priority'],
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="field">
                <label>Status</label>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as CalendarEvent['status'],
                    })
                  }
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea
                rows={3}
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </div>
            <div className="row">
              <button
                className="btn primary"
                onClick={() => {
                  if (!editing.title.trim()) return;
                  upsertEvent(editing);
                  setEditing(null);
                }}
              >
                Save
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  deleteEvent(editing.id);
                  setEditing(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
