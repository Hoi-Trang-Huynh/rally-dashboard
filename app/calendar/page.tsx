"use client";

import { useEffect, useState, useRef } from "react";
import { 
    format, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    addWeeks, 
    subWeeks, 
    isToday, 
    parseISO, 
    isSameDay,
    differenceInMinutes,
    startOfDay,
    getHours,
    getMinutes
} from "date-fns";
import { CalendarEvent } from "@/lib/mongodb";
import { ChevronLeft, ChevronRight, Filter, Users, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddEventModal } from "@/components/calendar/add-event-modal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  name: string;
  email: string;
}

const HOURS = Array.from({ length: 24 }).map((_, i) => i);
const PIXELS_PER_MINUTE = 1; // 60px per hour
const SLOT_HEIGHT = 60;

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  
  // User Filtering
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 8 AM on load
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 8 * 60;
    }
  }, []);

  // Fetch Users for Filter
  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
          if (data.users) setUsers(data.users);
      })
      .catch(err => console.error("Failed to fetch users", err));
  }, []);

  // Fetch events for the current week
  const fetchEvents = async () => {
      setLoading(true);
      try {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }).toISOString(); // Monday start
        const end = endOfWeek(currentDate, { weekStartsOn: 1 }).toISOString();
        
        let url = `/api/calendar/events?startDate=${start}&endDate=${end}`;
        if (selectedUserId && selectedUserId !== "all") {
            url += `&userId=${selectedUserId}`;
        }

        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            setEvents(data.events);
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, selectedUserId]);

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  // Get days for the current week (Mon-Sun)
  const daysInWeek = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
        const eventStart = parseISO(event.startDate);
        const eventEnd = parseISO(event.endDate);
        return isSameDay(day, eventStart) || (day >= eventStart && day <= eventEnd);
    });
  };

  const getEventTypeColor = (type: string) => {
      switch (type) {
          case 'time-off': return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 dark:border-pink-500/30';
          case 'team-event': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30';
          case 'meeting': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30';
          case 'holiday': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30';
          default: return 'bg-muted/50 text-muted-foreground border-border/50';
      }
  };

  const getEventPosition = (event: CalendarEvent) => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      const startMinutes = getHours(start) * 60 + getMinutes(start);
      // Default duration 1 hour if something is wrong, or calculated difference
      let duration = differenceInMinutes(end, start);
      if (duration < 30) duration = 30; // Minimum height

      return {
          top: startMinutes * PIXELS_PER_MINUTE,
          height: duration * PIXELS_PER_MINUTE
      };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Standard Header */}
      <div className="px-6 pt-8 pb-6 flex items-center justify-between shrink-0 border-b border-border/50">
          <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                  <CalendarIcon className="h-7 w-7" />
              </div>
              <div>
                  <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                  <p className="text-lg text-muted-foreground">Manage schedules and team events</p>
              </div>
          </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 px-6 py-4 border-b border-border/50 shrink-0 bg-background z-10">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground min-w-[200px]">
                    {format(currentDate, "MMMM yyyy")}
                </h1>
                
                {/* Navigation */}
                <div className="flex items-center rounded-lg border border-border bg-card">
                    <button onClick={prevWeek} className="p-2 hover:bg-muted transition-colors border-r border-border">
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        Today
                    </button>
                    <button onClick={nextWeek} className="p-2 hover:bg-muted transition-colors border-l border-border">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* User Filter */}
                <div className="w-[200px]">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="h-10 border-border bg-card">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 opacity-50"/>
                                <SelectValue placeholder="Filter by user" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <span className="font-medium">All Users</span>
                            </SelectItem>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-6 w-6 border border-border">
                                            <AvatarImage src={`/api/users/${user.id}/avatar`} alt={user.name} />
                                            <AvatarFallback className="text-[10px] bg-pink-500/10 text-pink-500">
                                                {user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{user.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                 <Button onClick={() => setIsModalOpen(true)} className="bg-pink-500 hover:bg-pink-600 text-white gap-2 h-9">
                    <Plus className="h-4 w-4" />
                    Add Event
                </Button>
            </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="flex flex-1 overflow-hidden flex-col">
          
        {/* Days Header (Sticky Top) */}
        <div className="flex border-b border-border bg-card shrink-0">
             {/* Top Left Corner */}
             <div className="w-16 border-r border-border bg-muted/10 shrink-0" />
             
             {/* Day Columns */}
             <div className="flex-1 grid grid-cols-7">
                {daysInWeek.map(day => (
                      <div key={day.toString()} className={cn(
                          "py-3 text-center border-r border-border/30 last:border-r-0 flex flex-col gap-1",
                          isToday(day) && "bg-pink-500/5"
                      )}>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {format(day, "EEE")}
                          </span>
                          <span className={cn(
                              "text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                              isToday(day) ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "text-foreground"
                          )}>
                              {format(day, "d")}
                          </span>
                      </div>
                  ))}
             </div>
             <div className="w-[15px] shrink-0 bg-muted/10 border-l border-border/30" /> {/* Scrollbar spacer */}
        </div>

        {/* All Day Events Row */}
        <div className="flex border-b-2 border-border/50 bg-muted/5 min-h-[50px] shrink-0 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] z-20">
             <div className="w-16 border-r border-border flex items-center justify-center text-[10px] text-muted-foreground font-medium bg-muted/10">
                 All Day
             </div>
             <div className="flex-1 grid grid-cols-7">
                 {daysInWeek.map(day => {
                     const allDayEvents = getEventsForDay(day).filter(e => e.allDay);
                     return (
                        <div key={day.toString()} className="border-r border-border/30 p-1 flex flex-col gap-1">
                             {allDayEvents.map(event => (
                                 <div 
                                    key={event._id} 
                                    className={cn("text-[10px] px-2 py-1 rounded truncate font-medium border cursor-pointer hover:opacity-80 transition-opacity", getEventTypeColor(event.type))}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingEvent(event);
                                        setIsModalOpen(true);
                                    }}
                                 >
                                     {event.title}
                                 </div>
                             ))}
                        </div>
                     );
                 })}
             </div>
             <div className="w-[15px] shrink-0 bg-muted/5 border-l border-border/30" />
        </div>

        {/* Scrollable Time Grid */}
        <div className="flex-1 overflow-y-auto relative no-scrollbar" ref={scrollRef}>
             <div className="flex min-h-[1440px]">
                  {/* Hours Sidebar */}
                  <div className="w-16 shrink-0 border-r border-border bg-background flex flex-col sticky left-0 z-10">
                      {HOURS.map(hour => (
                          <div key={hour} className="h-[60px] relative text-xs text-muted-foreground text-right pr-2 select-none">
                              <span className={cn(
                                  "absolute right-2 -translate-y-1/2 bg-background z-10 px-1",
                                  hour === 0 ? "top-0 translate-y-0" : "top-0" 
                              )}>
                                {format(new Date().setHours(hour, 0), "h a")}
                              </span>
                          </div>
                      ))}
                  </div>

                  {/* Day Columns Grid */}
                  <div className="flex-1 grid grid-cols-7 relative">
                      {/* Horizontal Hour Lines (background) */}
                      <div className="absolute inset-0 z-0 pointer-events-none flex flex-col">
                           {HOURS.map(hour => (
                              <div key={hour} className="h-[60px] border-b border-border/20" />
                           ))}
                      </div>

                      {/* Columns */}
                      {daysInWeek.map((day) => {
                          const timeEvents = getEventsForDay(day).filter(e => !e.allDay);
                          
                          return (
                              <div key={day.toISOString()} className="border-r border-border/30 relative h-full group">
                                  {/* Click Receiver */}
                                  <div 
                                    className="absolute inset-0 z-10 cursor-crosshair"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const y = e.clientY - rect.top; 
                                        const hourClicked = Math.floor(y / 60);
                                        const dateWithTime = new Date(day);
                                        dateWithTime.setHours(hourClicked, 0, 0, 0);
                                        
                                        setSelectedDate(dateWithTime);
                                        setIsModalOpen(true);
                                    }}
                                  />

                                  {/* Events */}
                                  {timeEvents.map(event => {
                                      const { top, height } = getEventPosition(event);
                                      return (
                                          <div
                                              key={event._id}
                                              className={cn(
                                                  "absolute left-1 right-1 rounded border overflow-hidden cursor-pointer hover:brightness-95 transition-all z-20 p-1 flex flex-col shadow-sm",
                                                  getEventTypeColor(event.type)
                                              )}
                                              style={{ 
                                                  top: `${top}px`, 
                                                  height: `${height}px`,
                                                  minHeight: '26px'
                                              }}
                                              onClick={(e) => {
                                                  e.stopPropagation(); 
                                                  setEditingEvent(event);
                                                  setIsModalOpen(true);
                                              }}
                                          >
                                              <div className="font-semibold text-xs truncate leading-tight flex items-center gap-1">
                                                  {event.title}
                                              </div>
                                              
                                              {height > 25 && (
                                                   <div className="text-[10px] opacity-80 truncate leading-tight">
                                                       {format(parseISO(event.startDate), "h:mm")} - {format(parseISO(event.endDate), "h:mm a")}
                                                   </div>
                                              )}
                                              
                                              {height > 60 && event.participants && (
                                                  <div className="flex -space-x-1 mt-auto pb-0.5 overflow-hidden">
                                                      {event.participants.slice(0, 3).map((p, i) => (
                                                          <Avatar key={i} className="w-4 h-4 border border-background">
                                                              <AvatarImage src={`/api/users/${p.userId}/avatar`} />
                                                              <AvatarFallback className="text-[6px]">{p.name?.[0]}</AvatarFallback>
                                                          </Avatar>
                                                      ))}
                                                  </div>
                                              )}
                                          </div>
                                      );
                                  })}
                              </div>
                          );
                      })}
                  </div>
             </div>
        </div>
      </div>

       <AddEventModal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(undefined); // Reset edit state on close
        }}
        onEventSaved={fetchEvents}
        selectedDate={selectedDate}
        eventToEdit={editingEvent}
      />
    </div>
  );
}
