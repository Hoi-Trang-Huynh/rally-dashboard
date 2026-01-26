"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { Feedback, FeedbackListResponse, FeedbackCategory } from "@/types/feedback";
import { getFeedbacks } from "@/lib/api-feedback";
import { FeedbackItem } from "./feedback-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateFeedbackDialog } from "./create-feedback-dialog";
import { User } from "@/types";

interface FeedbackListProps {
  currentUser?: User;
}

export function FeedbackList({ currentUser }: FeedbackListProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "all">("all");

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const categories = categoryFilter !== "all" ? [categoryFilter] : undefined;
      // Note: API supports username search, not generic text search according to swagger summary.
      // But let's assume 'username' param can be used for filtering by user.
      const data = await getFeedbacks(page, 20, search || undefined, categories);
      setFeedbacks(data.feedbacks || []);
      setTotalPages(data.total_pages);
      setTotalItems(data.total);
    } catch (error) {
      console.error("Failed to fetch feedbacks", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchFeedbacks();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchFeedbacks]);

  const handleRefresh = () => {
    fetchFeedbacks();
  };

  // Mock stats since API doesn't provide them directly
  // In a real app, these should come from an endpoint
  const pendingCount = (feedbacks || []).filter(f => !f.resolved).length;
  const resolvedCount = (feedbacks || []).filter(f => f.resolved).length;

  const [statusFilter, setStatusFilter] = useState<"all" | "resolved" | "pending">("all");

  const filteredFeedbacks = (feedbacks || []).filter((f) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "resolved") return f.resolved;
    if (statusFilter === "pending") return !f.resolved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="flex w-full sm:w-auto items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as FeedbackCategory | "all")}>
            <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value={FeedbackCategory.UI_UX}>UI/UX</SelectItem>
              <SelectItem value={FeedbackCategory.BUG}>Bugs</SelectItem>
              <SelectItem value={FeedbackCategory.FEATURE}>Feature Requests</SelectItem>
              <SelectItem value={FeedbackCategory.PERFORMANCE}>Performance</SelectItem>
              <SelectItem value={FeedbackCategory.OTHER}>Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as "all" | "resolved" | "pending")}>
            <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
              <div className={`mr-2 h-2 w-2 rounded-full ${statusFilter === "resolved" ? "bg-emerald-500" : statusFilter === "pending" ? "bg-amber-500" : "bg-slate-300"}`} />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CreateFeedbackDialog currentUser={currentUser} onSuccess={handleRefresh} />
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 border-pink-500/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <MessageSquare className="h-24 w-24 text-pink-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-600 dark:text-pink-400">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertCircle className="h-24 w-24 text-amber-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold text-foreground flex items-baseline gap-2">
              {totalItems > 0 ? pendingCount : 0}
              {pendingCount > 0 && <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">Requires attention</span>}
             </div>
            <p className="text-xs text-muted-foreground mt-1">Open issues</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 className="h-24 w-24 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalItems > 0 ? resolvedCount : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Fixed or addressed</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
           <div className="flex flex-col items-center gap-2">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
             <p className="text-muted-foreground">Loading feedback...</p>
           </div>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/10 border-dashed">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No feedback found</h3>
          <p className="text-muted-foreground">Adjust your filters or submit the first feedback!</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className="break-inside-avoid">
              <FeedbackItem feedback={feedback} onUpdate={fetchFeedbacks} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
