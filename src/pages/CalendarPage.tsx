import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Plus } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { EVENT_TYPE_LABELS } from '../utils/helpers';
import type { EventPriority, EventStatus, EventType } from '../types';

const TYPE_COLORS: Record<EventType, string> = {
  staff_schedule: '#c9a227',
  customer_pickup: '#16a34a',
  supplier_delivery: '#2563eb',
  business_task: '#d97706',
  personal_note: '#a855f7',
};

export function CalendarPage() {
  const { state, addEvent, updateEvent, deleteEvent, currentStaff } = useStore();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'business_task' as EventType,
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    endTime: '10:00',
    staffIds: [] as string[],
    notes: '',
    priority: 'medium' as EventPriority,
    status: 'pending' as EventStatus,
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const visibleEvents = state.events.filter((e) => {
    if (currentStaff?.role === 'owner') return true;
    return e.staffIds.length === 0 || (currentStaff && e.staffIds.includes(currentStaff.id));
  });

  const dayEvents = visibleEvents.filter((e) => e.date === selectedDate);

  const save = () => {
    if (!form.title.trim()) return;
    addEvent({
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      time: form.time,
      endTime: form.endTime,
      staffIds: form.staffIds,
      notes: form.notes,
      priority: form.priority,
      status: form.status,
      linkedOrderId: null,
      linkedCustomerId: null,
      color: TYPE_COLORS[form.type],
    });
    setOpen(false);
    setSelectedDate(form.date);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Calendar</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setForm((f) => ({ ...f, date: selectedDate, title: '' }));
            setOpen(true);
          }}
        >
          <Plus size={16} /> Add event
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
        <div className="panel">
          <div className="toolbar" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-sm" onClick={() => setCursor(addMonths(cursor, -1))}>
              ←
            </button>
            <strong>{format(cursor, 'MMMM yyyy')}</strong>
            <button type="button" className="btn btn-sm" onClick={() => setCursor(addMonths(cursor, 1))}>
              →
            </button>
          </div>
          <div className="calendar-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="cal-day-head">{d}</div>
            ))}
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const events = visibleEvents.filter((e) => e.date === key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`cal-day ${!isSameMonth(day, cursor) ? 'outside' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
                  onClick={() => setSelectedDate(key)}
                  style={
                    selectedDate === key
                      ? { outline: '2px solid var(--color-accent)' }
                      : undefined
                  }
                >
                  <div className="num">{format(day, 'd')}</div>
                  {events.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="cal-event-dot"
                      style={{ background: e.color || TYPE_COLORS[e.type] }}
                    >
                      {e.title}
                    </div>
                  ))}
                </button>
              );
            })}
          </div>
          <div className="filters" style={{ marginTop: 12 }}>
            {(Object.keys(TYPE_COLORS) as EventType[]).map((t) => (
              <span key={t} className="badge" style={{ background: TYPE_COLORS[t], color: '#111' }}>
                {EVENT_TYPE_LABELS[t]}
              </span>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>{selectedDate}</h3>
          <div className="list-compact">
            {dayEvents.map((e) => (
              <div key={e.id} className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{e.title}</strong>
                  <span className="badge" style={{ background: e.color, color: '#111' }}>
                    {EVENT_TYPE_LABELS[e.type]}
                  </span>
                </div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.82rem' }}>
                  {e.time}–{e.endTime} · {e.priority} · {e.status}
                </div>
                {e.notes ? <div style={{ fontSize: '0.85rem' }}>{e.notes}</div> : null}
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <select
                    value={e.status}
                    onChange={(ev) =>
                      updateEvent(e.id, { status: ev.target.value as EventStatus })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteEvent(e.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!dayEvents.length ? <div className="empty">No events this day</div> : null}
          </div>
        </div>
      </div>

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New event</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                >
                  {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
                    <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as EventPriority })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="field">
                <label>Time</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="field">
              <label>Assign staff</label>
              <div className="filters">
                {state.staff.map((s) => {
                  const on = form.staffIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`btn btn-sm ${on ? 'btn-primary' : ''}`}
                      onClick={() =>
                        setForm({
                          ...form,
                          staffIds: on
                            ? form.staffIds.filter((id) => id !== s.id)
                            : [...form.staffIds, s.id],
                        })
                      }
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={save}>Save event</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
