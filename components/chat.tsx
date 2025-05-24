'use client';

import { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Message } from 'ai';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  isReadonly: boolean;
}) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    id,
    body: { id, selectedChatModel },
    initialMessages,
  });

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isReadonly && (
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 min-w-0 rounded-md border p-2"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 