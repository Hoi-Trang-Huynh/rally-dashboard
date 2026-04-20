import { ChatInterface } from "@/components/ai-chat/chat-interface";

export default function AIChatPage() {
  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden bg-linear-to-br from-pink-50/40 via-background to-orange-50/30 dark:from-pink-950/20 dark:via-background dark:to-orange-950/10">
      {/* Decorative blurred blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-pink-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-400/10 blur-3xl" />

      <ChatInterface />
    </div>
  );
}
