"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Plus, Send, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KudosItem {
  _id: string;
  fromUserName: string;
  fromUserImage?: string | null;
  toUserName: string;
  toUserImage?: string | null;
  message: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export function KudosFeedCard() {
  const { data: session } = useSession();
  const [kudos, setKudos] = useState<KudosItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string>("all"); // Filter by recipient

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [message, setMessage] = useState("");

  const fetchKudos = async (cursor?: string, append = false, userId?: string) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      let url = "/api/kudos?limit=10";
      if (cursor) {
        url += `&before=${encodeURIComponent(cursor)}`;
      }
      if (userId && userId !== "all") {
        url += `&toUserId=${encodeURIComponent(userId)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setKudos(prev => [...prev, ...(data.kudos || [])]);
        } else {
          setKudos(data.kudos || []);
        }
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error("Failed to fetch kudos", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchKudos(nextCursor, true, filterUserId);
    }
  };

  const handleFilterChange = (userId: string) => {
    setFilterUserId(userId);
    setNextCursor(null);
    fetchKudos(undefined, false, userId);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchKudos();
    fetchUsers();
    const interval = setInterval(() => fetchKudos(), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!selectedUserId || !message.trim()) return;

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: selectedUser.id,
          toUserName: selectedUser.name,
          toUserImage: `/api/users/${selectedUser.id}/avatar`,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        setSelectedUserId("");
        setMessage("");
        fetchKudos();
      }
    } catch (err) {
      console.error("Failed to send kudos", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <Card className="border-border shadow-sm bg-card overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200 h-[450px]">
      <CardHeader className="pb-4 pt-6 px-6 bg-gradient-to-br from-pink-500/5 to-rose-500/5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">Kudos</CardTitle>
                {kudos.length > 0 && (
                  <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {kudos.length}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Celebrate your teammates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by recipient */}
            <Select value={filterUserId} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="text-xs">All Kudos</span>
                </SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={`/api/users/${user.id}/avatar`} />
                        <AvatarFallback className="text-[8px]">
                          {user.name?.split(" ").map(n => n[0]).join("").substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">{user.name?.split(" ")[0]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white gap-1.5">
                  <Plus className="h-4 w-4" />
                  Send
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Send Kudos
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teammate" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(u => u.id !== (session?.user as any)?.id)
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={`/api/users/${user.id}/avatar`} />
                                <AvatarFallback className="text-[10px]">
                                  {user.name?.split(" ").map(n => n[0]).join("").substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              {user.name}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Input
                    placeholder="Thanks for helping with..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedUserId || !message.trim() || isSubmitting}
                  className="w-full bg-pink-500 hover:bg-pink-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Kudos
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" />
          </div>
        ) : kudos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <Heart className="h-8 w-8 mb-3 text-pink-500/30" />
            <p className="font-medium text-foreground text-sm">No kudos yet!</p>
            <p className="text-xs">Be the first to appreciate a teammate</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {kudos.map((item) => (
              <div key={item._id} className="p-4 hover:bg-muted/40 transition-colors">
                <div className="flex gap-4">
                  {/* Large recipient avatar with sender avatar overlay */}
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 border-2 border-pink-200 dark:border-pink-800 shadow-md">
                      <AvatarImage src={item.toUserImage || undefined} />
                      <AvatarFallback className="text-sm bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600 dark:from-pink-900/50 dark:to-rose-900/50 dark:text-pink-300 font-semibold">
                        {item.toUserName?.split(" ").map(n => n[0]).join("").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Sender avatar overlay */}
                    <Avatar className="h-6 w-6 absolute -bottom-1 -right-1 border-2 border-background shadow-sm">
                      <AvatarImage src={item.fromUserImage || undefined} />
                      <AvatarFallback className="text-[8px] bg-muted font-medium">
                        {item.fromUserName?.split(" ").map(n => n[0]).join("").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Header with names */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-muted-foreground">{item.fromUserName.split(" ")[0]}</span>
                      <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                      <span className="font-semibold text-sm text-foreground">{item.toUserName}</span>
                    </div>
                    
                    {/* Message bubble */}
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-xl px-3 py-2 border border-pink-100 dark:border-pink-900/30">
                      <p className="text-sm text-foreground leading-relaxed">{item.message}</p>
                    </div>
                    
                    {/* Timestamp */}
                    <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">{formatTime(item.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isLoadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
