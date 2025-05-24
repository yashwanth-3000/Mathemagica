import { generateUUID } from "@/lib/utils";
import { Chat } from "@/components/chat";

export default function ChatPage() {
  const id = generateUUID();
  
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4">
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          selectedChatModel="gpt-4"
          isReadonly={false}
        />
      </div>
    </div>
  );
} 