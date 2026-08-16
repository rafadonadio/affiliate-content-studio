import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface ScheduledPost {
  id: number;
  product_link: string;
  caption: string;
  platform: string;
  scheduled_for: string;
  status: string;
}

export default function CalendarView() {
  const [events, setEvents] = useState<Event[]>([]);

  const fetchScheduled = async () => {
    try {
      const res = await fetch(API_URL + '/api/scheduled');
      const data: ScheduledPost[] = await res.json();
      const calendarEvents = data.map(post => ({
        id: post.id,
        title: `[${post.platform}] ${post.product_link}`,
        start: new Date(post.scheduled_for),
        end: new Date(new Date(post.scheduled_for).getTime() + 60 * 60 * 1000), // 1 hour duration visually
        resource: post
      }));
      setEvents(calendarEvents);
    } catch (e) {
      console.error('Failed to fetch scheduled posts', e);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  const onEventDrop = async (data: { event: Event, start: Date, end: Date }) => {
    const { event, start } = data;
    try {
      const res = await fetch(API_URL + `/api/scheduled/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: start.toISOString() })
      });
      if (res.ok) {
        setEvents(prev => {
          const existing = prev.find(ev => ev.id === event.id) ?? {};
          const filtered = prev.filter(ev => ev.id !== event.id);
          return [...filtered, { ...existing, start, end: new Date(start.getTime() + 60 * 60 * 1000) }];
        });
      }
    } catch (e) {
      console.error('Failed to update event', e);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
      <h2 className="text-lg font-semibold mb-4">Content Calendar</h2>
      <div style={{ height: '70vh' }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          onEventDrop={onEventDrop}
          resizable={false}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
