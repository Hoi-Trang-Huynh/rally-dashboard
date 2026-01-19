"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Loader2, Calendar, MessageSquare, User as UserIcon } from "lucide-react";
import { Feedback, FeedbackCategory } from "@/types/feedback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveFeedback } from "@/lib/api-feedback";

interface FeedbackItemProps {
  feedback: Feedback;
  onUpdate: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  [FeedbackCategory.UI_UX]: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  [FeedbackCategory.BUG]: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  [FeedbackCategory.FEATURE]: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  [FeedbackCategory.PERFORMANCE]: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  [FeedbackCategory.OTHER]: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

export function FeedbackItem({ feedback, onUpdate }: FeedbackItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleResolve = async () => {
    setIsUpdating(true);
    try {
      await resolveFeedback(feedback.id, !feedback.resolved);
      onUpdate();
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className={`group relative transition-all duration-300 border-border/50 overflow-hidden ${
      feedback.resolved 
        ? "bg-muted/30 border-l-4 border-l-emerald-500/50" 
        : "bg-gradient-to-br from-card to-muted/20 border-l-4 border-l-amber-500/50"
    }`}>
      
      <div className="absolute top-4 right-4 flex gap-2 items-center">
        {feedback.categories?.map((cat) => (
          <Badge 
            key={cat} 
            variant="outline" 
            className={`text-[10px] px-2.5 py-0.5 h-6 font-semibold border tracking-wide uppercase ${CATEGORY_COLORS[cat] || CATEGORY_COLORS[FeedbackCategory.OTHER]}`}
          >
            {cat.replace("_", " ")}
          </Badge>
        ))}
      </div>

      <CardHeader className="flex flex-col gap-3 pb-3 pr-12">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
                <Avatar className="h-11 w-11 border-2 border-background shadow-md">
                <AvatarImage src={feedback.avatar_url} alt={feedback.username} />
                <AvatarFallback className="bg-gradient-to-tr from-pink-500 to-orange-500 text-white font-bold">
                    {feedback.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
                </Avatar>
                {/* Kept the avatar indicator as a secondary visual cue */}
                <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center text-[10px] text-white shadow-sm ${feedback.resolved ? "bg-emerald-500" : "bg-amber-500"}`}>
                    {feedback.resolved ? <Check className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-pulse" />}
                </div>
            </div>
            
            <div>
              <h4 className="text-[15px] font-semibold text-foreground leading-none mb-1.5">{feedback.username}</h4>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
                <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4 grid gap-4">
        <div className="pl-1">
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-foreground/90 font-normal">
             {feedback.comment}
          </p>
        </div>
        
        {feedback.image_url && (
            <div className="mt-1 rounded-xl overflow-hidden border border-border/50 group/image relative shadow-sm">
                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors pointer-events-none" />
                <img src={feedback.image_url} alt="Attachment" className="max-h-64 w-full object-cover transition-transform duration-700 group-hover/image:scale-105" />
            </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-4 flex justify-between items-center transition-opacity duration-300">
         <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-md border border-border/50">
            ID: {feedback.id.substring(0, 8)}
         </span>
        <Button
          size="sm"
          onClick={toggleResolve}
          disabled={isUpdating}
          className={`
            h-8 px-4 rounded-md text-xs font-semibold shadow-sm transition-all duration-300
            ${feedback.resolved 
                ? "bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20" 
                : "bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20"
            }
          `}
        >
          {isUpdating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : feedback.resolved ? (
            <>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Re-open
            </>
          ) : (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Resolve
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
