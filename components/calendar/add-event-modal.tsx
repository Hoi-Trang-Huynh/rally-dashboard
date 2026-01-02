"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarEvent } from "@/lib/mongodb";
import { Loader2, Plus, X, Trash2 } from "lucide-react";
import { format, parseISO, addHours } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
}

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSaved: () => void;
  selectedDate?: Date;
  eventToEdit?: CalendarEvent; // New prop for editing
}

export function AddEventModal({ isOpen, onClose, onEventSaved, selectedDate, eventToEdit }: AddEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("time-off");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [allDay, setAllDay] = useState(true);
  
  // Time State
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
          // EDIT MODE: Populate from event
          setTitle(eventToEdit.title);
          setType(eventToEdit.type);
          setDescription(eventToEdit.description || "");
          setAllDay(eventToEdit.allDay);

          // Handle Participants
          if (eventToEdit.participants) {
              setSelectedUserIds(eventToEdit.participants.map(p => p.userId));
          } else if (eventToEdit.userId) {
              setSelectedUserIds([eventToEdit.userId]);
          } else {
              setSelectedUserIds([]);
          }

          // Handle Dates & Times
          const start = parseISO(eventToEdit.startDate);
          const end = parseISO(eventToEdit.endDate);

          setStartDate(format(start, "yyyy-MM-dd"));
          setEndDate(format(end, "yyyy-MM-dd"));

          if (!eventToEdit.allDay) {
              setStartTime(format(start, "HH:mm"));
              setEndTime(format(end, "HH:mm"));
          } else {
              setStartTime("09:00");
              setEndTime("10:00");
          }

      } else {
          // ADD MODE: Default values
          const defaultDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
          const now = new Date();
          
          setTitle("");
          setDescription("");
          setType("time-off");
          setSelectedUserIds([]);
          setAllDay(true);
          setStartDate(defaultDate);
          setEndDate(defaultDate);
          setStartTime("09:00");
          setEndTime("10:00");
          
          if (selectedDate) {
               // If a specific date/time was passed (clicked on grid), map it.
               // Even if it is midnight (00:00), we treat it as a start time for the timeline.
               setAllDay(false);
               setStartTime(format(selectedDate, "HH:mm"));
               setEndTime(format(addHours(selectedDate, 1), "HH:mm"));
          } else {
             // Generic Add Button (current time) -> Default to next hour
             const now = new Date();
             setAllDay(false);
             setStartTime(format(addHours(now, 1), "HH:mm")); 
             // ... actually current logic was fine for generic, but let's stick to safe defaults
          }
      }
      
      // Fetch users if not already fetched
      if (users.length === 0) {
        fetchUsers();
      }
    }
  }, [isOpen, selectedDate, eventToEdit]);

  // Generate 15-minute intervals
  const timeOptions = Array.from({ length: 24 * 4 }).map((_, i) => {
      const hours = Math.floor(i / 4).toString().padStart(2, '0');
      const minutes = ((i % 4) * 15).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  });

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    if (userId === "none") return;
    if (!selectedUserIds.includes(userId)) {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map IDs to full user objects
      const participants = selectedUserIds
        .map(id => users.find(u => u.id === id))
        .filter((u): u is User => !!u)
        .map(u => ({ userId: u.id, name: u.name, email: u.email }));

      const eventData: Partial<CalendarEvent> = {
        title,
        type,
        startDate: allDay ? startDate : `${startDate}T${startTime}:00`, 
        endDate: allDay ? endDate : `${endDate}T${endTime}:00`,
        allDay,
        description,
        participants: participants
      };

      const url = eventToEdit ? `/api/calendar/events/${eventToEdit._id}` : "/api/calendar/events";
      const method = eventToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) throw new Error("Failed to save event");

      onEventSaved();
      onClose();
    } catch (error) {
      console.error("Failed to save event", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (!eventToEdit || !confirm("Are you sure you want to delete this event?")) return;
      setLoading(true);
      try {
          const res = await fetch(`/api/calendar/events/${eventToEdit._id}`, {
              method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete event");
          onEventSaved();
          onClose();
      } catch (error) {
          console.error("Failed to delete event", error);
      } finally {
          setLoading(false);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Event Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time-off">Time Off</SelectItem>
                <SelectItem value="team-event">Team Event</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="col-span-3" 
              placeholder="e.g. Summer Vacation"
              required
            />
          </div>

          {/* Participants Selection (Multi-select) */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="participants" className="text-right mt-2">Participants</Label>
            <div className="col-span-3 flex flex-col gap-2">
                <Select onValueChange={handleUserSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder={loadingUsers ? "Loading..." : "Add participant"} />
                    </SelectTrigger>
                    <SelectContent>
                        {users.filter(u => !selectedUserIds.includes(u.id)).map(user => (
                            <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5 border border-border">
                                        <AvatarImage src={`/api/users/${user.id}/avatar`} alt={user.name} />
                                        <AvatarFallback className="text-[9px]">{user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span>{user.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                        {users.length === 0 && !loadingUsers && (
                           <SelectItem value="none" disabled>No users found</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                
                {/* Selected Participants List */}
                {selectedUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {selectedUserIds.map(id => {
                            const user = users.find(u => u.id === id);
                            if (!user) return null;
                            return (
                                <div key={id} className="flex items-center gap-1.5 bg-muted pr-2 pl-1 py-1 rounded-full text-sm border border-border">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={`/api/users/${user.id}/avatar`} alt={user.name} />
                                        <AvatarFallback className="text-[9px] bg-background">
                                            {user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{user.name}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => removeUser(id)}
                                        className="text-muted-foreground hover:text-foreground ml-1"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
          </div>


          {/* All Day Toggle */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="allDay" className="text-right">All Day</Label>
            <div className="col-span-3 flex items-center space-x-2">
                <Switch id="allDay" checked={allDay} onCheckedChange={setAllDay} />
            </div>
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">From</Label>
            <div className="col-span-3 flex gap-2">
                 <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="flex-1"
                 />
                 {!allDay && (
                    <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {timeOptions.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">To</Label>
            <div className="col-span-3 flex gap-2">
                 <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="flex-1"
                 />
                 {!allDay && (
                    <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {timeOptions.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 )}
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Notes</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="col-span-3"
              placeholder="Optional notes..."
            />
          </div>

        </form>

        <DialogFooter className="gap-2 sm:justify-between">
           {eventToEdit ? (
                <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                </Button>
           ) : (
             <div /> /* Spacer */
           )}
           <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {eventToEdit ? "Save Changes" : "Save Event"}
                </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
