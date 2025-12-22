'use client';

import { useMemo, useState } from 'react';
import Timeline from 'react-calendar-timeline';

const HOUR_MS = 60 * 60 * 1000;

const groups = [
  { id: 1, title: 'Design' },
  { id: 2, title: 'Development' },
  { id: 3, title: 'QA' },
];

const now = Date.now();
const today = new Date(now);
today.setHours(0, 0, 0, 0);
const startOfToday = today.getTime();
const endOfToday = startOfToday + 24 * HOUR_MS;

const initialItems = [
  {
    id: 1,
    group: 1,
    title: 'Wireframes',
    start_time: now - 3 * HOUR_MS,
    end_time: now - 1 * HOUR_MS,
  },
  {
    id: 2,
    group: 2,
    title: 'API Integration',
    start_time: now - 2 * HOUR_MS,
    end_time: now + 2 * HOUR_MS,
  },
  {
    id: 3,
    group: 3,
    title: 'Regression',
    start_time: now + 1 * HOUR_MS,
    end_time: now + 4 * HOUR_MS,
  },
  {
    id: 4,
    group: 2,
    title: 'UI Polish',
    start_time: now + 3 * HOUR_MS,
    end_time: now + 5 * HOUR_MS,
  },
];

type ModalMode = 'edit' | 'create' | null;

type FormState = {
  id?: number;
  title: string;
  group: number;
  start: number;
  end: number;
};

const toLocalInputValue = (timestamp: number) => {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function TimelinePage() {
  const [items, setItems] = useState(initialItems);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [visibleTime, setVisibleTime] = useState({
    start: startOfToday,
    end: endOfToday,
  });
  const [form, setForm] = useState<FormState>({
    title: '',
    group: groups[0]?.id ?? 1,
    start: now,
    end: now + HOUR_MS,
  });

  const nextId = useMemo(() => items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1, [items]);

  const openEditModal = (itemId: number) => {
    const target = items.find((item) => item.id === itemId);
    if (!target) return;
    setForm({
      id: target.id,
      title: target.title,
      group: target.group,
      start: target.start_time,
      end: target.end_time,
    });
    setModalMode('edit');
  };

  const openCreateModal = (groupId: number, time: number) => {
    setForm({
      title: 'New item',
      group: groupId,
      start: time,
      end: time + HOUR_MS,
    });
    setModalMode('create');
  };

  const closeModal = () => {
    setModalMode(null);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (form.end <= form.start) return;

    if (modalMode === 'edit' && form.id != null) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === form.id
            ? {
                ...item,
                title: form.title,
                group: form.group,
                start_time: form.start,
                end_time: form.end,
              }
            : item
        )
      );
    }

    if (modalMode === 'create') {
      setItems((prev) => [
        ...prev,
        {
          id: nextId,
          group: form.group,
          title: form.title,
          start_time: form.start,
          end_time: form.end,
        },
      ]);
    }

    closeModal();
  };

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 px-6 py-10'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <header className='space-y-2'>
          <h1 className='text-2xl font-semibold tracking-tight'>Timeline Preview</h1>
          <p className='text-sm text-slate-400'>Simple demo using react-calendar-timeline.</p>
        </header>

        <div className='relative z-0 rounded-2xl bg-white/90 p-4 text-slate-900 shadow-xl'>
          <Timeline
            groups={groups}
            items={items}
            defaultTimeStart={now - 6 * HOUR_MS}
            defaultTimeEnd={now + 6 * HOUR_MS}
            onTimeChange={(visibleTimeStart, visibleTimeEnd, updateScrollCanvas) => {
              const zoomLength = 12 * HOUR_MS;
              let nextStart = visibleTimeStart;

              if (visibleTimeStart < startOfToday) {
                nextStart = startOfToday;
              } else if (visibleTimeEnd > endOfToday) {
                nextStart = endOfToday - zoomLength;
              }

              const nextEnd = nextStart + zoomLength;
              setVisibleTime({ start: nextStart, end: nextEnd });
              updateScrollCanvas(nextStart, nextEnd);
            }}
            minZoom={12 * HOUR_MS}
            maxZoom={12 * HOUR_MS}
            itemHeightRatio={0.75}
            lineHeight={52}
            sidebarWidth={140}
            stackItems
            canMove
            canChangeGroup
            canResize='both'
            onItemClick={(itemId) => {
              openEditModal(Number(itemId));
            }}
            onItemMove={(itemId, dragTime, newGroupOrder) => {
              setItems((prev) =>
                prev.map((item) => {
                  if (item.id !== itemId) return item;
                  const duration = item.end_time - item.start_time;
                  return {
                    ...item,
                    start_time: dragTime,
                    end_time: dragTime + duration,
                    group: groups[newGroupOrder]?.id ?? item.group,
                  };
                })
              );
            }}
            onCanvasClick={(groupId, time) => {
              openCreateModal(Number(groupId), time);
            }}
            onItemResize={(itemId, time, edge) => {
              setItems((prev) =>
                prev.map((item) => {
                  if (item.id !== itemId) return item;
                  return edge === 'left' ? { ...item, start_time: time } : { ...item, end_time: time };
                })
              );
            }}
          />
        </div>
      </div>

      {modalMode && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4'>
          <div className='w-full max-w-md rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-2xl'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>{modalMode === 'edit' ? 'Edit item' : 'Create item'}</h2>
              <button
                type='button'
                className='rounded-full px-2 py-1 text-slate-300 hover:text-white'
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <div className='mt-4 space-y-4'>
              <label className='block text-sm'>
                <span className='text-slate-300'>Title</span>
                <input
                  className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none'
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>

              <label className='block text-sm'>
                <span className='text-slate-300'>Group</span>
                <select
                  className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none'
                  value={form.group}
                  onChange={(event) => setForm((prev) => ({ ...prev, group: Number(event.target.value) }))}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className='block text-sm'>
                <span className='text-slate-300'>Start</span>
                <input
                  type='datetime-local'
                  className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none'
                  value={toLocalInputValue(form.start)}
                  onChange={(event) => setForm((prev) => ({ ...prev, start: new Date(event.target.value).getTime() }))}
                />
              </label>

              <label className='block text-sm'>
                <span className='text-slate-300'>End</span>
                <input
                  type='datetime-local'
                  className='mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none'
                  value={toLocalInputValue(form.end)}
                  onChange={(event) => setForm((prev) => ({ ...prev, end: new Date(event.target.value).getTime() }))}
                />
              </label>
            </div>

            <div className='mt-6 flex items-center justify-end gap-3'>
              <button
                type='button'
                className='rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500'
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type='button'
                className='rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white'
                onClick={handleSubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
