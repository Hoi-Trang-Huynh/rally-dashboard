"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Loader2, Calendar, Paperclip, ChevronLeft, ChevronRight } from "lucide-react";
import { Feedback, FeedbackCategory } from "@/types/feedback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveFeedback } from "@/lib/api-feedback";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (feedback.attachment_urls) {
      setCurrentImageIndex((prev) => (prev + 1) % feedback.attachment_urls!.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (feedback.attachment_urls) {
      setCurrentImageIndex((prev) => (prev - 1 + feedback.attachment_urls!.length) % feedback.attachment_urls!.length);
    }
  };

  return (
    <Card className="group relative transition-all duration-300 border-border/40 hover:border-border/80 hover:shadow-sm bg-card overflow-hidden">
      
      <div className="absolute top-3 right-3 flex gap-2 items-center">
        {feedback.resolved && (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200/50">
            Resolved
          </Badge>
        )}
        {feedback.categories?.map((cat) => (
          <Badge 
            key={cat} 
            variant="outline" 
            className={`text-[10px] px-2 py-0.5 h-5 font-medium border tracking-wide uppercase ${CATEGORY_COLORS[cat] || CATEGORY_COLORS[FeedbackCategory.OTHER]}`}
          >
            {cat.replace("_", " ")}
          </Badge>
        ))}
      </div>

      <CardHeader className="flex flex-row gap-3 p-4 pb-2">
         <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={feedback.avatar_url} alt={feedback.username} />
            <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium">
                {feedback.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
         </Avatar>
         <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-medium text-foreground leading-none">{feedback.username}</h4>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}</span>
            </div>
         </div>
      </CardHeader>
      
      <CardContent className="px-4 py-2 min-h-[3rem]">
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
           {feedback.comment}
        </p>
        
        {feedback.attachment_urls && feedback.attachment_urls.length > 0 && (
          <div className="mt-3">
             <Dialog onOpenChange={(open) => !open && setCurrentImageIndex(0)}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2.5 text-xs gap-1.5 font-medium bg-muted/30 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Paperclip className="h-3 w-3" />
                    {feedback.attachment_urls.length} Attachment{feedback.attachment_urls.length !== 1 ? 's' : ''}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none focus:outline-none">
                    <div className="relative w-full h-[85vh] flex items-center justify-center group/lightbox focus:outline-none">
                      <img 
                        src={feedback.attachment_urls[currentImageIndex]} 
                        alt={`Attachment ${currentImageIndex + 1}`} 
                        className="max-h-full max-w-full object-contain rounded-md shadow-2xl" 
                      />
                      
                      {feedback.attachment_urls.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white border-0 opacity-0 group-hover/lightbox:opacity-100 transition-opacity focus:outline-none"
                            onClick={prevImage}
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white border-0 opacity-0 group-hover/lightbox:opacity-100 transition-opacity focus:outline-none"
                            onClick={nextImage}
                          >
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                            {currentImageIndex + 1} / {feedback.attachment_urls.length}
                          </div>
                        </>
                      )}
                    </div>
                </DialogContent>
              </Dialog>
           </div>
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 flex justify-between items-center border-t border-border/30 bg-muted/5 mt-2">
         <span className="text-[10px] text-muted-foreground/60 font-mono">
            #{feedback.id.substring(0, 6)}
         </span>
         
         <Button
            size="sm"
            variant={feedback.resolved ? "ghost" : "default"}
            onClick={toggleResolve}
            disabled={isUpdating}
            className={`
              h-7 px-3 text-xs font-medium rounded-md transition-all
              ${feedback.resolved 
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              }
            `}
         >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
            ) : feedback.resolved ? (
              <>
                <X className="mr-1.5 h-3 w-3" />
                Re-open
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-3 w-3" />
                Resolve
              </>
            )}
         </Button>
      </CardFooter>
    </Card>
  );
}
