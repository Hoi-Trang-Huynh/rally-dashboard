"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFeedback } from "@/lib/api-feedback";
import { User } from "@/types";
import { FeedbackCategory } from "@/types/feedback";
import { Badge } from "@/components/ui/badge";

const CATEGORY_COLORS: Record<string, string> = {
  [FeedbackCategory.UI_UX]: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  [FeedbackCategory.BUG]: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  [FeedbackCategory.FEATURE]: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  [FeedbackCategory.PERFORMANCE]: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  [FeedbackCategory.OTHER]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
};

interface CreateFeedbackDialogProps {
  currentUser?: User;
  onSuccess: () => void;
}

export function CreateFeedbackDialog({ currentUser, onSuccess }: CreateFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [categories, setCategories] = useState<FeedbackCategory[]>([]);

  const toggleCategory = (category: FeedbackCategory) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsLoading(true);
    try {
      await createFeedback({
        username: currentUser?.name || "Anonymous",
        comment: comment,
        avatar_url: currentUser?.image || undefined,
        categories: categories,
      });
      setOpen(false);
      setComment("");
      setCategories([]);
      onSuccess();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/20">
          <Plus className="mr-2 h-4 w-4" />
          New Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts or report issues. We appreciate your input!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your feedback..."
              className="resize-none h-32"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 pt-2">
              {Object.values(FeedbackCategory).map((cat) => {
                const isSelected = categories.includes(cat);
                const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS[FeedbackCategory.OTHER];
                
                return (
                  <Badge
                    key={cat}
                    variant={isSelected ? "outline" : "outline"}
                    className={`cursor-pointer transition-all select-none py-1.5 px-3 border-2
                      ${isSelected 
                        ? `${colorClass} ring-offset-2` 
                        : "text-muted-foreground border-border bg-transparent hover:bg-muted"
                      }
                    `}
                    onClick={() => toggleCategory(cat)}
                  >
                    {isSelected && <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-current" />}
                    {cat.replace("_", "/").toUpperCase()}
                  </Badge>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
