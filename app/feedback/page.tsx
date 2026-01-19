import { auth } from "@/lib/auth";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { MessageSquare } from "lucide-react";
import { User } from "@/types";

export default async function FeedbackPage() {
  const session = await auth();
  
  // Transform session user to our app's User type if needed, 
  // though they should match based on previous observations.
  const user = session?.user as User | undefined;

  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-6 gap-8 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/30">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Feedback</h1>
            <p className="text-lg text-muted-foreground">User and customer feedback for the team</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
          <FeedbackList currentUser={user} />
        </div>
      </div>
    </div>
  );
}
