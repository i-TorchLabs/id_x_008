"use client";

/** 学生端日历视图：按 Open/Full/Closed 状态着色，支持周/月/日切换。 */
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { ActivityItem } from "@/api/user";

const STATE_COLOR: Record<string, string> = {
  Open: "#16a34a",
  Full: "#d97706",
  Closed: "#9ca3af",
};

export default function CalendarComponent({
  activities,
  onSelect,
}: {
  activities: ActivityItem[];
  onSelect?: (activityId: number) => void;
}) {
  const events = activities.map((a) => ({
    id: String(a.activity_id),
    title: a.activity_name,
    start: a.activity_start_time,
    end: a.activity_end_time,
    color: STATE_COLOR[a.state] ?? STATE_COLOR.Open,
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek,dayGridMonth,timeGridDay",
      }}
      events={events}
      height="auto"
      eventClick={(info) => onSelect?.(Number(info.event.id))}
    />
  );
}
